import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat';
import * as dotenv from 'dotenv'

require('@vechain.energy/hardhat-thor')

dotenv.config();

const config: HardhatUserConfig = {
  paths: { tests: "test" },
  solidity: "0.8.17",
  networks: {
    vechain: {
      url: 'https://testnet.veblocks.net',
      privateKey: "",
      delegateUrl: 'https://sponsor-testnet.vechain.energy/by/90',
      blockGasLimit: 10000000
    }
  }
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

export default config;
