const assert = require("assert");

const Predictions = require("../../../../src/network/webthree/aloecapital/predictions");

describe("Predictions Contract Interface Test", () => {
  it("should retrieve epoch", async () => {
    return Predictions.mainnet
      .epoch()(web3.ganache)
      .then(x => console.log(x));
  });

  it("should retrieve epoch end time", async () => {
    return Predictions.mainnet
      .epochExpectedEndTime()(web3.ganache)
      .then(x => console.log(x));
  });

  it("should do a thing", async () => {
    return Predictions.mainnet
      .summary(0)(web3.ganache)
      .then(x => console.log(x));
  });
});
