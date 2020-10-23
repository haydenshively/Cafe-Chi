module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 6000000,
      gasPrice: 45e9,
      networkId: '*',
    },
  },
};
