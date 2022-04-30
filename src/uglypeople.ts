import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Ugly__factory } from "../typechain-types"

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const walletProvider = new providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/zNXb2wL-bHl57-13FfTiL9XSH-m88C4M")
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546", 1)


const NFT_CONTRACT_ABI = Ugly__factory.abi
const NFT_CONTRACT_ADDRESS = "0xca52c16C468624b78bD52431eb1b6856d38e61fF"

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal))

    provider.on("block", async (blockNumber) => {    
        const nft = {
            maxSupply: await nftContract.getMaxSupplyByMode(), 
            totalSupply: await nftContract.getMintedByMode(),//ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
            price: await nftContract.getPriceByMode(),
            maxPerTx: parseInt(ethers.utils.formatUnits(await nftContract.getTransactionCappedByMode(), 0)),
            available: await nftContract.availableForSale(),
            state: await nftContract.getState(),
            startBlock: await nftContract.startPublicSaleBlock(),
            discountBlockSize: await nftContract.discountBlockSize()
        }
    
        const maxSupply = ethers.utils.formatUnits(nft.maxSupply, 0)
        const totalSupply = ethers.utils.formatUnits(nft.totalSupply, 0)
        const price = parseFloat(ethers.utils.formatUnits(nft.price, 18))
        const maxPerTx = nft.maxPerTx
        const available = ethers.utils.formatUnits(nft.available, 0)
        const passedBlock = blockNumber - nft.startBlock
        const nextDiscountIn = passedBlock % nft.discountBlockSize
        const nextPrice = ((passedBlock + 1) % nft.discountBlockSize) == 0 ? (price - 0.1) : price
        console.log(passedBlock, "blocks passed,", nextDiscountIn, "blocks next discount,", available, "left, price:", price, "-->", nextPrice, " maxPerTx: ", maxPerTx)
    })

}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
