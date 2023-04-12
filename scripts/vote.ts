
import { ethers } from "ethers";
import { Ballot } from "../typechain-types";
import { Ballot_Json, CONTRACT_ADDRESS } from "./util/scriptUtils";

async function main() {

  const proposalToVote = 1;
  
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
  console.log("Using signer to cast a vote for proposal: ", proposalToVote);
  const castVoteTx = await ballotContract.vote(proposalToVote);
  const castVoteReceipt = await castVoteTx.wait();
  console.log({ castVoteReceipt });
  const proposal = await ballotContract.proposals(proposalToVote);
  const proposalName = ethers.utils.parseBytes32String(proposal.name);
  console.log({ index: 0, proposalName, proposal });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});