import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("ws://127.0.0.1:8546")

const NFT_CONTRACT_ADDRESS = "0x7887f40763aCe5f0e8320181FD5B42776D35B1FF"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function mint(contract: Contract, amount: number, gasPrice: BigNumber) {
    const txn = await contract.mint(amount, {
        value: 0, //sending one ether  
        gasLimit: 120000 * amount, //optional
        gasPrice: gasPrice
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function mintNew(contract: Contract, amount: number, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = await contract.mint(amount, {
        value: ethers.utils.parseEther((0.069 * amount).toString()), //sending one ether  
        gasLimit: 120000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, HAKI_ABI, wallet);
    // const iface = new Interface(KREEPY_CLUB_ABI);
    // console.log(iface.format(FormatTypes.minimal));

    const nft = {
        name: await nftContract.name(),
        maxSupply: 5000,
        totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
        price: ethers.utils.formatUnits(await nftContract.price(), 18),
        maxPerTx: 3
    }

    console.log(nft)

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === NFT_CONTRACT_ADDRESS.toUpperCase() ) {
                console.log(transaction)
                // if (transaction.data === "0x69ba1a750000000000000000000000000000000000000000000000000000000000000002") {
                //     const gasPrice = transaction.gasPrice!!
                //     const maxFeePerGas = transaction.maxFeePerGas!!
                //     const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                //     mintNew(nftContract, 3, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                // }
                // if (tx.name == "flipSaleState") {
                //     const gasPrice = transaction.gasPrice!!
                //     const maxFeePerGas = transaction.maxFeePerGas!!
                //     const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                //     mintNew(nftContract, 3, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                // }
            }
        })
    })

    // // This filter could also be generated with the Contract or
    // // Interface API. If address is not specified, any address
    // // matches and if topics is not specified, any log matches
    // const filter = {
    //     address: "0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746",
    //     topics: [

    //     ]
    // }
    // provider.on(filter, async (log, event) => {
    //     console.log("filter:", log, event)
    //     if (log.topics[0] == "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa") {
    //         //Do mint
    //         await mintNew(wuContract, 100, ethers.utils.parseUnits("38", "gwei"), ethers.utils.parseUnits("77", "gwei"), ethers.utils.parseUnits("1.5", "gwei"))
    //     }
    // })
}

main()

function isNotNull(data: any) {
    return data != null
}
