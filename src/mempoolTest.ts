import { BigNumber, Contract, ethers, providers, Signer, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ADDRESS = "0x4ED7CD93E0Ab752E26c631587bb9173C242b79b5"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)


const TRX_DATA = "0x0f30cde0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000"

const NFT_PRICE = 0
const GAS_LIMIT = 240000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("3333", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("2048", "gwei")

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function mintWithData(signer: Signer, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = signer.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: TRX_DATA,
        type: 2,
        value: NFT_PRICE,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
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

    // provider.on("block", async (blockNumber) => {
    //     const feeData = await provider.getFeeData()
    //     console.log(blockNumber, ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    // })

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                // console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === NFT_CONTRACT_ADDRESS.toUpperCase() ) {
                console.log(transaction)
                if (transaction.data.startsWith("0x2316b4da")) {
                    if (purchased) return
                    const gasPrice = transaction.gasPrice!!
                    const maxFeePerGas = transaction.maxFeePerGas!!
                    const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                    mintWithData(smartWallet, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                    purchased = true
                }
            }
        })
    })
}

main().then(console.log)