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
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546", 1)

const provider = walletProvider

const FLASHBOT_RPC_ENDPOINT = "https://relay.flashbots.net"
const NFT_CONTRACT_ABI = OGPASS__factory.abi
const NFT_CONTRACT_ADDRESS = "0x5b7622DED96511639DdC12C86eb2703331cA2c78"

const wallet = new ethers.Wallet(PRIVATE_KEY, walletProvider);
const smartWallet = new NonceManager(wallet)

const authSigner = Wallet.createRandom();

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const NFT_PRICE = "1.8"
const START_BLOCKS_AHEAD = 5
const STEP = 1661
var TARGET_BLOCK = 14605180
// const PRIORITY_FEE = ethers.utils.parseUnits("11666.6", "gwei")
const PRIORITY_FEE = ethers.utils.parseUnits("11111.1", "gwei")
var purchased = false

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal))

    const nft = {
        // name: await nftContract.name(),
        maxSupply: 100, 
        // totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
        price: 1.8,
        maxPerTx: parseInt(ethers.utils.formatUnits(await nftContract.getTransactionCappedByMode(), 0))
    }

    console.log(nft)

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        walletProvider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
        authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
        FLASHBOT_RPC_ENDPOINT
    )

    var nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())

    provider.on("block", async (blockNumber) => {
        const block = await provider.getBlock(blockNumber)
        // nextSequenceBlock = blockNumber + 1
        // console.log(block)
        // const feeData = await provider.getFeeData()
        // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        const maxPerTx = 1
        const saleState = await nftContract.getState()
        console.log("nextSequenceBlock: ", nextSequenceBlock, " block: ", blockNumber, " maxPerTx: ", maxPerTx, " saleState: ", saleState, " still ", nextSequenceBlock - blockNumber, " blocks to go")
        if (blockNumber >= nextSequenceBlock - START_BLOCKS_AHEAD && blockNumber <= nextSequenceBlock - 1) {
            console.log("Get ready to mint.....")
            // Flashbots provider requires passing in a standard provider
            //const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(block.baseFeePerGas!!, block.gasUsed, block.gasLimit)
            const unsignedTx = {
                to: NFT_CONTRACT_ADDRESS,
                data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
                chainId: 1,
                type: 2,
                value: ethers.utils.parseEther(NFT_PRICE),
                gasLimit: 250000,
                maxFeePerGas: PRIORITY_FEE,//PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
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
            const simulation = flashbotsProvider.simulate(signedTransactions, nextSequenceBlock)

            const flashbotsTransactionResponse = flashbotsProvider.sendBundle(
                transactionBundle,
                nextSequenceBlock,
            )
            console.log("==========", await simulation)
            // console.log(({
            //     bundleStatus: await flashbotsProvider.getBundleStats(simulation.bundleHash, blockNumber + 1),
            //     userStats: await flashbotsProvider.getUserStats()
            // }))
            console.log(await flashbotsTransactionResponse)
            // console.log(JSON.stringify(simulation.wait(), null, 2))
            // console.log(JSON.stringify(flashbotsTransactionResponse, null, 2))
            // console.log(await flashbotsProvider.getBundleStats(flashbotsTransactionResponse.bundleHash, blockNumber + 1))
          
        }
        nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())
    })

    // provider.on('pending', async (txn) => {
    //     getTransaction(txn).then((transaction) => {
    //         if (transaction == null) {
    //             // console.log("=====================================")
    //             return
    //         }
    //         if (transaction.data.startsWith("0x95d0f231")) {
    //             console.log(transaction)
    //         }
    //     })
    // })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
