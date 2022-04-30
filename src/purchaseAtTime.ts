import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, FROYO_KITTIES_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3 } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)
const wallet2 = new ethers.Wallet(PRIVATE_KEY2, provider);
const smartWallet2 = new NonceManager(wallet2)
const wallet3 = new ethers.Wallet(PRIVATE_KEY3, provider);
const smartWallet3 = new NonceManager(wallet3)

var purchased = false

const TRX_DATA = "0x726f68e40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000"

const NFT_CONTRACT_ADDRESS = "0x9f092029aA5c8dCa892C3f031c744e065abfe476"
const MAX_AMOUNT_PER_TRX = 1
const NFT_PRICE = 0 //******************************* CHECK VALUE!!!

const GAS_LIMIT = 250000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("234", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("100", "gwei")

const lastBlockTime: number[] = []

function tearDown() {
  provider.removeAllListeners('block')
  console.log("FCFS on Superlauncher completed!")
}

function addBlockTime(blockTime: number) {
  if (lastBlockTime.length < 10) {
    lastBlockTime.push(blockTime)
  } else {
    lastBlockTime.shift()
    lastBlockTime.push(blockTime)
  }
}

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function mintWithData(wallet: NonceManager, feeData: FeeData | null) {
  const txn = wallet.sendTransaction({
      to: NFT_CONTRACT_ADDRESS,
      data: TRX_DATA!!,
      type: 2,
      value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()),
      maxFeePerGas: (feeData?.maxFeePerGas ?? MAX_PEE_PER_GAS).add(100),
      maxPriorityFeePerGas: (feeData?.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS).add(25),
      gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX,
      chainId: 1
    })
  console.log(await provider.waitForTransaction((await txn).hash))
}

function calculateAvgBlockTime() {
    if (lastBlockTime.length == 0) return - 1
    let sum = lastBlockTime[lastBlockTime.length - 1] - lastBlockTime[0]
    let avg = sum / lastBlockTime.length
    return avg
}

async function doInvest(blockNumber: number, startTime: number, stopTime: number, blockTime: number, avgBlockTime: number, feeData: FeeData) {
    let countdown = startTime - blockTime
    console.log("startTime: %s, currentBlockTime: %s, avgBlocktime: %s, %s seconds to go, about %s blocks",
      startTime, blockTime, avgBlockTime, countdown, countdown / avgBlockTime);
  
    console.log(countdown - avgBlockTime <= 0, blockTime + avgBlockTime >= startTime, countdown / avgBlockTime < 1)
  
    if (blockTime + avgBlockTime >= startTime) {
      if (blockTime >= stopTime) {
        console.log("Pool has been closed...")
        tearDown()
        return;
      }
  
      if (blockTime - startTime >= 240) {
        console.log("It would be too late to buy T_T")
        return;
      }
      mintWithData(smartWallet, feeData)
      mintWithData(smartWallet2, feeData)
      mintWithData(smartWallet3, feeData)
    } else {
      console.log("PublicMint is open to public in %s seconds", countdown)
    }
  }

const startTime = 1651086000
const endTime = startTime + 30
async function main() {
    const feeData = await provider.getFeeData()
    console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    provider.on("block", async (blockNumber) => {
      const block = await provider.getBlock(blockNumber)
        const blockTime = block['timestamp']
        // console.log(`current block time ${blockTime} startSale at: ${startTime} ${startTime - blockTime} sec left`)
        
        addBlockTime(blockTime)
        const avgBlockTime = calculateAvgBlockTime()
      
        doInvest(blockNumber, startTime, endTime, blockTime, avgBlockTime, feeData)
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
