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
          process.env.ACCOUNT_SECRET_1,
          "https://mainnet.infura.io/v3/" + process.env.PROVIDER_INFURA_ID
        ),
      gas: 500000,
      gasPrice: 152e9,
      networkId: "*"
    }
  }
};
