import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, FROYO_KITTIES_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

var purchased = false

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

async function mintNew(contract: Contract, amount: number, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = await contract.mint(amount, {
        value: ethers.utils.parseEther((0.1 * amount).toString()), //sending one ether  
        gasLimit: 240000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

function calculateAvgBlockTime() {
    if (lastBlockTime.length == 0) return - 1
    let sum = lastBlockTime[lastBlockTime.length - 1] - lastBlockTime[0]
    let avg = sum / lastBlockTime.length
    return avg
}

async function doInvest(contract: Contract, blockNumber: number, startTime: number, stopTime: number, blockTime: number, avgBlockTime: number) {
    let countdown = startTime - blockTime
    console.log("startTime: %s, currentBlockTime: %s, %s seconds to go, about %s blocks",
      startTime, blockTime, countdown, countdown / avgBlockTime);
  
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
      const gasPrice = ethers.utils.parseUnits("100", "gwei")
      mintNew(contract, 2, gasPrice, gasPrice, ethers.utils.parseUnits("50", "gwei")).then(result => {
        console.log(result)
        // tearDown()
        // return;
      })
    } else {
      console.log("PublicMint is open to public in %s seconds", countdown)
    }
  }

async function main() {

    const kittiesContract = new Contract("0x22d4c35A4f2B229A928b1b569b2f60225976426A", FROYO_KITTIES_ABI, smartWallet);

    for (let index = 0; index < 23; index++) {
        console.log(index, await provider.getStorageAt("0x22d4c35A4f2B229A928b1b569b2f60225976426A", index))
    }

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === "0x22d4c35A4f2B229A928b1b569b2f60225976426A".toUpperCase() ){
            // && transaction.from?.toUpperCase() === "0x3316BcBfCfc36A8a8551af4371f033223d9756B0".toUpperCase()) {
                console.log(transaction, transaction.gasPrice)
                const gasPrice = transaction.gasPrice!!
                const maxFeePerGas = transaction.maxFeePerGas!!
                const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                mintNew(wuContract, 1, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
            }
        })
    })

    // This filter could also be generated with the Contract or
    // Interface API. If address is not specified, any address
    // matches and if topics is not specified, any log matches
    // const filter = {
    //     address: "0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746",
    //     topics: [

    //     ]
    // }
    // provider.on(filter, async (log, event) => {
    //     console.log("filter:", log, event)
    //     if (log.topics[0] == "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa") {
    //         //Do mint
    //         await mintNew(wuContract, 100, ethers.utils.parseUnits("38", "gwei"), ethers.utils.parseUnits("77", "gwei"), ethers.utils.parseUnits("1.5", "gwei"))
    //     }
    // })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
