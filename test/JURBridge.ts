import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TimeLock, JURToken } from "../typechain-types";
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const { blake2AsHex } = require('@polkadot/util-crypto');

describe("JUR Bridge", () => {
    let timeLockContract: TimeLock;
    let erc20JurToken: JURToken;
    let deployer: SignerWithAddress;
    let account1: SignerWithAddress; //Alice
    let bridgeHoldingsEvmAccount: SignerWithAddress;
    let senderInitialBalance = 1000;
    let api: any;
    let secret: string = "Let's swap some JUR";
    let secretInBytes = ethers.utils.formatBytes32String(secret);
    const hash = blake2AsHex(secret, 256);
    let bridgeHoldingsSubstrateAccount: any;
    let account1Substrate: any;
    const JurAssetIdSubstrate = 1979; //JUR token assetId
    let txId: any;

    beforeEach(async () => {
         // VeChainThor setup
        [deployer, account1, bridgeHoldingsEvmAccount] = await ethers.getSigners();
        const erc20TokenFactory = await ethers.getContractFactory("JURToken");
        erc20JurToken = await erc20TokenFactory.deploy();
        const timeLockFactory = await ethers.getContractFactory("TimeLock");
        timeLockContract = await timeLockFactory.deploy();
        await timeLockContract.deployed();
        await erc20JurToken.transfer(account1.address, senderInitialBalance);
        const account1Balance = await erc20JurToken.balanceOf(account1.address);
        expect(account1Balance).to.eq(senderInitialBalance);
        expect(hash).not.to.be.undefined;

        // Substrate node connection / setup
        const provider = new WsProvider(process.env.SUBSTRATE_WS_URL);
        api = await ApiPromise.create({ provider });
        const [chain, nodeName, nodeVersion] = await Promise.all([
             api.rpc.system.chain(),
             api.rpc.system.name(),
             api.rpc.system.version(),
        ]);
        console.log(
             `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
         );

        // Accounts in the substrate side.
        const keyring = new Keyring({ type: 'sr25519' });
        bridgeHoldingsSubstrateAccount = keyring.addFromUri('//Alice');
        account1Substrate = keyring.addFromUri('//Bob');
         
    });

    describe("atomic swap initial lock", async () => {
        it("Acount 1 locks some JUR in VeChainThor to start the swap", async () => {
            const assetAmount = 100;
            const timelock = 5;
            const approveTx = await erc20JurToken.approve(timeLockContract.address, assetAmount);
            await approveTx.wait();
            const lockTx = await timeLockContract.lock(bridgeHoldingsEvmAccount.address, hash, timelock, erc20JurToken.address, assetAmount);
            const txReceipt = await lockTx.wait();
            expect(txReceipt).not.to.be.undefined;
            // txId is the unique identifier of the transaction and must be used for locking in the substrate side.
            txId = txReceipt.events?.find((e) => e.event === "Locked")?.args['txId'];
            expect(txId).not.to.be.undefined;
            console.log(`Transaction id: ${txId} and hash: ${hash}`);
        });

        it("New tx created using same txId and hash to lock some JUR from the substrate bridgeHoldings account through substrate pallet", async () => {
            const assetAmount = 100;
            const timelock = 5;
            const tx =  api.tx.aswap.lock(txId, account1Substrate.address, hash, timelock, JurAssetIdSubstrate, assetAmount);
            // Wait for the extrinsic to be included in a block
            const txHash = await tx.signAndSend(bridgeHoldingsSubstrateAccount);
            await tx.finalized;
            // Process the response data
            console.log(`Transaction hash: ${txHash}`);
        });

        it("Account 1 can now unlock their tokens in the substrate chain side. Doing this will revel the secret", async () => {
            const tx =  api.tx.aswap.unlock(txId, secretInBytes);
            // Wait for the extrinsic to be included in a block
            const txHash = await tx.signAndSend(account1Substrate);
            await tx.finalized;
            // Process the response data
            console.log(`Transaction hash: ${txHash}`);
        });

        it("bridgeHoldingsEvmAccount in the VeChain side can now unlock their tokens using the reveled secret", async () => {
            const unlockTx = await timeLockContract.unlock(txId, secretInBytes);
            const txReceipt = await unlockTx.wait();
            expect(txReceipt).not.to.be.undefined;
            const unlokedTxId = txReceipt.events?.find((e) => e.event === "Unlocked")?.args['txId'];
            expect(txId).to.eq(unlokedTxId);
            console.log(`Transaction unlocked: ${unlokedTxId}`);
        });
    }); 
});