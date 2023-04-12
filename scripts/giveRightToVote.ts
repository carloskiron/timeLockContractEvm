
import { ethers } from "ethers";
import { Ballot } from "../typechain-types";
import { Ballot_Json, CONTRACT_ADDRESS } from "./util/scriptUtils";

const ADDRESS_TO_GIVE_RIGHTS = ""; // address to give right to vote

async function main() {
  
  //providers are reuqired to connect to a public blockchain
  const options = {};
  const provider = ethers.getDefaultProvider("goerli", options);
  
  // you can also create a random wallet = const wallet =ethers.Wallet.createRandom();
  const wallet =ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log({ balance });

  if (balance < 0.01) throw new Error("Not enough ether");
  
  const ballotContract = new ethers.Contract(CONTRACT_ADDRESS, Ballot_Json.abi, signer) as Ballot;
  console.log("Giving right to vote to: ", ADDRESS_TO_GIVE_RIGHTS);
  let voterForAccount = await ballotContract.voters(ADDRESS_TO_GIVE_RIGHTS);
  console.log({ voterForAccount });
  // const gasEstimated = await ballotContract.estimateGas.giveRightToVote(ADDRESS_TO_GIVE_RIGHTS);
  // { gasLimit: gasEstimated, or a fixed value like 50000 }
  const giveRightToVoteTx = await ballotContract.giveRightToVote(ADDRESS_TO_GIVE_RIGHTS);
  const giveRightToVoteReceipt = await giveRightToVoteTx.wait();
  console.log({ giveRightToVoteReceipt });
  voterForAccount = await ballotContract.voters(ADDRESS_TO_GIVE_RIGHTS);
  console.log({ voterForAccount });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});