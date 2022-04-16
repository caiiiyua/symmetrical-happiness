//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

interface 0xOG {
    function mintToken(uint256 amount, bytes calldata signature) external payable returns (bool);
    function getTransactionCappedByMode() external view returns (uint256);
    function startPublicSaleBlock() external view returns (uint256);
}