import { BigNumber, Contract, ethers, providers, Wallet } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const parseURL2ConnectInfo = (url: string | URL) => {
    const urlObject = new URL(url)
    return {
      pro: urlObject.protocol,
      url: urlObject.origin + urlObject.pathname,
      user: urlObject.username,
      password: urlObject.password,
      allowInsecureAuthentication: urlObject.protocol === 'https:' ? false : true,
    }
  }

const ankrProvider = new providers.AnkrProvider(1)
const infuraProvider = new providers.InfuraProvider(1)
const alchemyProvider = new providers.AlchemyProvider(1)
const quickNodeProvider = new providers.JsonRpcProvider("https://green-crimson-bird.quiknode.pro/d7045d89c2b0d43bd21f981f431f2e39b9ce71aa/")
const url = "http://nextdaodev:v.JnUY_Gbj.hgCb6kQiT@rpc.721tools.xyz"
const connetInfo = parseURL2ConnectInfo(url)
const nextDaoProvider = new providers.JsonRpcProvider(connetInfo)
const provider = new providers.JsonRpcProvider("http://localhost:8545")
// const provider = new providers.WebSocketProvider("http://localhost:8546", 1)

async function main() {
    profileEvent(nextDaoProvider, "nextDaoNode")
    profileEvent(ankrProvider, "ankrNode")
    profileEvent(infuraProvider, "infuraNode")
    profileEvent(alchemyProvider, "alchemyNode")
    profileEvent(quickNodeProvider, "quickNode")
    profileEvent(provider, "localNode")
}

function profileEvent(nodeProvider: providers.BaseProvider, nodeName: string) {
    nodeProvider.on("block", async (blockNumber) => {
        const blockNowAt = Date.now()/1000  
        const block = await provider.getBlock(blockNumber)
        if (block != null) {
            console.log(blockNumber, blockNowAt - block.timestamp, "latency", nodeName)
        }
    })
}

main().then(console.log)
