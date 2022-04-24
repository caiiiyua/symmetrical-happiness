import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { OGPASS__factory } from "../typechain-types";

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

const TRX_DATA = "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"

const NFT_CONTRACT_ADDRESS = "0x5b7622DED96511639DdC12C86eb2703331cA2c78"
const NFT_PRICE = 1.8
const NFT_CONTRACT_ABI = OGPASS__factory.abi
const MAX_TRX_COUNT = 1
const MAX_AMOUNT_PER_TRX = 1

const authSigner = Wallet.createRandom();

const GAS_LIMIT = 260000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("345", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("345", "gwei")

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function mintWithData(feeData: FeeData | null) {
    const txn = smartWallet.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: TRX_DATA!!,
        type: 2,
        value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()),
        maxFeePerGas: feeData?.maxFeePerGas ?? MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS,
        gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX,
        chainId: 1
      })
    console.log(await txn)
}

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));

    var nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())

    provider.on("block", async (blockNumber) => {
        const block = await provider.getBlock(blockNumber)
        // console.log(block)
        // const feeData = await provider.getFeeData()
        // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        const maxPerTx = 1
        const saleState = await nftContract.getState()
        console.log("block: ", blockNumber, " maxPerTx: ", maxPerTx, " saleState: ", saleState, " still ", nextSequenceBlock - blockNumber, " blocks to go")
        if (blockNumber == nextSequenceBlock - 1) {
            console.log("Get ready to mint.....")
            mintWithData(null)
        }
        nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
