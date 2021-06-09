require("dotenv").config();

// configure web3
const { ProviderFor } = require("./network/webthree/providers");
global.web3 = ProviderFor("mainnet", {
  type: "WS_Alchemy",
  envKeyPath: "PROVIDER_IPC_PATH",
  envKeyKey: "PROVIDER_ALCHEMY_KEY"
});
global.web3kovan = ProviderFor("kovan", {
  type: "HTTP_Alchemy",
  envKeyKey: "PROVIDER_ALCHEMY_KEY_KOVAN"
});

// configure winston
const winston = require("winston");
const SlackHook = require("../src/logging/slackhook");
winston.configure({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({ handleExceptions: true }),
    // new SlackHook({
    //   level: "info",
    //   webhookUrl: process.env.SLACK_WEBHOOK,
    //   mrkdwn: true
    // })
  ],
  exitOnError: false
});
