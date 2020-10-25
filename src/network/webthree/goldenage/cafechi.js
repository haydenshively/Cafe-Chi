const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

const Web3Utils = require("web3-utils");

const SmartContract = require("../smartcontract");

class CafeChi extends SmartContract {
  arb() {
    return this._txFor(this._inner.methods.arb());
  }


  liquidateSNWithPrice(
    messages,
    signatures,
    symbols,
    borrowers,
    repayCTokens,
    seizeCTokens,
    gasPrice,
    chi = false
  ) {
    const cTokens = this._combineTokens(repayCTokens, seizeCTokens);
    let method = chi
      ? this._inner.methods.liquidateSNWithPriceChi
      : this._inner.methods.liquidateSNWithPrice;
    method = method(messages, signatures, symbols, borrowers, cTokens);
    // TODO we cheat here by just estimating gas for first candidate since
    // that's all that TxManager cares about at the moment.
    const gasLimit = this._estimateGas(repayCTokens[0], seizeCTokens[0], true);
    return this._txFor(method, gasLimit, gasPrice);
  }

  /**
   * Performs liquidation on multiple accounts (SEND -- uses gas)
   *
   * @param {Array<String>} borrowers addresses of users with negative liquidity
   * @param {Array<String>} repayCTokens address of token to repay
   * @param {Array<String>} seizeCTokens address of token to seize
   * @param {Number} gasPrice the gas price to use, in gwei
   * @return {Object} the transaction object
   */
  liquidateSN(borrowers, repayCTokens, seizeCTokens, gasPrice, chi = false) {
    const cTokens = this._combineTokens(repayCTokens, seizeCTokens);
    let method = chi
      ? this._inner.methods.liquidateSNChi
      : this._inner.methods.liquidateSN;
    method = method(borrowers, cTokens);
    // TODO we cheat here by just estimating gas for first candidate since
    // that's all that TxManager cares about at the moment.
    const gasLimit = this._estimateGas(repayCTokens[0], seizeCTokens[0]);
    return this._txFor(method, gasLimit, gasPrice);
  }

  liquidateSWithPrice(
    messages,
    signatures,
    symbols,
    borrower,
    repayCToken,
    seizeCToken,
    gasPrice,
    chi = false
  ) {
    let method = chi
      ? this._inner.methods.liquidateSWithPriceChi
      : this._inner.methods.liquidateSWithPrice;
    method = method(
      messages,
      signatures,
      symbols,
      borrower,
      repayCToken,
      seizeCToken
    );
    const gasLimit = this._estimateGas(repayCToken, seizeCToken, true);
    return this._txFor(method, gasLimit, gasPrice);
  }

  liquidateS(borrower, repayCToken, seizeCToken, gasPrice, chi = false) {
    let method = chi
      ? this._inner.methods.liquidateSChi
      : this._inner.methods.liquidateS;
    method = method(borrower, repayCToken, seizeCToken);
    const gasLimit = this._estimateGas(repayCToken, seizeCToken);
    return this._txFor(method, gasLimit, gasPrice);
  }

  /**
   * Performs liquidation (SEND -- uses gas)
   *
   * @param {string} borrower address of any user with negative liquidity
   * @param {string} repayCToken address of token to repay
   * @param {string} seizeCToken address of token to seize
   * @param {Big} amount debt to repay, in units of the ordinary asset
   * @param {Number} gasPrice the gas price to use, in gwei
   * @return {Promise<Object>} the transaction object
   */
  liquidate(borrower, repayCToken, seizeCToken, amount, gasPrice) {
    const hexAmount = Web3Utils.toHex(amount.toFixed(0));
    const method = this._inner.methods.liquidate(
      borrower,
      repayCToken,
      seizeCToken,
      hexAmount
    );
    const gasLimit = this._estimateGas(repayCToken, seizeCToken, false, false);
    return this.txFor(method, gasLimit, gasPrice);
  }

  _combineTokens(repayList, seizeList) {
    let cTokens = [];
    for (let i = 0; i < repayList.length; i++)
      cTokens.push(repayList[i], seizeList[i]);
    return cTokens;
  }

  _estimateGas(
    repayCToken,
    seizeCToken,
    postPrices = false,
    solveAmount = true
  ) {
    let gas = Big(GAS_CUSHION);

    // NOTE: we assume everything is lowercase when comparing addresses
    if (repayCToken === CETH) gas = gas.plus(GAS_ETH2TOKEN);
    else if (seizeCToken === CETH) gas = gas.plus(GAS_TOKEN2ETH);
    // TODO The following conditional should really have an `or` clause to account
    // for cases where Uniswap has sufficient liquidity to go straight from repay
    // to seize without using Eth as an intermediate, but that's difficult to compute
    else if (repayCToken === seizeCToken) gas = gas.plus(GAS_TOKEN2TOKEN);
    else gas = gas.plus(GAS_TOKEN2TOKEN2ETH);

    if (V2S.includes(repayCToken) || V2S.includes(seizeCToken))
      gas = gas.plus(GAS_V2_PENALTY);
    if (postPrices) gas = gas.plus(GAS_ORACLE);
    if (solveAmount) gas = gas.plus(GAS_COMPUTE_AMOUNT);

    return gas;
  }
}

const addresses = {
  mainnet: "0x9dB0987bAAC8EAA684Ff54F836a2368109f1761C"
};

const abi = require("../abis/goldenage/cafechi.json");
for (let net in addresses) {
  exports[net] = new CafeChi(addresses[net], abi);
}
