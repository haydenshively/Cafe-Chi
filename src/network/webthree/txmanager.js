const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

// src.network.webthree
const Predictions = require("./aloecapital/predictions");

class TxManager {
  /**
   * @param {TxQueue} queue The TxQueue to use
   * @param {Number} interval Time between bids (seconds)
   */
  constructor(queueMainnet, queueKovan, interval) {
    this._queue = queueMainnet;
    this._queueKovan = queueKovan;
    this._interval = interval;
  }

  async init() {
    await this._queue.init();
    await this._queue.rebase();
    await this._queueKovan.init();
    await this._queueKovan.rebase();

    this._lastAdvanceKovanNonce = this._queueKovan.nonce(0);

    this._intervalHandle = setInterval(
      this._periodic.bind(this),
      this._interval * 1000
    );

    Predictions.mainnet.subscribeToLogEvent(this._queue._wallet._provider, "FetchedGroundTruth", (err, ev) => {
      console.log(ev);
      const lower = ev['0'];
      const upper = ev['1'];
      const invert = ev['2'];

      const tx = Predictions.kovan.set(lower, upper, invert);
      tx.gasPrice = Big("5000000000");
      this._queueKovan.append(tx);
    });
  }

  /**
   * To be called every `this.interval` seconds
   * @private
   */
  async _periodic() {
    await this._queue.rebase();
    await this._queueKovan.rebase();

    const mainnetEpoch = await Predictions.mainnet.epoch()(this._queue._wallet._provider);
    const mainnetEpochEndTime = await Predictions.mainnet.epochExpectedEndTime()(
      this._queue._wallet._provider
    );

    const shouldAdvanceMainnet = Date.now() / 1000 > Number(mainnetEpochEndTime);
    console.log(`${Number(mainnetEpochEndTime - Date.now() / 1000) / 60} minutes till advance`);
    
    if (shouldAdvanceMainnet) {
      console.log('Should advance mainnet');
      const tx = Predictions.mainnet.advance();
      tx.gasPrice = Big(await this._queue._wallet._provider.eth.getGasPrice()).mul(1.1);
      this._sendIfQueueIsEmpty(this._queue, tx);
      return;
    }

    const kovanNonce = this._queueKovan.nonce(0);
    const kovanEpoch = await Predictions.kovan.epoch()(
      this._queueKovan._wallet._provider
    );
    const shouldAdvanceKovan = (Number(mainnetEpoch) > Number(kovanEpoch)) && (kovanNonce > this._lastAdvanceKovanNonce);

    if (shouldAdvanceKovan) {
      console.log('Should advance kovan');
      const tx = Predictions.kovan.advance();
      tx.gasPrice = Big('5000000000');
      this._sendIfQueueIsEmpty(this._queueKovan, tx);
      this._lastAdvanceKovanNonce = kovanNonce + 1;
      return;
    }
  }

  _sendIfQueueIsEmpty(queue, tx) {
    if (queue.length === 0) queue.append(tx);
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
