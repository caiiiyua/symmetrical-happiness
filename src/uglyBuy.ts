import { ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";
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

// const TRX_DATA = "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"
// const TRX_DATA = "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"
const TRX_DATA = "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"

const NFT_CONTRACT_ADDRESS = "0xca52c16C468624b78bD52431eb1b6856d38e61fF"

const NFT_CONTRACT_ABI = OGPASS__factory.abi
const MAX_TRX_COUNT = 1

const NFT_PRICE = 0.2
const MAX_AMOUNT_PER_TRX = 5
const GAS_PRICE = "345"

const authSigner = Wallet.createRandom();

const GAS_LIMIT = 260000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits(GAS_PRICE, "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits(GAS_PRICE, "gwei")

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
    mintWithData(null)
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
