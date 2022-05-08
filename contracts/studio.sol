// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract OGBlockBasedSale is Ownable {
    using SafeMath for uint256;

    event AssignGovernorAddress(address indexed _address);
    event AssignOperatorAddress(address indexed _address);
    event AssignDiscountBlockSize(uint256 size);
    event AssignPriceDecayParameter(
        uint256 _lowerBoundPrice,
        uint256 _priceFactor
    );
    event AssignPrivateSapeCap(uint256 cap);
    event AssignPrivateSalePrice(uint256 price);
    event AssignPublicSaleConfig(uint256 beginBlock, uint256 endBlock);
    event AssignPublicSalePrice(uint256 price);
    event AssignReserveLimit(uint256 limit);
    event AssignSubsequentSaleNextBlock(uint256 _block);
    event AssignSubsequentSaleNextBlockByOperator(uint256 _block);
    event AssignTransactionLimit(uint256 publicSaleLimit);
    event ResetOverridedSaleState();
    event DisableDutchAuction();
    event EnableDucthAuction();
    event EnablePublicSale();
    event ForceCloseSale();
    event ForcePauseSale();

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

    enum OverrideSaleState {
        None,
        Pause,
        Close
    }

    enum SalePhase {
        None,
        Private,
        Public
    }

    OverrideSaleState public overridedSaleState = OverrideSaleState.None;
    SalePhase public salePhase = SalePhase.None;

    address public operatorAddress;

    uint256 public maxPublicSalePerTx = 1;

    uint256 public totalPublicMinted = 0;
    uint256 public totalReserveMinted = 0;
    uint256 public maxSupply = 1000;
    uint256 public maxReserve = 180; //Subject to change per production config

    uint256 public discountBlockSize = 180;
    uint256 public lowerBoundPrice = 0;
    uint256 public publicSalePrice;
    uint256 public priceFactor = 1337500000000000;

    uint256 public nextSubsequentSale = 0;
    uint256 public subsequentSaleBlockSize = 10; //Subject to change per production config
    uint256 public publicSaleCap = 1000;

    struct SaleConfig {
        uint256 beginBlock;
        uint256 endBlock;
    }

    SaleConfig public publicSale;

    modifier operatorOnly() {
        require(
            msg.sender == operatorAddress,
            "Only operator allowed."
        );
        _;
    }

    function setTransactionLimit(uint256 publicSaleLimit)
        external
        operatorOnly
    {
        require(publicSaleLimit > 0);
        maxPublicSalePerTx = publicSaleLimit;
        emit AssignTransactionLimit(publicSaleLimit);
    }

    function setPublicSaleConfig(SaleConfig memory _publicSale)
        external
        operatorOnly
    {
        publicSale = _publicSale;
        emit AssignPublicSaleConfig(
            _publicSale.beginBlock,
            _publicSale.endBlock
        );
    }

    function isPublicSaleSoldOut() external view returns (bool) {
        return supplyWithoutReserve() == totalPublicMinted;
    }

    function enablePublicSale() external operatorOnly {
        salePhase = SalePhase.Public;
        emit EnablePublicSale();
    }

    function setSubsequentSaleBlock(uint256 b) external operatorOnly {
        require(b > 0, "Block number must be greater than 0");
        require(
            b > publicSale.beginBlock,
            "Cannot start before public sale start"
        );
        nextSubsequentSale = b;
        emit AssignSubsequentSaleNextBlockByOperator(b);
    }

    function supplyWithoutReserve() internal view returns (uint256) {
        return (maxReserve > maxSupply) ? 0 : maxSupply.sub(maxReserve);
    }

    function getState() public view virtual returns (SaleState) {
        return
            block.number >= nextSubsequentSale
                ? SaleState.PublicSaleDuring
                : SaleState.PublicSaleBeforeWithBlock;
    }

    function setPublicSaleCap(uint256 cap) external operatorOnly {
        publicSaleCap = cap;
        emit AssignPrivateSapeCap(cap);
    }

    function isSubsequenceSale() public view returns (bool) {
        return  true;
    }

    function getStartSaleBlock() external view returns (uint256) {
        if (
            SaleState.PublicSaleBeforeWithBlock == getState() ||
            SaleState.PublicSaleDuring == getState()
        ) {
            return
                isSubsequenceSale()
                    ? nextSubsequentSale
                    : publicSale.beginBlock;
        }

        return 0;
    }

    function getEndSaleBlock() external view returns (uint256) {
        if (
            SaleState.PublicSaleBeforeWithBlock == getState() ||
            SaleState.PublicSaleDuring == getState()
        ) {
            return publicSale.endBlock;
        }

        return 0;
    }

    function getMaxSupplyByMode() public view returns (uint256) {
        if (getState() == SaleState.PublicSaleDuring) {
            if (isSubsequenceSale()) {
                return 1;
            }
            return publicSaleCap;
        }

        return 0;
    }

    function getMintedByMode() external view returns (uint256) {
        if (getState() == SaleState.PublicSaleDuring) {
            if (isSubsequenceSale()) {
                return 0;
            }
            return totalPublicMinted;
        }
        return 0;
    }

    function getTransactionCappedByMode() external pure returns (uint256) {
        return 1;
    }

    function getPriceByMode() public view returns (uint256) {
        return 0;
    }

}

contract WagyuV2 is
    Ownable,
    ERC721,
    ERC721Enumerable,
    OGBlockBasedSale,
    ReentrancyGuard
{
    using Address for address;
    using SafeMath for uint256;

    event Purchased(address indexed account, uint256 indexed index);
    event MintAttempt(address indexed account, bytes data);
    event PermanentURI(string _value, uint256 indexed _id);
    event WithdrawNonPurchaseFund(uint256 balance);
    uint256 public maxSaleCapped = 1000;

    string public _defaultURI;
    string public _tokenBaseURI;
    mapping(address => bool) private _airdropAllowed;
    mapping(address => uint256) public purchaseCount;

    constructor(
    ) ERC721("TestStudio", "TS") {
        maxSupply = 10000;
        publicSalePrice = 0;
        operatorAddress = msg.sender;
    }

    function mintToken(uint256 amount, bytes calldata signature)
        external
        payable
        nonReentrant
        returns (bool)
    {
        require(msg.sender == tx.origin, "Contract is not allowed.");
        require(
            getState() == SaleState.PublicSaleDuring,
            "Sale not available."
        );

        if (getState() == SaleState.PublicSaleDuring) {
            require(
                amount <= maxPublicSalePerTx,
                "Mint exceed transaction limits."
            );
            require(
                msg.value >= amount.mul(getPriceByMode()),
                "Insufficient funds."
            );
        }

        require(
            purchaseCount[msg.sender] + amount <= maxSaleCapped,
            "Max purchase reached"
        );

        emit MintAttempt(msg.sender, signature);

        if (getState() == SaleState.PublicSaleDuring) {
            _mintToken(msg.sender, amount);
            totalPublicMinted = totalPublicMinted + amount;
            if (isSubsequenceSale()) {
                nextSubsequentSale = block.number + subsequentSaleBlockSize;
            }
        }

        return true;
    }

    function availableForSale() external view returns (uint256) {
        return maxSupply - totalSupply();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external operatorOnly {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        emit WithdrawNonPurchaseFund(balance);
    }

    function _mintToken(address addr, uint256 amount) internal returns (bool) {
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenIndex = totalSupply();
            purchaseCount[addr] += 1;
            if (tokenIndex < maxSupply) {
                _safeMint(addr, tokenIndex + 1);
                emit Purchased(addr, tokenIndex);
            }
        }
        return true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}