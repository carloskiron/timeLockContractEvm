
import { ethers } from "hardhat";
import { contracts } from "../../typechain-types";

const TOKENS_MINTED = ethers.utils.parseEther("1")

async function main() {
    const [deployer, account1, account2] = await ethers.getSigners();
    //providers are reuqired to connect to a public blockchain
    const factory = await ethers.getContractFactory("MyERC20Votes");
    const contract = await factory.deploy();

    await contract.deployed();

    console.log(`My contract address is ${contract.address} with total supply ${await contract.totalSupply()}`);

    console.log("Minting new tokens... for Account 1");
    await contract.mint(account1.address, TOKENS_MINTED);

    console.log(`My contract total supply after miting is ${ethers.utils.formatEther(await contract.totalSupply())}`);

    console.log(`Current votePower... for Account 1 ${ethers.utils.formatEther(await contract.getVotes(account1.address))}`);

    const tx = await contract.connect(account1).delegate(account1.address);

    await tx.wait();

    console.log(`Current votePower... for Account 1 ${ethers.utils.formatEther(await contract.getVotes(account1.address))}`);

    await contract.mint(account2.address, TOKENS_MINTED);
    console.log(`My contract total supply after miting is ${ethers.utils.formatEther(await contract.totalSupply())}`);

    await contract.mint(account1.address, TOKENS_MINTED);
    console.log(`My contract total supply after miting is ${ethers.utils.formatEther(await contract.totalSupply())}`);

    const lastBlock = await ethers.provider.getBlock("latest");
    console.log(lastBlock.number);

    const array = [];
    for (let i = 0; i < lastBlock.number; i++)
        array.push(contract.getPastVotes(account1.address, i));

    const pastVotes = await Promise.all(array);

    console.log({pastVotes});


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});