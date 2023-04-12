
import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types";
import { convertStringArrayToBytes32 } from "./util/scriptUtils";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function main() {
  
  //providers are reuqired to connect to a public blockchain
  const options = {};
  const provider = ethers.getDefaultProvider("goerli", options);
  
  const lastBlock = await provider.getBlock("latest");
  console.log({ lastBlock });
  
  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  PROPOSALS.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });
  
  // you can also create a random wallet = const wallet =ethers.Wallet.createRandom();
  const wallet =ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log({ balance });

  if (balance < 0.01) throw new Error("Not enough ether");
  
  const ballotFactory = new Ballot__factory(signer);
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  );

  const deployResult = await ballotContract.deployed();
  console.log({ deployResult });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});