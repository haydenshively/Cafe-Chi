const assert = require("assert");

const GasPrice = require("../../../src/network/web/gasprice");

describe("network/web/gasstation || Gas Price Test", () => {
  const gasPrice = new GasPrice();

  it("should retrieve current gas prices", () => {
    return gasPrice.fetch().then(result => {
      console.log(result);
      for (key in result) {
        assert(result.key !== null);
      }
    });
  });
});
