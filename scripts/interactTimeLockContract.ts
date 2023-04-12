import { ethers } from "hardhat";

async function main() {
  const hre = require("hardhat");
  const contractAddress = "0x08beB33BC8E114Ae4C6fFFb9a31f49E3e8eb40dF";
  const deployedTimeLock = await hre.thor.getContractAt('TimeLock', contractAddress);

  // Create a bytes32 value
  const myBytes32Value = ethers.utils.formatBytes32String("Hello, world!");
  const response = await deployedTimeLock.getTransactionDetails(myBytes32Value);
  console.log("timeLock responded with:", {response})
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});