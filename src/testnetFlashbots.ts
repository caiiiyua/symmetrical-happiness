import { providers, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { PRIVATE_KEY2, PRIVATE_KEY3 } from "../config";

const CHAIN_ID = 5;
const provider = new providers.InfuraProvider(CHAIN_ID)

const FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net";
const wallet = new Wallet(PRIVATE_KEY2, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10 ** 9
const ETHER = 10 ** 18

async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
  provider.on('block', async (blockNumber) => {
    console.log(blockNumber)
    
    const bundleSubmitResponse = await flashbotsProvider.sendBundle(
      [
        {
          transaction: {
            chainId: CHAIN_ID,
            type: 2,
            value: 0,
            data: "0x1249c58b",
            maxFeePerGas: GWEI * 1.5,
            maxPriorityFeePerGas: GWEI * 1.5,
            to: "0x7992d99A2E33C7D71714332f95DE1f9D5bB6459d",
            gasLimit: 120000
          },
          signer: wallet
        }
      ], blockNumber + 1
    )

    // By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
    if ('error' in bundleSubmitResponse) {
      console.warn(bundleSubmitResponse.error.message)
      return
    }

    console.log(await bundleSubmitResponse.simulate())
  })
}

main();