//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

abstract contract TestLand {

    bool public publicSaleActive;
    uint256 public publicSaleStartTime;
    uint256 public publicSalePriceLoweringDuration;
    uint256 public publicSaleStartPrice;
    uint256 public publicSaleEndingPrice;
    uint256 public currentNumLandsMintedPublicSale;
    uint256 public mintIndexPublicSaleAndContributors;
    bool private isKycCheckRequired;


    // structs
    struct LandAmount {
        uint256 alpha;
        uint256 beta;
        uint256 publicSale;
        uint256 future;
    }
    struct ContributorAmount {
        address contributor;
        uint256 amount;
    }

    struct Metadata {
        bytes32 metadataHash;
        bytes32 shuffledArrayHash;
        uint256 startIndex;
        uint256 endIndex;
    }

    struct ContractAddresses {
        address alphaContract;
        address betaContract;
        address tokenContract;
    }

    // Public Sale Methods
    function startPublicSale(
        uint256 _publicSalePriceLoweringDuration, 
        uint256 _publicSaleStartPrice, 
        uint256 _publicSaleEndingPrice,
        uint256 _maxMintPerTx,
        uint256 _maxMintPerAddress,
        bool _isKycCheckRequired
    ) virtual external;

    function getMintPrice() virtual external view returns(uint256);

    function mintLands(uint256 numLands, bytes32[] calldata merkleProof) virtual external;
    
}