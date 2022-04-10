import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { FormatTypes, Interface, ParamType } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { CONTRACT_ABI } from "./abi";
import { WUContract__factory } from "../typechain";
import { PRIVATE_KEY } from '../config';
import { NonceManager } from "@ethersproject/experimental";

dotenv.config();

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546")

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const smartWallet = new NonceManager(wallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function abiDecode(abiCoder: ethers.utils.AbiCoder, types: string[], data: string, skipFunctionMethod: boolean = true) {
    var stripped = data
    if (skipFunctionMethod && (data.length - 2) % 64 === 8) {
        stripped = '0x' + data.substring(10)
    }
    return abiCoder.decode(types.map(t => ParamType.fromString(t)), stripped);
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
        value: 0, //sending one ether  
        gasLimit: 120000 * amount, //optional
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
    })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function main() {

    const wuContract = new Contract("0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746", WUContract__factory.abi, wallet);

    for (let index = 0; index < 23; index++) {
        console.log(index, await provider.getStorageAt("0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746", index))
    }

    // const mintData = "0xa0712d68000000000000000000000000000000000000000000000000000000000000001E"

    // const iface = new Interface(CONTRACT_ABI);
    // console.log(iface.format(FormatTypes.minimal));
    // console.log(iface.parseTransaction({ mintData }));

    // const abiCoder = ethers.utils.defaultAbiCoder

    // const data3 = "0x0000000000000000000000004f53238d40e1a3cb8752a2be81f053e266d9ecab000000000000000000000000000000000000000000000000000000024dba7580"
    // console.log(abiCoder.decode(['address', 'uint256'], data3));

    // const transactionInput = [
    //     BigNumber.from("0xea7b1f45fee25d0000"),
    //     [
    //         "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    //         "0xc7fba797141f5392094e3dca8943ca7d8b6f92d8"
    //     ],
    //     "0x3f8cf11a356b979f2dab446e351aa6fa0e74c6ac",
    //     0x619c799e
    // ]

    // const data2 = abiCoder.encode(["uint256", "address[]", "address", "uint256"], transactionInput)
    // console.log(data2);

    // const data4 = "0xfb3bdb410000000000000000000000000000000000000000000000ea7b1f45fee25d000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000003f8cf11a356b979f2dab446e351aa6fa0e74c6ac00000000000000000000000000000000000000000000000000000000619c799e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c000000000000000000000000c7fba797141f5392094e3dca8943ca7d8b6f92d8"
    // const result = await abiDecode(abiCoder, ["uint256", "address[]", "address", "uint256"], data4);
    // const result = abiCoder.decode(["uint256", ParamType.fromString("address[]"), "address", "uint256"], '0x' + data4.substring(10));
    // console.log(result)

    // provider.on('pending', async (txn) => {
    //     getTransaction(txn).then((transaction) => {
    //         if (transaction == null) {
    //             // console.log("=====================================")
    //             return
    //         }
    //         if (transaction.to?.toUpperCase() === "0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746".toUpperCase() ){
    //         // && transaction.from?.toUpperCase() === "0x3316BcBfCfc36A8a8551af4371f033223d9756B0".toUpperCase()) {
    //             console.log(transaction, transaction.gasPrice)
    //             const gasPrice = transaction.gasPrice!!
    //             const maxFeePerGas = transaction.maxFeePerGas!!
    //             const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas!!
    //             mintNew(wuContract, 1, gasPrice, maxFeePerGas, maxPriorityFeePerGas)
    //         }
    //     })
    // })

    // This filter could also be generated with the Contract or
    // Interface API. If address is not specified, any address
    // matches and if topics is not specified, any log matches
    const filter = {
        address: "0xBEE7Cb80DFD21a9eAAe714208F361601F68eB746",
        topics: [

        ]
    }
    provider.on(filter, async (log, event) => {
        console.log("filter:", log, event)
        if (log.topics[0] == "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa") {
            //Do mint
            await mintNew(wuContract, 100, ethers.utils.parseUnits("38", "gwei"), ethers.utils.parseUnits("77", "gwei"), ethers.utils.parseUnits("1.5", "gwei"))
        }
    })
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}
