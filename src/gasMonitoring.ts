import { BigNumber, Contract, ethers, providers, Signer, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY, PRIVATE_KEY3 } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { OGPASS__factory } from "../typechain-types";

dotenv.config();

// const walletProvider = new providers.JsonRpcProvider("https://rpc.ankr.com/eth")
// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("ws://127.0.0.1:8546")

async function main() {

    
    provider.on("block", async (blockNumber) => {
        // const block = await provider.getBlock(blockNumber)
        // console.log(block)
        const feeData = await provider.getFeeData()
        console.log(blockNumber, ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
