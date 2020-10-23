// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "./uniswap/IUniswapCallee.sol";
import "./uniswap/IUniswapPair.sol";
import "./uniswap/IWETH.sol";

interface ICHI {
    function transfer(address recipient, uint amount) external returns (bool);
    function mint(uint value) external;
}


contract CafeChi is IUniswapCallee {

  address private constant CHI = 0x0000000000004946c0e9F43F4Dee607b0eF1fA1c;
  address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address private constant PAIR = 0xa6f3ef841d371a82ca757FaD08efc0DeE2F1f5e2;

  receive() external payable {}

  function arb() external {
    (uint112 reserveCHI, uint112 reserveWETH, ) = IUniswapPair(PAIR).getReserves();
    uint debtCHI = 140 * 997;
    uint amount1 = (debtCHI * reserveWETH) / (1000 * reserveCHI + debtCHI);
    IUniswapPair(PAIR).swap(0, amount1, address(this), abi.encode(0x01));
  }

  /**
    * The function that gets called in the middle of a flash swap
    *
    * @param sender (address): the caller of `swap()`
    * @param amount0 (uint): the amount of token0 being borrowed
    * @param amount1 (uint): the amount of token1 being borrowed
    * @param data (bytes): data passed through from the caller
    */
  function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) override external {
    // token1 is WETH; require profitability
    require(amount1 > gasleft() * tx.gasprice, "CafeChi: Unprofitable");
    // token0 is CHI; we're minting this so no need to borrow
    require(amount0 == 0, "CafeChi: Borrowed Chi");
    // ensure nobody but PAIR calls this function
    require(msg.sender == PAIR, "CafeChi: Black hat");

    // send ETH to original caller
    IWETH(WETH).withdraw(amount1);
    tx.origin.transfer(address(this).balance);

    // mint CHI and pay back Uniswap
    ICHI(CHI).mint(140);
    ICHI(CHI).transfer(PAIR, 140);
  }
}
