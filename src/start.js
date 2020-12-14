require("./setup");

// src.network.webthree
const Wallet = require("./network/webthree/wallet");
const TxQueue = require("./network/webthree/txqueue");
const TxManager = require("./network/webthree/txmanager");

// MARK: LOAD AND VERIFY CONFIG.JSON --------------------------------
if (process.argv.length < 3) {
  console.error("Please pass path to config*.json");
  process.exit();
}
const config = require(process.argv[2]);

// MARK: SETUP TRANSACTION MANAGERS ---------------------------------
let txManagers = {};
for (let key in config.txManagers) {
  const txManagerConfig = config.txManagers[key];

  // Construct a txManager
  const wallet = new Wallet(
    web3,
    txManagerConfig.envKeyAddress,
    txManagerConfig.envKeySecret
  );
  const queue = new TxQueue(wallet);
  const txManager = new TxManager(
    queue,
    txManagerConfig.interval,
    Number(txManagerConfig.numPending),
    Number(txManagerConfig.ratio)
  );

  // Start txManager
  txManager.init();
  // Store txManager
  txManagers[key] = txManager;
}

process.on("SIGINT", () => {
  console.log("\nCaught interrupt signal");
  for (key in txManagers) txManagers[key].stop();

  web3.eth.clearSubscriptions();
  try {
    web3.currentProvider.connection.close();
  } catch {
    web3.currentProvider.connection.destroy();
  }

  console.log("Exited cleanly");
  process.exit();
});
