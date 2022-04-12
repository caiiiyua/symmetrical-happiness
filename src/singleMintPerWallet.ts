import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI, HAKI_ABI, KREEPY_CLUB_ABI, REMEMBER_ME_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";
import { FeeData } from "@ethersproject/abstract-provider";
import { Address } from "ethereumjs-util";

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

const TRX_DATA = "0x1249c58b"

const NFT_CONTRACT_ADDRESS = "0xCCB9D89e0F77Df3618EEC9f6BF899Be3B5561A89"
const NFT_PRICE = 0
const NFT_CONTRACT_ABI = REMEMBER_ME_ABI
const MAX_TRX_COUNT = 1
const MAX_AMOUNT_PER_TRX = 2

const GAS_LIMIT = 100000
const MAX_PEE_PER_GAS = ethers.utils.parseUnits("30", "gwei")
const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits("1", "gwei")

async function mintWithData(feeData: FeeData | null) {
    const txn = smartWallet.sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        data: TRX_DATA!!,
        type: 2,
        value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()),
        maxFeePerGas: feeData?.maxFeePerGas ?? MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS,
        gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX,
        chainId: 1
      })
    console.log(await txn)
}

async function mint(contract: Contract, feeData: FeeData | null) {
    const txn = await contract.mint(MAX_AMOUNT_PER_TRX, {
        value: ethers.utils.parseEther((NFT_PRICE * MAX_AMOUNT_PER_TRX).toString()), //sending one ether  
        gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX, //optional
        maxFeePerGas: feeData?.maxFeePerGas ?? MAX_PEE_PER_GAS,
        maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas ?? MAX_PRIORITY_PER_GAS
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

var total = 0
const MAX_MEMORY = 10

async function main() {
    const iface = new Interface(NFT_CONTRACT_ABI);
    console.log(iface.format(FormatTypes.minimal));
  
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, smartWallet);

    mintWithData(null)

    provider.on("block", async (blockNumber) => {
        const feeData = await provider.getFeeData()
        console.log(ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    })

    nftContract.on("Transfer", async (from: Address, to: Address, tokenId: BigNumber) => {
        if (from.toString() == "0x0000000000000000000000000000000000000000" && to.toString() == "0xAC24B8a5022D45D4D1Bead5360AC3FDcac4586e9") {
            console.log("Minted from:", from, " to:", to, " token: ", tokenId, tokenId.toHexString().substring(2))
            const transferData = "0x23b872dd000000000000000000000000ac24b8a5022d45d4d1bead5360ac3fdcac4586e900000000000000000000000084f6f9867ac2c4e8d990825d440cd6da1de3309f000000000000000000000000000000000000000000000000000000000000" + tokenId.toHexString().substring(2)
            smartWallet.sendTransaction({
                to: NFT_CONTRACT_ADDRESS,
                data: transferData,
                type: 2,
                value: 0,
                maxFeePerGas: MAX_PEE_PER_GAS,
                maxPriorityFeePerGas: MAX_PRIORITY_PER_GAS,
                gasLimit: GAS_LIMIT * MAX_AMOUNT_PER_TRX,
                chainId: 1
              })
            total++
        } else if (from.toString() == "0xAC24B8a5022D45D4D1Bead5360AC3FDcac4586e9" && to.toString() == "0x84F6F9867aC2C4e8d990825D440cd6da1DE3309f") {
            console.log("Transferred from:", from, " to:", to, " token: ", tokenId)
            if (total >= MAX_MEMORY) {
                return
            }
            const owner = await nftContract.ownerOf(tokenId)
            if (owner != "0xAC24B8a5022D45D4D1Bead5360AC3FDcac4586e9") {
                mintWithData(null)
            }
        }
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
