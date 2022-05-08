// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const GAS_PRICE = "40"
  const GAS_LIMIT = 260000
  const MAX_PEE_PER_GAS = ethers.utils.parseUnits(GAS_PRICE, "gwei")
  const MAX_PRIORITY_PER_GAS = ethers.utils.parseUnits(GAS_PRICE, "gwei")

  // We get the contract to deploy
  const studioProfileFactory = await ethers.getContractFactory("StudioProfile");
  const studioProfile = await studioProfileFactory.deploy()
  // const studioProfile = await studioProfileFactory.deploy({
  //   maxFeePerGas: MAX_PEE_PER_GAS,
  //   maxPriorityFeePerGas: MAX_PRIORITY_PER_GAS
  // });

  await studioProfile.deployed();

  console.log("StudioProfile deployed to:", studioProfile.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
