require("dotenv").config();

global.inCI = process.env.CI;

// configure web3
global.web3 = {};
const { MultiSendProvider } = require("../src/network/webthree/providers");
const infura = {
  type: "WS_Infura",
  envKeyID: "PROVIDER_INFURA_ID" // This is the name of the env variable storing the ID, NOT THE ID ITSELF
};
const alchemy = {
  type: "WS_Alchemy",
  envKeyKey: "PROVIDER_ALCHEMY_KEY" // This is the name of the env variable storing the key, NOT THE KEY ITSELF
};
web3.mainnet = new MultiSendProvider("mainnet", [infura, alchemy]);
// configure ganache
const Web3 = require("web3");
const ganache = require("ganache-cli");
// note that ganache does not currently support replacement transactions
web3.ganache = new Web3(
  ganache.provider({
    port: 8546,
    fork: web3.mainnet.providers[0]
  })
);

after(() => {
  for (let chain in web3) {
    web3[chain].eth.clearSubscriptions();
    if (chain === "ganache") continue;
    try {
      web3[chain].currentProvider.connection.close();
    } catch {
      try {
        web3[chain].currentProvider.connection.destroy();
      } catch {}
    }
  }
});
