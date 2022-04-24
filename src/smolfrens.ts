import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, SMOL_FRENS_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY2, PRIVATE_KEY3 } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const NFT_CONTRACT_ABI = SMOL_FRENS_ABI
const NFT_CONTRACT_ADDRESS = "0xAb1C28ADB2c720386cDa577fA7643aD4A6F56bB8"
const wallet = new ethers.Wallet(PRIVATE_KEY3, provider);
const wallet2 = new ethers.Wallet(PRIVATE_KEY2, provider)
const smartWallet = new NonceManager(wallet)

const GAS_LIMIT = 240000

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function mintWithData(contract: Contract, gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber) {
    const txn = smartWallet.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: "0x26092b83",
        type: 2,
        value: 0,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: maxFeePerGas,
        gasLimit: GAS_LIMIT,
        chainId: 1
      })
    console.log(await txn)
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

var paused = true
var saleActived = false

var purchased = false

async function main() {

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
    const nftContract2 = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet2);
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));

    const nft = {
        name: await nftContract.name(),
        // maxSupply: ethers.utils.formatUnits(await nftContract.maxSupply(), 0),
        totalSupply: ethers.utils.formatUnits(await nftContract.totalSupply(), 0),
        price: 0,//parseFloat(ethers.utils.formatUnits(await nftContract.PRESALE_ETH_PRICE(), 18)),
        maxPerTx: 1,// parseInt(ethers.utils.formatUnits(await nftContract.MAX_MINT_COUNT(), 0))
    }

    console.log(nft)

    // provider.on("block", async (blockNumber) => {
    //     // const feeData = await provider.getFeeData()
    //     // console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    //     paused = await nftContract.paused()
    //     saleActived = await nftContract.saleActive()
    //     console.log("paused: ", paused, " saveActived: ", saleActived, ethers.utils.parseEther((nft.price * nft.maxPerTx).toString()))
    // })

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
                    if (tx.name == "setIsPublicMint") {
                        if (purchased) return
                        const gasPrice = transaction.gasPrice!!
                        const maxFeePerGas = transaction.maxFeePerGas!!
                        const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
                        for (let index = 0; index < 10; index++) {
                            mintNew(nftContract, nft.maxPerTx, nft.price, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
                        }
                        // mintNew(nftContract2, nft.maxPerTx, nft.price, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
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
