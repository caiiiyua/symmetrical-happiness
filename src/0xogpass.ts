import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY, PRIVATE_KEY3, PRIVATE_KEY_FLASHBOT } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { OGPASS__factory } from "../typechain-types";
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle";

dotenv.config();

// const ankrProvider = new providers.AnkrProvider(1)
// const walletProvider = new providers.InfuraProvider(1)
// const walletProvider = new providers.AlchemyProvider(1)
// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
const walletProvider = new providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/zNXb2wL-bHl57-13FfTiL9XSH-m88C4M")
// const provider2 = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const walletProvider = new providers.JsonRpcProvider("https://rpc.ankr.com/eth")
const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546", 1)

// const provider = walletProvider
// const walletProvider = provider

const FLASHBOT_RPC_ENDPOINT = "https://relay.flashbots.net"
const NFT_CONTRACT_ABI = OGPASS__factory.abi
const NFT_CONTRACT_ADDRESS = "0x5b7622DED96511639DdC12C86eb2703331cA2c78"

const wallet = new ethers.Wallet(PRIVATE_KEY3, walletProvider);
const smartWallet = new NonceManager(wallet)
smartWallet.incrementTransactionCount(3)

const authSigner = new Wallet(PRIVATE_KEY_FLASHBOT);

const NFT_PRICE = ethers.utils.parseEther("1.8")
const START_BLOCKS_AHEAD = 3
// const PRIORITY_FEE = ethers.utils.parseUnits("11666.6", "gwei")
const PRIORITY_FEE = ethers.utils.parseUnits("2222", "gwei") 

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
    // Flashbots provider requires passing in a standard provider
    //const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(block.baseFeePerGas!!, block.gasUsed, block.gasLimit)
    const unsignedTx = {
        to: NFT_CONTRACT_ADDRESS,
        data: "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000",
        chainId: 1,
        type: 2,
        value: NFT_PRICE,
        gasLimit: 250000,
        maxFeePerGas: PRIORITY_FEE,//PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
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
    
    provider.on("block", async (blockNumber) => {
        const maxPerTx = 1
        const saleState = await nftContract.getState()
        var nextSequenceBlock = parseInt(await nftContract.nextSubsequentSale())
        if (nextSequenceBlock <= blockNumber) {
            nextSequenceBlock = blockNumber + 1
        }
        console.log("nextSequenceBlock: ", nextSequenceBlock, " block: ", blockNumber, " maxPerTx: ", maxPerTx, " saleState: ", saleState, " still ", nextSequenceBlock - blockNumber, " blocks to go")
        if (blockNumber >= nextSequenceBlock - START_BLOCKS_AHEAD || saleState == 8) {
            console.log("Get ready to mint.....")
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
    })
}

main().then(console.log)