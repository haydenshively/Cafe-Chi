const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;
const winston = require("winston");

// src.network.web
const GasPrice = require("../web/gasprice");
// src.network.webthree
const CafeChi = require("./goldenage/cafechi");


class TxManager {
  /**
   * @param {TxQueue} queue The TxQueue to use
   * @param {Number} interval Time between bids (seconds)
   */
  constructor(queue, interval) {
    this._queue = queue;
    this.interval = interval;

    this._tx = null;
  }

  async init() {
    await this._queue.init();
    await this._queue.rebase();

    this._intervalHandle = setInterval(
      this._periodic.bind(this),
      this.interval * 1000
    );
  }

  _removeCandidate(address) {
    delete this._candidates[address.toLowerCase()];
    winston.info(`🧮 *TxManager* | Removed ${address.slice(0, 6)}`);
  }

  _removeStaleCandidates(updatePeriod) {
    const now = Date.now();

    for (let addr in this._candidates) {
      if (now - this._candidates[addr].lastSeen <= updatePeriod) continue;
      this._removeCandidate(addr);
    }
  }

  async _cacheTransaction() {
    let borrowers = [];
    let repayCTokens = [];
    let seizeCTokens = [];
    let revenue = 0;
    let needPriceUpdate = false;

    let candidates = Object.entries(this._candidates);
    candidates = candidates.sort((a, b) => b[1].revenue - a[1].revenue);

    for (let entry of candidates) {
      const c = entry[1];

      borrowers.push(entry[0]);
      repayCTokens.push(c.repayCToken);
      seizeCTokens.push(c.seizeCToken);
      revenue += c.revenue;
      needPriceUpdate |= c.needsPriceUpdate;
    }

    if (borrowers.length === 0) {
      this._tx = null;
      return;
    }
    // Set expected revenue to the max of the candidate revenues
    this._revenue = candidates[0][1].revenue;
    const initialGasPrice = this._tx !== null ? this._tx.gasPrice : null;

    // NOTE: right now, we assume that only 1 borrower will be liquidated
    // (the first one in the list). We let Liquidator.js set the gas limit
    // accordingly. If that borrower can't be liquidated for some reason,
    // the smart contract will handle fallback options, so we don't have to
    // worry about that here

    if (!needPriceUpdate) {
      this._tx = Liquidator.mainnet.liquidateSN(
        borrowers,
        repayCTokens,
        seizeCTokens,
        initialGasPrice
      );
      // Override gas limit
      this._tx.gasLimit = Big(await this._queue._wallet.estimateGas(this._tx));
      // Override gas price
      if (this._tx.gasPrice === null)
        this._tx.gasPrice = await this._getInitialGasPrice(this._tx.gasLimit);
      return;
    }

    // Technically, if oracle is null and some (but not all) candidates
    // need price updates, we should filter out candidates that need price
    // updates and send the rest using the function above. However, that
    // shoudn't happen very often (`_oracle` is only null on code startup),
    // so it's safe to ignore that case.
    if (this._oracle === null) {
      this._tx = null;
      return;
    }

    const postable = this._oracle.postableData();
    this._tx = Liquidator.mainnet.liquidateSNWithPrice(
      postable[0],
      postable[1],
      postable[2],
      borrowers,
      repayCTokens,
      seizeCTokens,
      initialGasPrice
    );
    // Override gas limit
    this._tx.gasLimit = Big(await this._queue._wallet.estimateGas(this._tx));
    // Override gas price
    if (this._tx.gasPrice === null)
      this._tx.gasPrice = await this._getInitialGasPrice(this._tx.gasLimit);
  }

  /**
   * To be called every `this.interval` milliseconds.
   * Sends `this._tx` if non-null and profitable
   * @private
   */
  _periodic() {
    if (this._tx === null) {
      this.dumpAll();
      return;
    }
    this._sendIfProfitable(this._tx);
  }

