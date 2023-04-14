import { ethers } from "hardhat";

async function main() {
  const hre = require("hardhat");
  const contractAddress = "0xCa5a1e13Eb6d449571b46a6AC68Dc8BC33f87B64";
  const deployedTimeLock = await hre.thor.getContractAt('TimeLock', contractAddress);

  // Create a fake tx id
  const myBytes32Value = ethers.utils.formatBytes32String("Hello, world!");
  const response = await deployedTimeLock.getTransactionDetails(myBytes32Value);
  console.log("timeLock responded with:", {response})
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});