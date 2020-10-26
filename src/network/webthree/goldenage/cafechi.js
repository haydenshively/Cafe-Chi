const Big = require("big.js");
Big.DP = 40;
Big.RM = 0;

const SmartContract = require("../smartcontract");

class CafeChi extends SmartContract {
  arb() {
    return this._txFor(this._inner.methods.arb(), Big(7000000));
  }
}

const addresses = {
  mainnet: "0x9dB0987bAAC8EAA684Ff54F836a2368109f1761C"
};

const abi = require("../abis/goldenage/cafechi.json");
for (let net in addresses) {
  exports[net] = new CafeChi(addresses[net], abi);
}
