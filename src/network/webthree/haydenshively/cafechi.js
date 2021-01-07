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
  v1_mint140: "0x9dB0987bAAC8EAA684Ff54F836a2368109f1761C",
  v2_mint10: "0xd5B74F6ef00d4Cf1F1dc03b89214fcB654FC31d3"
};

const abi = require("../abis/haydenshively/cafechi.json");
for (let net in addresses) {
  exports[net] = new CafeChi(addresses[net], abi);
}
