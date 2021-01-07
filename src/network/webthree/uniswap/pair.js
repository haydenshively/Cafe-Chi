const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

const SmartContract = require("../smartcontract");

class Pair extends SmartContract {
  name() {
    const method = this._inner.methods.name();
    return this._callerFor(method, ["string"], x => x["0"]);
  }

  symbol() {
    const method = this._inner.methods.symbol();
    return this._callerFor(method, ["string"], x => x["0"]);
  }

  decimals() {
    const method = this._inner.methods.decimals();
    return this._callerFor(method, ["uint8"], x => x["0"]);
  }

  totalSupply() {
    const method = this._inner.methods.totalSupply();
    return this._callerForUint256(method);
  }

  balanceOf(wallet) {
    const method = this._inner.methods.balanceOf(wallet);
    return this._callerForUint256(method);
  }

  allowance(wallet, spender) {
    const method = this._inner.methods.allowance(wallet, spender);
    return this._callerForUint256(method);
  }

  token0() {
    const method = this._inner.methods.token0();
    return this._callerFor(method, ["address"], x => x["0"]);
  }

  token1() {
    const method = this._inner.methods.token1();
    return this._callerFor(method, ["address"], x => x["0"]);
  }

  getReserves() {
    const method = this._inner.methods.getReserves();
    return this._callerFor(method, ["uint112", "uint112", "uint32"], x => [
      Big(x["0"]),
      Big(x["1"])
    ]);
  }

  amount1ReceivedFor(amount0) {
    const method = this._inner.methods.getReserves();
    return this._callerFor(method, ["uint112", "uint112", "uint32"], x => {
      const rChi = Big(x["0"]);
      const rEth = Big(x["1"]);

      const numer = rEth.mul(amount0).mul(997);
      const denom = rChi.mul(1000).plus(Big(997).mul(amount0));
      return numer.div(denom);
    });
  }
}

const addresses = {
  chi_eth: "0xa6f3ef841d371a82ca757FaD08efc0DeE2F1f5e2"
};

const abi = require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
for (let net in addresses) {
  exports[net] = new Pair(addresses[net], abi);
}
