//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

interface WUContract {
    function mint(uint256 mintedAmount) external payable;
}