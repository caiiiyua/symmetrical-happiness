import { BigNumber, Contract, ethers, providers, Signer, Wallet } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)


async function main() {

    
    provider.on("block", async (blockNumber) => {
        // const block = await provider.getBlock(blockNumber)
        // console.log(block)
        const feeData = await provider.getFeeData()
        console.log(blockNumber, ethers.utils.formatUnits(feeData.maxFeePerGas!!, 'gwei'), ethers.utils.formatUnits(feeData.maxPriorityFeePerGas!!, 'gwei'))
    })
}

main().then(console.log)
