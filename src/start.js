require("./setup");

// src.network.webthree
const Wallet = require("./network/webthree/wallet");
const TxQueue = require("./network/webthree/txqueue");
const TxManager = require("./network/webthree/txmanager");

// MARK: SETUP TRANSACTION MANAGERS ---------------------------------
const wallet = new Wallet(
  web3,
  'ALOE_MAINNET_ADDRESS',
  'ALOE_MAINNET_SECRET'
);
const queue = new TxQueue(wallet);
const walletKovan = new Wallet(
  web3kovan,
  'ALOE_KOVAN_ADDRESS',
  'ALOE_KOVAN_SECRET'
);
const queueKovan = new TxQueue(walletKovan);

const txManager = new TxManager(
  queue,
  queueKovan,
  60
);

// Start txManager
txManager.init();

process.on("SIGINT", () => {
  console.log("\nCaught interrupt signal");
  txManager.stop();

  web3.eth.clearSubscriptions();
  try {
    web3.currentProvider.connection.close();
  } catch {
    web3.currentProvider.connection.destroy();
  }

  console.log("Exited cleanly");
  process.exit();
});
