import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY_FLASHBOT } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { OGPASS__factory } from "../typechain-types";
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle";

dotenv.config();

const CHAIN_ID = 1

// const provider = new providers.InfuraProvider(CHAIN_ID)
// const provider = new providers.JsonRpcProvider("https://goerli.infura.io/v3/67faa798935545cd9d38749a6b225894")
// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider("https://eth-goerli.alchemyapi.io/v2/emfpr3r2TA1Q5rBCeTJMGqg5Pa8U03r1")
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const walletProvider = new providers.JsonRpcProvider("https://rpc.ankr.com/eth")
const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546", 1)

// const provider = walletProvider

const NFT_CONTRACT_ABI = OGPASS__factory.abi

const FLASHBOT_RPC_ENDPOINT = "https://relay.flashbots.net"
const NFT_CONTRACT_ADDRESS = "0x4ED7CD93E0Ab752E26c631587bb9173C242b79b5" //mainnet test
// const NFT_CONTRACT_ADDRESS = "0x5b7622DED96511639DdC12C86eb2703331cA2c78" //Mainnet official

// const FLASHBOT_RPC_ENDPOINT = "https://relay-goerli.flashbots.net"
// const NFT_CONTRACT_ADDRESS = "0xdecaB36647938B006b66f39BC7B959b3fB034b81" //"0x74fB5d242909072878D146f8F28b4a0090455297" //Testnet


const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

const authSigner = new Wallet(PRIVATE_KEY_FLASHBOT);

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const NFT_PRICE = "0"
const START_BLOCKS_AHEAD = 2
const STEP = 1661
var TARGET_BLOCK = 14605180
// const PRIORITY_FEE = ethers.utils.parseUnits("11666.6", "gwei")
const PRIORITY_FEE = ethers.utils.parseUnits("1.5", "gwei")
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
        maxPerTx: 1//parseInt(ethers.utils.formatUnits(await nftContract.getTransactionCappedByMode(), 0))
    }

    console.log(nft)

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
        authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
        FLASHBOT_RPC_ENDPOINT
    )

    const unsignedTx = {
        to: NFT_CONTRACT_ADDRESS,
        data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
        chainId: CHAIN_ID,
        type: 2,
        value: ethers.utils.parseEther(NFT_PRICE),
        gasLimit: 250000,
        maxFeePerGas: ethers.utils.parseUnits("60", "gwei"),
        maxPriorityFeePerGas: PRIORITY_FEE,
    }
    console.log(unsignedTx)
    const transactionBundle = [
        {
            signer: smartWallet, // ethers signer
            transaction: unsignedTx // ethers populated transaction object
        }
    ]
    const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)

    const maxPerTx = 1
    provider.on("block", async (blockNumber) => {
        const blockNowAt = Date.now()/1000  
        const block = await provider.getBlock(blockNumber)
        // nextSequenceBlock = blockNumber + 1
        // console.log(block)
        // const feeData = await provider.getFeeData()
        // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        const saleState = await nftContract.getState()
        var nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())
        if (nextSequenceBlock <= blockNumber) {
            nextSequenceBlock = blockNumber + 1
        }
        // nextSequenceBlock = blockNumber + 1
        console.log("nextSequenceBlock: ", nextSequenceBlock, " block: ", blockNumber, " maxPerTx: ", maxPerTx, " saleState: ", saleState, " still ", nextSequenceBlock - blockNumber, " blocks to go", blockNowAt - block.timestamp, "latency")
        if (blockNumber >= nextSequenceBlock - START_BLOCKS_AHEAD || saleState == 2) {
        // if (blockNumber <= testBlock + START_BLOCKS_AHEAD || saleState == 8) {
            console.log("Get ready to mint.....")
            // // Flashbots provider requires passing in a standard provider
            // const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(block.baseFeePerGas!!, block.gasUsed, block.gasLimit)
            // const unsignedTx = {
            //     to: NFT_CONTRACT_ADDRESS,
            //     data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
            //     chainId: CHAIN_ID,
            //     type: 2,
            //     value: ethers.utils.parseEther(NFT_PRICE),
            //     gasLimit: 250000,
            //     maxFeePerGas: maxBaseFeeInFutureBlock.mul(2),
            //     maxPriorityFeePerGas: PRIORITY_FEE,
            // }
            // console.log(unsignedTx)
            // const transactionBundle = [
            //     {
            //         signer: smartWallet, // ethers signer
            //         transaction: unsignedTx // ethers populated transaction object
            //     }
            // ]
            // const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)

            const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, nextSequenceBlock)
            console.log('bundle submitted, waiting')
            if ('error' in bundleSubmission) {
                throw new Error(bundleSubmission.error.message)
            }
            const waitResponse = await bundleSubmission.wait()
            console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
            if (waitResponse === FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
                console.log("bundle included ....", await bundleSubmission.receipts())
                // process.exit(0)
            } else if (blockNumber >= nextSequenceBlock) {
                console.log(await flashbotsProvider.getConflictingBundle(signedTransactions, nextSequenceBlock))
                console.log({
                    bundleStats: await flashbotsProvider.getBundleStats(bundleSubmission.bundleHash, nextSequenceBlock),
                    userStats: await flashbotsProvider.getUserStats()
                })
            }
            const simulation = await flashbotsProvider.simulate(signedTransactions, nextSequenceBlock)
            // Using TypeScript discrimination
            if ('error' in simulation) {
                console.warn(`Simulation Error: ${simulation.error.message}`)
                // process.exit(1)
                return
            } else {
                console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
            }
        }
        nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
