import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, MOON_BIRD_PUNKS } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ABI = MOON_BIRD_PUNKS
const NFT_CONTRACT_ADDRESS = "0x266A5797E803E5e299A806AFA51FB2D80EC31911"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function mintNew(contract: Contract, amount: number, price: number, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = await contract.mint(amount, {
        value: ethers.utils.parseEther((price * amount).toString()), //sending one ether  
        gasLimit: 100000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

var isPresaleActive = true
var saleIsActive = false

var purchased = false

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));

    const nft = {
        name: await nftContract.name(),
        maxSupply: 2469,//ethers.utils.formatUnits(await nftContract.maxSupply(), 0),
        totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
        price: parseFloat(ethers.utils.formatUnits(await nftContract.MINT_PRICE(), 18)),
        maxPerTx: 10//parseInt(ethers.utils.formatUnits(await nftContract.MAX_MINT_COUNT(), 0))
    }

    console.log(nft)

    provider.on("block", async (blockNumber) => {
        // const feeData = await provider.getFeeData()
        // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
        isPresaleActive = await nftContract.presale()
        saleIsActive = await nftContract.saleIsActive()
        console.log("isPresaleActive: ", isPresaleActive, " saleIsActive: ", saleIsActive, ethers.utils.parseEther((nft.price * 3).toString()))
    })

    provider.on('pending', async (txn) => {
        getTransaction(txn).then((transaction) => {
            if (transaction == null) {
                // console.log("=====================================")
                return
            }
            if (transaction.to?.toUpperCase() === NFT_CONTRACT_ADDRESS.toUpperCase() ) {
                // console.log(transaction)
                try {
                    const tx = iface.parseTransaction(transaction)
                    console.log(tx)
                    if (tx.name == "flipPresaleState") {
                        if (purchased) return
                        const gasPrice = transaction.gasPrice!!
                        const maxFeePerGas = transaction.maxFeePerGas!!
                        const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                        // for (let index = 0; index < 2; index++) {
                            mintNew(nftContract, 3, nft.price, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                        // }
                        purchased = true
                    }
                } catch (error) {
                    console.error(error)
                }
                
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

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}