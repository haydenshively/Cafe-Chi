const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

// src.network.webthree
const CafeChi = require("./haydenshively/cafechi");
const Pair = require("./uniswap/pair");

class TxManager {
  /**
   * @param {TxQueue} queue The TxQueue to use
   * @param {Number} interval Time between bids (seconds)
   * @param {Number} maxPending Maximum number of pending txs
   * @param {Number} gpFactor Max gas price gets multiplied by this
   */
  constructor(queue, interval, maxPending, gpFactor) {
    this._queue = queue;
    this._interval = interval;
    this._maxPending = maxPending;
    this._gpFactor = gpFactor;
  }

  async init() {
    await this._queue.init();
    await this._queue.rebase();

    this._intervalHandle = setInterval(
      this._periodic.bind(this),
      this._interval * 1000
    );
  }

  /**
   * To be called every `this.interval` seconds
   * @private
   */
  async _periodic() {
    const tx = CafeChi.v2_mint10.arb();
    tx.gasLimit = Big(await this._queue._wallet.estimateGas(tx));

    const revenue = await Pair.chi_eth.amount1ReceivedFor(10)(
      this._queue._wallet._provider
    );
    const maxGasPrice = revenue.div(tx.gasLimit);
    tx.gasPrice = maxGasPrice.mul(this._gpFactor);

    this._sendAtFirstPossibleNonce(tx);
    this._queue.rebase();
  }

  /**
   * Take the subset of existing transactions with gas price's lower
   * than tx.gasPrice, and replace the one with the lowest nonce. If
   * none exist, send a new one at the next available nonce.
   * 
   * @param {Object} tx an object describing the transaction
   * @private
   */
  _sendAtFirstPossibleNonce(tx) {
    for (let i = 0; i < this._queue.length; i++) {
      const existingTx = this._queue.tx(i);
      if (tx.gasPrice.gte(existingTx.gasPrice.mul(1.10))) {
        this._queue.replace(i, tx, "as_is");
        return;
      }
    }
    if (this._queue.length < this._maxPending) this._queue.append(tx);
  }

  /**
   * Replaces all known pending transactions with empty transactions.
   * Intended to be run when terminating the process
   */
  dumpAll() {
    for (let i = 0; i < this._queue.length; i++) this._queue.dump(i);
  }

  /**
   * Dumps all transactions via `dumpAll()`,
   * then cancels the periodic bidding function.
   * Should be called before exiting the program
   */
  stop() {
    this.dumpAll();
    clearInterval(this._intervalHandle);
  }
}

module.exports = TxManager;
