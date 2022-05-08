import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3, PRIVATE_KEY_FLASHBOT } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { OGPASS__factory } from "../typechain-types";
import { FlashbotsBundleProvider, FlashbotsTransactionResponse, RelayResponseError } from "@flashbots/ethers-provider-bundle";

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

const wallet2 = new ethers.Wallet(PRIVATE_KEY3, walletProvider);
const wallet = new ethers.Wallet(PRIVATE_KEY, walletProvider);
const smartWallet = new NonceManager(wallet)

const authSigner = new ethers.Wallet(PRIVATE_KEY_FLASHBOT);

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const NFT_PRICE = ethers.utils.parseEther("1.8")
const START_BLOCKS_AHEAD = 3
const STEP = 1661
var TARGET_BLOCK = 14605180
// const PRIORITY_FEE = ethers.utils.parseUnits("11666.6", "gwei")
const PRIORITY_FEE = ethers.utils.parseUnits("5555", "gwei")
const PRIORITY_FEE2 = ethers.utils.parseUnits("790", "gwei")

async function main() {

    const block = await provider.getBlockNumber()
    console.log(block)

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        walletProvider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
        authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
        // FLASHBOT_RPC_ENDPOINT
    )
    const unsignedTx = {
        to: NFT_CONTRACT_ADDRESS,
        data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
        chainId: 1,
        type: 2,
        value: NFT_PRICE,
        gasLimit: 250000,
        maxFeePerGas: PRIORITY_FEE,//PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
        maxPriorityFeePerGas: PRIORITY_FEE,
        nonce: 775
    }
    const unsignedTx2 = {
        to: NFT_CONTRACT_ADDRESS,
        data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
        chainId: 1,
        nonce: 41,
        value: NFT_PRICE,
        gasLimit: 260000,
        gasPrice: PRIORITY_FEE2,//PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
    }
    console.log(unsignedTx)
    const transactionBundle = [
        {
            signer: smartWallet, // ethers signer
            transaction: unsignedTx // ethers populated transaction object
        },
        {
            signer: wallet2, // ethers signer
            transaction: unsignedTx2 // ethers populated transaction object
        },
    ]
    const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
    // const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
    const simulation = await flashbotsProvider.simulate(signedTransactions, 14719793, 14719792)
    console.log(JSON.stringify(simulation, null, 2))
    // const flashbotsTransactionResponse: FlashbotsTransactionResponse | RelayResponseError = await flashbotsProvider.sendBundle(
    //     transactionBundle,
    //     block + 1,
    // )
    // console.log(flashbotsTransactionResponse)

    // if ('error' in flashbotsTransactionResponse) {
    //     console.warn(flashbotsTransactionResponse.error.message)
    //     return
    // }
  
    // console.log(await flashbotsTransactionResponse.simulate())
    console.log(await flashbotsProvider.getConflictingBundle(signedTransactions, 14719793))
    // console.log(await flashbotsProvider.getBundleStats(flashbotsTransactionResponse.bundleHash, block + 1))
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
