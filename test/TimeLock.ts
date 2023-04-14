import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TokenSale } from "../typechain-types";
import { MyERC20 } from "../typechain-types/contracts/MyERC20";


const ERC20_TOKEN_RATIO = 5;

describe("NFT Shop", () => {

    let tokenSaleContract: TokenSale;
    let erc20Token: MyERC20;
    let deployer: SignerWithAddress;
    let account1: SignerWithAddress;
    let account2: SignerWithAddress;

    beforeEach(async () => {
        [deployer, account1, account2] = await ethers.getSigners();
        const erc20TokenFactory = await ethers.getContractFactory("MyERC20");
        erc20Token = await erc20TokenFactory.deploy();
        const tokenSaleFactory = await ethers.getContractFactory("TokenSale");
        tokenSaleContract = await tokenSaleFactory.deploy(ERC20_TOKEN_RATIO, erc20Token.address);
        await tokenSaleContract.deployed();
        //giving minting rights
        const MINTER_ROLE = await erc20Token.MINTER_ROLE();
        await erc20Token.grantRole(MINTER_ROLE, tokenSaleContract.address);
    });

    describe("When the Shop contract is deployed", async () => {
        it("defines the ratio as provided in parameters", async () => {
            const currentRatio = await tokenSaleContract.ratio();
            expect(currentRatio).to.eq(ERC20_TOKEN_RATIO);
        });

        it("uses a valid ERC20 as payment token", async () => {
            const paymentTokenAddress = await tokenSaleContract.paymentToken();
            const erc20TokenFactory = await ethers.getContractFactory("MyERC20");
            const erc20contract = erc20TokenFactory.attach(paymentTokenAddress);
            const myBalance = await erc20contract.balanceOf(deployer.address);
            expect(myBalance).to.eq(0);
            const totalSupply = await erc20contract.totalSupply();
            expect(totalSupply).to.eq(0);
        });
    });

    describe("When a user purchase an ERC20 from the Token contract", async () => {

        let amountToBeSetBn = ethers.utils.parseEther("1");
        let amountToBeReceived=  amountToBeSetBn.div(ERC20_TOKEN_RATIO);
        let balanceBeforeBn: BigNumber;
        let gasCost: BigNumber;
        //let amountToBeSetBn = ethers.utils.parseUnits("1", "wei");
        beforeEach(async () => {
            balanceBeforeBn = await account1.getBalance();
            const tx = await tokenSaleContract.connect(account1).purchaseTokens({ value: amountToBeSetBn });
            const txTeceipt = await tx.wait();
            const gasUnits = txTeceipt.gasUsed;
            const gasPrice = txTeceipt.effectiveGasPrice;
            gasCost = gasUnits.mul(gasPrice);
        });

        it("charges the correct amount of ETH", async () => {
            const balanceAfterBn = await account1.getBalance();
            const diff = balanceBeforeBn.sub(balanceAfterBn);
            const expectedDiff = amountToBeSetBn.add(gasCost);
            const error = diff.sub(expectedDiff);
            expect(error).to.eq(0);
        });

        it("gives the correct amount of tokens", async () => {
            const account1Balance = await erc20Token.balanceOf(account1.address);
            expect(account1Balance).to.eq(amountToBeReceived);
        });

        it("Increases the balance of ETH in the contract", async () => {
            const erc2oTokenContractBalance = await ethers.provider.getBalance(erc20Token.address);
            expect(erc2oTokenContractBalance).to.eq(amountToBeSetBn);
        });

        describe("When a user burns an ERC20 at the Token contract", async () => {
            let approvedGasCost: BigNumber;
            let burnGasCost: BigNumber;

            beforeEach(async () => {
                const tx = await erc20Token.connect(account1).approve(tokenSaleContract.address, amountToBeSetBn);
                const txApproveReceipt = await tx.wait();
                const approvedGasUnits = txApproveReceipt.gasUsed;
                const apporvedGasPrice = txApproveReceipt.effectiveGasPrice;
                approvedGasCost = approvedGasUnits.mul(apporvedGasPrice);
                const txBurn = await tokenSaleContract.connect(account1).burnTokens(amountToBeReceived);
                const txReceipt = await txBurn.wait();
                const gasUnits = txReceipt.gasUsed;
                const gasPrice = txReceipt.effectiveGasPrice;
                approvedGasCost = gasUnits.mul(gasPrice);
                burnGasCost = gasUnits.mul(gasPrice);
            });

            it("gives the correct amount of ETH", async () => {
                const balanceAfterBn =await account1.getBalance();
                const diff = balanceBeforeBn.sub(balanceAfterBn);
                const expectedDiff = diff
            });

            it("burns the correct amount of tokens", async () => {
                throw new Error("Not implemented");
            });
        });

    });

    describe("When a user purchase a NFT from the Shop contract", async () => {
        it("charges the correct amount of ETH", async () => {
            throw new Error("Not implemented");
        });

        it("updates the owner account correctly", async () => {
            throw new Error("Not implemented");
        });

        it("update the pool account correctly", async () => {
            throw new Error("Not implemented");
        });

        it("favors the pool with the rounding", async () => {
            throw new Error("Not implemented");
        });
    });

    describe("When a user burns their NFT at the Shop contract", async () => {
        it("gives the correct amount of ERC20 tokens", async () => {
            throw new Error("Not implemented");
        });
        it("updates the pool correctly", async () => {
            throw new Error("Not implemented");
        });
    });

    describe("When the owner withdraw from the Shop contract", async () => {
        it("recovers the right amount of ERC20 tokens", async () => {
            throw new Error("Not implemented");
        });

        it("updates the owner account correctly", async () => {
            throw new Error("Not implemented");
        });
    });
});