import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const ankrProvider = new providers.AnkrProvider(1)
const infuraProvider = new providers.InfuraProvider(1)
const alchemyProvider = new providers.AlchemyProvider(1)


async function main() {
    profileEvent(ankrProvider, "ankrNode")
    profileEvent(infuraProvider, "infuraNode")
    profileEvent(alchemyProvider, "alchemyNode")
}

function profileEvent(nodeProvider: providers.BaseProvider, nodeName: string) {
    nodeProvider.on("block", async (blockNumber) => {
        const blockNowAt = Date.now()/1000  
        const block = await nodeProvider.getBlock(blockNumber)
        if (block != null) {
            console.log(blockNumber, blockNowAt - block.timestamp, "latency", nodeName)
        }
    })
}

main().then(console.log)
