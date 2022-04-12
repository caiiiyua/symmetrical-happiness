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

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

const NFT_CONTRACT_ADDRESS = "0x7887f40763aCe5f0e8320181FD5B42776D35B1FF"

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

async function isMintAvailable() {
    return true
}

async function updateERC721(contract: Contract) {
    const nft = {
        name: await contract.name(),
        maxSupply: 5000,
        totalSupply: ethers.utils.formatUnits(await contract.totalSupply(), 0),
        price: ethers.utils.formatUnits(await contract.price(), 18),
        maxPerTx: 3,
        maxPerAccount: 3,
        canMint: isMintAvailable()
    }
    return nft
}

var erc721 = null

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, HAKI_ABI, wallet);

    provider.on('block', async (blockNumber) => {
        erc721 = updateERC721(nftContract)
        console.log(erc721)
    })

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === NFT_CONTRACT_ADDRESS.toUpperCase()) {
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
}

main()

function isNotNull(data: any) {
    return data != null
}
