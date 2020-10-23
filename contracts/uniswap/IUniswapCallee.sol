// SPDX-License-Identifier: GPL
pragma solidity ^0.7.0;

interface IUniswapCallee {
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
