import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI, SMILIES_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("ws://127.0.0.1:8546")

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const NFT_CONTRACT_ADDRESS = "0xe0901883D567f50bdC0F090eBE7d0bB6D1dfE61F"
const NFT_CONTRACT_ABI = SMILIES_ABI

async function mint(contract: Contract, amount: number, gasPrice: BigNumber) {
    const txn = await contract.mint(amount, {
        value: 0, //sending one ether  
        gasLimit: 120000 * amount, //optional
        gasPrice: gasPrice
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function mintNew(contract: Contract, amount: number, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = await contract.mint(amount, {
        value: ethers.utils.parseEther((0.069 * amount).toString()), //sending one ether  
        gasLimit: 120000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

function isMintAvailable(now: number) {
    return (now >= erc721.publicSaleStartTime)
}

async function updateERC721(contract: Contract) {
    const saleConfig = await contract.saleConfig()
    const publicSaleStartTime = saleConfig.publicSaleStartTime
    const publicPrice = saleConfig.publicPrice
    const publicSaleKey = saleConfig.publicSaleKey
    // console.log(saleConfig)
    const nft = {
        name: await contract.name(),
        maxSupply: parseInt(await contract.collectionSize()),
        totalSupply: parseInt(await contract.totalSupply()),
        price: publicPrice,
        maxPerTx: await contract.maxPerAddressDuringMint(),
        maxPerAccount: await contract.maxPerAddressDuringMint(),
        publicSaleStartTime: publicSaleStartTime,
        publicSaleKey: publicSaleKey,
    }
    return nft
}

var erc721: any = null
var purchased = false

const lastBlockTime: number[] = []

function tearDown() {
  provider.removeAllListeners('block')
  console.log("FCFS completed!")
}

function addBlockTime(blockTime: number) {
  if (lastBlockTime.length < 10) {
    lastBlockTime.push(blockTime)
  } else {
    lastBlockTime.shift()
    lastBlockTime.push(blockTime)
  }
}

function calculateAvgBlockTime() {
    if (lastBlockTime.length == 0) return - 1
    let sum = lastBlockTime[lastBlockTime.length - 1] - lastBlockTime[0]
    let avg = sum / lastBlockTime.length
    return avg
}

async function main() {

    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);

    provider.on('block', async (blockNumber) => {

        if (purchased) {
            tearDown()
            return
        }

        const block = await provider.getBlock(blockNumber)
        // console.log(block)
    
        let blockTime = block['timestamp']
        let avgBlockTime = calculateAvgBlockTime()
        console.log("block: ", blockNumber, "avg block time: ", avgBlockTime)
        addBlockTime(blockTime)

        const feeData = await provider.getFeeData()
        console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        
        erc721 = await updateERC721(nftContract)
        console.log(erc721)
        const publicSaleKey: string = erc721.publicSaleKey
        const price: BigNumber = erc721.price
        const amount: BigNumber = price.gte(ethers.utils.parseEther("0.015")) ? BigNumber.from(0) : price
        console.log("buy ", amount, " ", erc721.name, " for ", ethers.utils.formatEther(price.mul(amount)))
        if (!purchased && isMintAvailable(blockTime + avgBlockTime)) {
            if (amount.eq(0)) {
                console.log("too expensive, give up !!!")
                return
            }
            //mint
            const txn = await nftContract.mint(amount, publicSaleKey, {
                value: price.mul(amount), //sending one ether  
                gasLimit: 150000, //optional
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
            })
            console.log(await provider.waitForTransaction(txn.hash))
            purchased = true
        }
    })
}

main()

function isNotNull(data: any) {
    return data != null
}
