const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    ganache: {
      protocol: "http",
      host: "localhost",
      port: 8545,
      gas: 6000000,
      gasPrice: 45e9,
      networkId: "*"
    },
    production: {
      provider: () =>
        new HDWalletProvider(
          process.env.ACCOUNT_SECRET,
          "https://mainnet.infura.io/v3/" + process.env.PROVIDER_INFURA_ID
        ),
      gas: 140*36609 + 60000,
      gasPrice: 14e9,
      networkId: "*"
    }
  }
};
