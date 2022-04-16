import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { ERC_721_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

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

async function mintWithData(to: string, txnData: string, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber, gasLimit: BigNumber) {
    const txn = smartWallet.sendTransaction({
        to: to,
        data: txnData,
        type: 2,
        value: 0,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        gasLimit: gasLimit,
        chainId: 1
      })
    console.log((await txn).wait())
}

var newListings = {}
var purchased = false

async function main() {

    // provider.on('pending', async (txn) => {
    //     getTransaction(txn).then((transaction) => {
    //         if (transaction == null) {
    //             console.log("=====================================")
    //             return
    //         }
    //         if (transaction.data.startsWith("0xa0712d68")
    //             // && transaction.data.value.eq(0)
    //         ) {
    //             console.log(transaction)
    //             // const gasPrice = transaction.gasPrice!!
    //             // const maxFeePerGas = transaction.maxFeePerGas!!
    //             // const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
    //             // mintNew(nftContract, 3, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
    //         }

    //     })
    // })

    const filter = {
        topics: [
            ethers.utils.id("OwnershipTransferred(address,address)"),
            ethers.utils.hexZeroPad("0x0000000000000000000000000000000000000000", 32),
            null
        ]
    }
    provider.on(filter, async (log, event) => {
        // Emitted any token is sent TO either address
        console.log(log, "========", event)
        const nftContract = new Contract(log.address, ERC_721_ABI, provider);
        try {
            const name = await nftContract.name()
            console.log("NFT contract ", name, " has been deployed at ", log.address)
        } catch (error) {
            console.error(error)
        }
       
        // const txn = await provider.getTransaction(log.transactionHash)
        // console.log(txn)
        // if (txn.data.startsWith("0xa0712d6800000000000000000000000000000000000000000000000000000000000")
        //     && txn.value.eq(0)) {
        //     if (!purchased) {
        //         purchased = true
        //         mintWithData(txn.to!!, txn.data, txn.maxFeePerGas!!, txn.maxPriorityFeePerGas!!, txn.gasLimit!!)
        //     }
        // }
    })
}

main()

function isNotNull(data: any) {
    return data != null
}
