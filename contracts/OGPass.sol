//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

interface OGPASS {
    struct SaleConfig {
        uint256 beginBlock;
        uint256 endBlock;
    }
    enum SaleState {
        NotStarted,
        PrivateSaleBeforeWithoutBlock,
        PrivateSaleBeforeWithBlock,
        PrivateSaleDuring,
        PrivateSaleEnd,
        PrivateSaleEndSoldOut,
        PublicSaleBeforeWithoutBlock,
        PublicSaleBeforeWithBlock,
        PublicSaleDuring,
        PublicSaleEnd,
        PublicSaleEndSoldOut,
        PauseSale,
        AllSalesEnd
    }
    function mintToken(uint256 amount, bytes calldata signature) external payable returns (bool);
    function getTransactionCappedByMode() external view returns (uint256);
    function getState() view external returns (SaleState);
    function setPublicSaleConfig(SaleConfig memory _publicSale) external;
    function nextSubsequentSale() external view returns (uint256);
}