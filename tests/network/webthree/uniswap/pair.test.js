const assert = require("assert");

const Pair = require("../../../../src/network/webthree/uniswap/pair");

describe("network/webthree/uniswap || Pair Test", () => {
  it("should retrieve name", async () => {
    return Pair.chi_eth
      .name()(web3.ganache)
      .then(x => assert(x === "Uniswap V2"));
  });

  it("should retrieve decimals", async () => {
    return Pair.chi_eth
      .decimals()(web3.ganache)
      .then(x => assert(x === "18"));
  });

  it("should retrieve token0", async () => {
    return Pair.chi_eth
      .token0()(web3.ganache)
      .then(x => assert(x === "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c"));
  });

  it("should retrieve token1", async () => {
    return Pair.chi_eth
      .token1()(web3.ganache)
      .then(x => assert(x === "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"));
  });

  it("should retrieve reserves", async () => {
    return Pair.chi_eth
      .getReserves()(web3.ganache)
      .then(x => assert(x[1].gt(x[0])));
  });

  it("should compute amount received", async () => {
    return Pair.chi_eth
      .amount1ReceivedFor(10)(web3.ganache)
      .then(x => console.log(x.div(1e18).toFixed(5)));
  });
});
