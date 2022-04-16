import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, OMNI_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ADDRESS = "0x41EFd9c4b6F786EBbB2BeF2701595E6d337Bc0eA"
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
        value: 0, //ethers.utils.parseEther((0.069 * amount).toString()), //sending one ether  
        gasLimit: 100000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, OMNI_ABI, wallet);
    const iface = new Interface(OMNI_ABI);
    console.log(iface.format(FormatTypes.minimal));

    // const nft = {
    //     name: await nftContract.name(),
    //     maxSupply: ethers.utils.formatUnits(await nftContract.availableKreeps(), 0),
    //     totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
    //     price: ethers.utils.formatUnits(await nftContract.kreepyPrice(), 18),
    //     maxPerTx: ethers.utils.formatUnits(await nftContract.maxKreepPurchase(), 0)
    // }

    // console.log(nft)

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                // console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === NFT_CONTRACT_ADDRESS.toUpperCase() ) {
                // console.log(transaction)
                const tx = iface.parseTransaction(transaction)
                console.log(tx)
                if (tx.name == "setPrice") {
                    const gasPrice = transaction.gasPrice!!
                    const maxFeePerGas = transaction.maxFeePerGas!!
                    const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                    mintNew(nftContract, 5, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                }
            }
        })
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
