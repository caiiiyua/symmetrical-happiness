import { NonceManager } from "@ethersproject/experimental";
import { BigNumber, Contract, ethers, providers, Signer, Wallet } from "ethers";
import { hexValue } from "ethers/lib/utils";
import { PRIVATE_KEY, WALLET_ADDRESS } from "../config";
import { UNISWAP_FACTORY_ABI, UNISWAP_PAIR_ABI, UNISWAP_ROUTER_ABI } from "./abi";
import { IERC20__factory } from "../typechain-types";

// const provider = new providers.WebSocketProvider("wss://wild-winter-star.bsc.quiknode.pro/79cdb8a970efff353a2ddf59a7067e23c582b5a2/");
// const provider = new providers.JsonRpcProvider(process.env.RPC_ENDPOINT)
// const provider = new providers.WebSocketProvider("wss://eth-mainnet.alchemyapi.io/v2/AEFszc8KBUGqG7Hux5_yMn0I7XRnZyv0")
// const provider = new providers.JsonRpcProvider("http://localhost:8545")
const provider = new providers.WebSocketProvider("http://localhost:8546")

const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const smartWallet = new NonceManager(wallet)

const tokenSwapRouterContract = new Contract("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", UNISWAP_ROUTER_ABI, smartWallet)

const tokenAddress = "0x36FC6b70C498B48138CBa5A1DB7D4100bf38ABA2"
const tokenContract = new Contract(tokenAddress, IERC20__factory.abi, smartWallet)

async function getTransaction(txn: string) {
    return provider.getTransaction(txn)
}

async function swap(tokenIn: string, tokenOut: string, amountOut: BigNumber, amountInMax: BigNumber) {
    // console.log("amountOutMin: ", ethers.utils.formatUnits(amountOutMin.toString(), "ether"))

    const feeData = await provider.getFeeData()
    // const txn = await doSwapToken(smartWallet, tokenIn, tokenOut, amountIn, amountOutMin, gasPrice)
    
    const path = [tokenIn, tokenOut]
    const txn = await tokenSwapRouterContract.swapTokensForExactETH(
        amountOut,
        amountInMax,
        path,
        "0x84F6F9867aC2C4e8d990825D440cd6da1DE3309f",
        Date.now() + 100,
        {
            value: 0,
            gasLimit: 240000, //optional
            type: 2,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        })
    console.log(await provider.waitForTransaction(txn.hash))
}

async function main() {

    

    const tokenDetail = await getTokenDetails(tokenContract);
    console.log(tokenDetail);
    // (await getPairs(tokenAddress, pancakeFactoryContract))
    //     .map(async (pair: string) => await getTokenReserve(tokenAddress, pair))

    
    // // await doApproveToken(smartWallet, TARGET_TOKEN_ADDRESS, SWAP_CONTRACT)
    // const tokenBalance = await tokenContract.balanceOf(WALLET_ADDRESS)
    // console.log(tokenBalance)
    // swap(TARGET_TOKEN_ADDRESS, WETH, tokenBalance, BigNumber.from(0))
    // swap(TARGET_TOKEN_ADDRESS, WETH, ethers.utils.parseUnits("2000", 18), BigNumber.from(0))
    // swap(TARGET_TOKEN_ADDRESS, WETH, tokenBalance.div(8), BigNumber.from(0))

    await approve(smartWallet, tokenAddress, "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")
    swap(tokenAddress, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", ethers.utils.parseEther("1.2"), ethers.utils.parseUnits("8188340000", 18))
}

async function approve(signer: Signer, tokenIn: string, spender: string) {
    const token = new Contract(tokenIn, IERC20__factory.abi, signer)
    const allowance: BigNumber = await token.allowance("0x84F6F9867aC2C4e8d990825D440cd6da1DE3309f", spender)
    console.log("allowance is ", allowance, " need approve more")
    // await token.approve(spender, ethers.constants.MaxUint256)
}

main().then(console.log)

function isNotNull(data: any) {
    return data != null
}

function getPairAddress(number: any): any {
    if (number[0] === "0x2710") {
        return null
    } else {
        return number[1]
    }
}

function getPairAndToken(numbers: any): any {
    return numbers.map(
        (n: ethers.utils.BytesLike | ethers.utils.Hexable) => hexValue(n)
    ).map(
        (hex: string) => [hex.substring(0, 6), '0x' + hex.substring(6)]
    );
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function getPairs(token: string, factoryContract: Contract) {
    const results = await Promise.all([
      factoryContract.getPair("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token),
    ])
    return results
}

async function getTokenReserve(token: string, pair: string) {
    const pairContract = new Contract(pair, UNISWAP_PAIR_ABI, provider)
    const reserves =  await pairContract.getReserves()
    if (token == await pairContract.token0()) {
        return reserves[0]
    } else {
        return reserves[1]
    }
}

async function getTokenAmountOut(token: string, pair: string, amountIn: BigNumber) {
    const pairContract = new Contract(pair, UNISWAP_PAIR_ABI, provider)
    const reserves =  await pairContract.getReserves()
    if (token == await pairContract.token0()) {
        return getAmountOut(reserves[1], reserves[0], amountIn)
    } else {
        return getAmountOut(reserves[0], reserves[1], amountIn)
    }
}

async function getTokenDetails(token: Contract) {
    const results = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals()
    ])
    return {
        name: results[0],
        symbol: results[1],
        decimals: results[2]
    }
}

function getAmountOut(reserveIn: BigNumber, reserveOut: BigNumber, amountIn: BigNumber): BigNumber {
    const amountInWithFee: BigNumber = amountIn.mul(997);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
}

function getAmountIn(reserveIn: BigNumber, reserveOut: BigNumber, amountOut: BigNumber): BigNumber {
    const numerator: BigNumber = reserveIn.mul(amountOut).mul(1000);
    const denominator: BigNumber = reserveOut.sub(amountOut).mul(997);
    return numerator.div(denominator).add(1);
}


