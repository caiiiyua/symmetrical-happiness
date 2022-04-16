import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { OGPASS__factory } from "../typechain";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ABI = OGPASS__factory._abi
const NFT_CONTRACT_ADDRESS = ""
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

const authSigner = Wallet.createRandom();

async function mintNew(contract: Contract, amount: number, price: number, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const unsignedTx = await contract.populateTransaction.mintToken(amount, null, {
        value: ethers.utils.parseEther((price * amount).toString()), //sending one ether  
        gasLimit: 240000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    const transactionBundle = [
        {
            signer: wallet, // ethers signer
            transaction: unsignedTx // ethers populated transaction object
        }
    ]
    return transactionBundle
}
async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const TARGET_BLOCK = 14596875
const PRIORITY_FEE = ethers.utils.parseUnits("777", "gwei")

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));

    const nft = {
        name: await nftContract.name(),
        maxSupply: 100,
        totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
        price: 1.8,
        maxPerTx: parseInt(ethers.utils.formatUnits(await nftContract.getTransactionCappedByMode(), 0))
    }

    console.log(nft)

    provider.on("block", async (blockNumber) => {
        const block = await provider.getBlock(blockNumber)
        console.log(blockNumber)
        // // const feeData = await provider.getFeeData()
        // // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        // const maxPerTx = await nftContract.getTransactionCappedByMode()
        // const startPublicSaleBlock = await nftContract.startPublicSaleBlock()
        // console.log("block: ", blockNumber, " maxPerTx: ", maxPerTx, " startPublicSaleBlock: ", startPublicSaleBlock, " still ", TARGET_BLOCK - blockNumber, " blocks to go")
        // if (blockNumber = TARGET_BLOCK - 1) {
        //     console.log("Get ready to mint.....")
        //     // Flashbots provider requires passing in a standard provider
        //     const flashbotsProvider = await FlashbotsBundleProvider.create(
        //         provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
        //         authSigner // ethers.js signer wallet, only for signing request payloads, not transactions
        //     )
        //     const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(block.baseFeePerGas!!, block.gasUsed, block.gasLimit)
        //     const unsignedTx = await nftContract.populateTransaction.mintToken(1, null, {
        //         value: ethers.utils.parseEther((1.8).toString()), //sending one ether  
        //         gasLimit: 240000 * 1, //optional
        //         maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
        //         maxPriorityFeePerGas: PRIORITY_FEE
        //     })
        //     const transactionBundle = [
        //         {
        //             signer: wallet, // ethers signer
        //             transaction: unsignedTx // ethers populated transaction object
        //         }
        //     ]
        //     const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
        //     const simulation = await flashbotsProvider.simulate(signedTransactions, TARGET_BLOCK)
        //     console.log(JSON.stringify(simulation, null, 2))

        //     // const flashbotsTransactionResponse = await flashbotsProvider.sendBundle(
        //     //     transactionBundle,
        //     //     TARGET_BLOCK,
        //     // )
        //     // console.log(JSON.stringify(flashbotsTransactionResponse, null, 2))
        // }
    })

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                // console.log("=====================================")
                return
            }
            if (transaction.data.startsWith("0x95d0f231")) {
                console.log(transaction)
            }
        })
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
