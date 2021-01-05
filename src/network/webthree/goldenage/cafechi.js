const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

const SmartContract = require("../smartcontract");

class CafeChi extends SmartContract {
  arb() {
    return this._txFor(this._inner.methods.arb(), Big(1000000));
  }
}

const addresses = {
  mainnet: "0xd5B74F6ef00d4Cf1F1dc03b89214fcB654FC31d3"
};

const abi = require("../abis/goldenage/cafechi.json");
for (let net in addresses) {
  exports[net] = new CafeChi(addresses[net], abi);
}
