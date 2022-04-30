//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

interface Ugly {
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
    function getPriceByMode() external view returns (uint256);
    function getMintedByMode() external view returns (uint256);
    function getMaxSupplyByMode() external view returns (uint256);
    function availableForSale() external view returns (uint256);
    function startPublicSaleBlock() external view returns (uint256);
    function discountBlockSize() external view returns (uint256);
}