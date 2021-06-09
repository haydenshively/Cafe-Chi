const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

const SmartContract = require("../smartcontract");

class Predictions extends SmartContract {
  advance() {
    return this._txFor(this._inner.methods.advance(), Big(1000000));
  }

  set(lower, upper, invert) {
    return this._txFor(
      this._inner.methods.set([lower, upper], invert),
      Big(200000)
    );
  }

  epochExpectedEndTime() {
    const method = this._inner.methods.epochExpectedEndTime();
    return this._callerFor(method, ["uint32"], x => x["0"]);
  }

  epoch() {
    const method = this._inner.methods.epoch();
    return this._callerFor(method, ["uint24"], x => x["0"]);
  }

  summary(epoch) {
    const method = this._inner.methods.summaries(epoch);
    return this._callerFor(method, ["uint176", "uint176"], x => x);
  }
}

const abiKovan = require("../abis/aloecapital/PredictionsKovan.json");
const abiMainnet = require("../abis/aloecapital/PredictionsMainnet.json");

const addresses = {
  kovan: "0x0C9C402ee16aF7B389De11dA963E9A26a67e6e4B",
  mainnet: "0xe08d86fc31B497e79d321857248BEe230f4c9953"
};

const abis = {
  kovan: abiKovan,
  mainnet: abiMainnet
};

for (let net in addresses) {
  exports[net] = new Predictions(addresses[net], abis[net]);
}