  /**
   * Sends `tx` to queue as long as its gas price isn't so high that it
   * would make the transaction unprofitable
   * @private
   *
   * @param {Object} tx an object describing the transaction
   */
  _sendIfProfitable(tx) {
    // First, check that current gasPrice is profitable. If it's not (due
    // to network congestion or a recently-removed candidate), then replace
    // any pending transactions with empty ones.
    let fee = TxManager._estimateFee(this._tx);
    if (fee.gt(this.maxFee_Eth) || fee.gt(this._revenue)) {
      this.dumpAll();
      return;
    }

    // If there are no pending transactions, start a new one
    if (this._queue.length === 0) {
      this._queue.append(tx);
      return;
    }

    // If there's already a pending transaction, check whether raising
    // the gasPrice (re-bidding) results in a still-profitable tx. If it
    // does, go ahead and re-bid.
    const newTx = { ...tx };
    // Pass by reference, so after dry run, tx.gasPrice will be updated...
    this._queue.replace(0, newTx, "clip", /*dryRun*/ true);

    fee = TxManager._estimateFee(newTx);
    if (fee.gt(this.maxFee_Eth) || fee.gt(this._revenue)) return;

    this._queue.replace(0, tx, "clip");
    tx.gasPrice = newTx.gasPrice;
  }

  /**
   * Computes `gasPrice * gasLimit` and returns the result in Eth,
   * assuming that `gasPrice` was given in Wei
   * @static
   *
   * @param {Object} tx an object describing the transaction
   * @returns {Big} estimates transaction fee
   */
  static _estimateFee(tx) {
    return tx.gasPrice.times(tx.gasLimit).div(1e18);
  }

  /**
   * Gets the current market-rate gas price from the Web3 provider,
   * then adjusts it so that it lies on the exponential curve that
   * leads to the maximum possible gas price (assuming constant 12%
   * bid raises)
   * @private
   *
   * @param gasLimit {Big} the gas limit of the proposed transaction
   * @returns {Big} the gas price in Wei
   */
  async _getInitialGasPrice(gasLimit) {
    const maxGasPrice = Big(Math.min(this._revenue, this.maxFee_Eth))
      .times(1e18)
      .div(gasLimit);

    let gasPrice = Big(await this._queue._wallet._provider.eth.getGasPrice());
    if (gasPrice.gte(maxGasPrice)) return gasPrice;

    let n = 0;
    while (gasPrice.lt(maxGasPrice)) {
      gasPrice = gasPrice.times(1.12);
      n++;
    }
    // log base 1.12 of 2 is 6.11625. If it's profitable to start bidding at
    // twice the market rate, this'll do that
    if (n > 6.11625) n -= 6.11625;

    return maxGasPrice.div(Math.pow(1.12, n));
    /*
    TODO
    
    Note that this will only force the exponential thing for the _first_ candidate
    that gets sent off to the smart contract. If more candidates are added to
    later bids, the condition no longer necessarily holds.

    To make it apply to those cases as well, (1) the logic would have to be moved
    elsewhere (probably to the `cacheTransaction` function) and (2) upon addition of
    a new candidate, check whether that new candidate is the most profitable
    (idx 0 in the `borrowers` array). If it is, then have some logic that decides
    whether hopping up to a new exponential curve makes sense given how close/far
    we are from `maxFee`
    */
  }

  /**
   * Replaces all known pending transactions with empty transactions.
   * Intended to be run when terminating the process
   */
  dumpAll() {
    for (let i = 0; i < this._queue.length; i++) this._queue.dump(i);
  }

  /**
   * Clears candidates and dumps existing transactions
   */
  reset() {
    this._candidates = {};
    this._revenue = 0.0; // in Eth
    this._tx = null;

    this.dumpAll();
  }

  /**
   * Calls `reset()` to clear candidates and dump transactions,
   * then cancels the periodic bidding function.
   * Should be called before exiting the program
   */
  stop() {
    this.reset();
    clearInterval(this._intervalHandle);
  }
}

module.exports = TxManager;
