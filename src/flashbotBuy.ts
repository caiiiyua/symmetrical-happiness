import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";

import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

dotenv.config();

const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)


const FLASHBOT_RPC_ENDPOINT = "https://relay.flashbots.net"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

const authSigner = Wallet.createRandom();

const NFT_CONTRACT_ADDRESS = "0xDC0a5D7734c3c94Ba4D144bD828a4Ca2358bCDFc"
const NFT_PRICE = 0
const NFT_AMOUNT = 0x2

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}
const PRIORITY_FEE = ethers.utils.parseUnits("2", "gwei")
var purchased = false

async function main() {

    provider.on("block", async (blockNumber) => {
        const block = await provider.getBlock(blockNumber)
        const nextBlock = blockNumber + 1
        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
            authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
            FLASHBOT_RPC_ENDPOINT,
            1
        )
        console.log("next Block: ", nextBlock)
        // Flashbots provider requires passing in a standard provider
        const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(block.baseFeePerGas!!, block.gasUsed, block.gasLimit)
        const unsignedTx = {
            to: NFT_CONTRACT_ADDRESS,
            data: "0xa0712d680000000000000000000000000000000000000000000000000000000000000002",
            chainId: 1,
            type: 2,
            value: ethers.utils.parseEther((NFT_PRICE * NFT_AMOUNT).toString()),
            gasLimit: 250000 * NFT_AMOUNT,
            maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
            maxPriorityFeePerGas: PRIORITY_FEE,
        }
        console.log(unsignedTx)
        const transactionBundle = [
        {
            signer: wallet, // ethers signer
            transaction: unsignedTx // ethers populated transaction object
        }
        ]
        const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
        const simulation = flashbotsProvider.simulate(signedTransactions, nextBlock)

        const flashbotsTransactionResponse = flashbotsProvider.sendBundle(
            transactionBundle,
            nextBlock,
        )
        console.log(await simulation)
        console.log("============================")
        // console.log(({
        //     bundleStatus: await flashbotsProvider.getBundleStats(simulation.bundleHash, blockNumber + 1),
        //     userStats: await flashbotsProvider.getUserStats()
        // }))
        // console.log(await flashbotsTransactionResponse)
        // console.log(JSON.stringify(simulation.wait(), null, 2))
        console.log(JSON.stringify(flashbotsTransactionResponse, null, 2))
        // console.log(await flashbotsProvider.getBundleStats(flashbotsTransactionResponse.bundleHash, blockNumber + 1))   
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
