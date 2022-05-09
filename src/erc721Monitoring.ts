import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";

import { ERC_721_ABI } from "./abi";

dotenv.config();
const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)

async function main() {

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
    })
}

main()

function isNotNull(data: any) {
    return data != null
}
