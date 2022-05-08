import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { OGPASS__factory } from "../typechain-types";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
const walletProvider = new providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/zNXb2wL-bHl57-13FfTiL9XSH-m88C4M")
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const walletProvider = new providers.JsonRpcProvider("https://rpc.ankr.com/eth")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546", 1)

const provider = walletProvider

const FLASHBOT_RPC_ENDPOINT = "https://relay.flashbots.net"
const NFT_CONTRACT_ABI = OGPASS__factory.abi
const NFT_CONTRACT_ADDRESS = "0x5b7622DED96511639DdC12C86eb2703331cA2c78"

const wallet = new ethers.Wallet(PRIVATE_KEY, walletProvider);
const smartWallet = new NonceManager(wallet)

const authSigner = Wallet.createRandom();

async function main() {
    console.log(authSigner)
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
