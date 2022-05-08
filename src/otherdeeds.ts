import { BigNumber, Contract, ethers, providers, Signer, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, SMOL_FRENS_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY, PRIVATE_KEY3 } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ADDRESS = "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)


const TRX_DATA = "0x3fa8e1b5000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000011913aad6b160e2f8ef59b2917c969ba7fbfafdc3124472da874de8d37d8fe4b4d195d246c1fc574f6a44270c25af4fff6a5873f3a5b48377a0ec2984f6f69db7450214eaea88f2a9aaef4d34209d4c7fd0c04db94927781e9640e51a205ecf2096faa8f39fcc17b514194aedf5875127f464a4cd6144d5be52c3424885a6c5b281f42868840b9c51bdd074623992fde9703e8ce4a74f96197035b08f1d8d6bb713858652e0d9d4090ce15fed2c5ab3fcee6d18826ba377fa7ea3c9bc96d2505c74b4e96e9ccd246e39b0677b6149b2302c2aa0644d1bec9857e9f37ad35a5e597a9d734cd46f6a4e11038f5fe00804347af2af4f372a208fdbfa4120365a2073edb1cccfdc535ed1adc19dd5fcc12ab07894b5e4d63321a513010be0a3f56328e20c801076763a618de90076de78e3013df39324bad68d065648821c891c278259d7fc85602972cb76e9600b125e216e919264e4277c7aa12980992fe693bcfbb5917308124b9087c491e2b6341ca2f3c5847d88d9f31150351f1d51a38054ef6649f23bf08c422c29ff146aa969fad1adf7a4e080c3851f5db928ef5033341b81446fb43fb562ee35c84abb61efb7bbdf31621d55c14a757352aaa369ebdef383a76a3b0f46fc52190511c494206a9aa393056cb3071e9759131a3fd61bd7375e9d8af5d5b592c8e4bf8cb4ca43603b98b0d6e9954aa31f3a60a07223b71cfb1408764f0e47f439db471d16fd828d6466934fdc22accae62ca3b1c4ce63bb7fd"

const NFT_PRICE = 0
const GAS_LIMIT = 360000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("5920", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("5920", "gwei")

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function mintWithData(signer: Signer) {
    const txn = signer.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: TRX_DATA,
        type: 2,
        value: NFT_PRICE,
        maxFeePerGas: MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_PER_GAS,
        gasLimit: GAS_LIMIT,
        chainId: 1
      })
    console.log(await txn)
}

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

var purchased = false

async function main() {
    mintWithData(smartWallet)
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}