import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY3, PRIVATE_KEY2, PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";

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

// const TRX_DATA = "0xa0712d68000000000000000000000000000000000000000000000000000000000000000a"
const TRX_DATA = "0xb774cf9000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"

const NFT_CONTRACT_ADDRESS = "0x28AC3cf5E3313f6DE9E9C31439b32dBD5b6aAB19"
const NFT_CONTRACT_ABI = HAKI_ABI
const MAX_TRX_COUNT = 1
const MAX_AMOUNT_PER_TRX = 3
const NFT_PRICE = 0 //******************************* CHECK VALUE!!!

const GAS_LIMIT = 140000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("34", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("2", "gwei")

async function mintWithData(feeData: FeeData) {
    const txn = smartWallet.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: TRX_DATA!!,
        type: 2,
        value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()),
        maxFeePerGas: feeData.maxFeePerGas ?? MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS,
        gasLimit: GAS_LIMIT,
        chainId: 1
      })
    console.log(await txn)
}

async function mint(contract: Contract, feeData: FeeData) {
    const txn = await contract.mint(MAX_AMOUNT_PER_TRX, {
        value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()), //sending one ether  
        gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX, //optional
        maxFeePerGas: feeData.maxFeePerGas ?? MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    
    const feeData = await provider.getFeeData()
    console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    for (let index = 0; index < MAX_TRX_COUNT; index++) {
        if (TRX_DATA) {
            console.log("Sending transaction wiht raw data", index + 1)
            mintWithData(feeData)
        } else {
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, smartWallet);
            console.log("Sending transaction with method", index + 1)
            mint(nftContract, feeData)
        }
    }
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
