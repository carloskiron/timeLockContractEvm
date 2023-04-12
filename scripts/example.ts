import { ethers } from "hardhat";
import { convertStringArrayToBytes32 } from "./util/scriptUtils";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function main() {
  const accounts = await ethers.getSigners();
  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  PROPOSALS.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });

  const ballotFactory = await ethers.getContractFactory("Ballot");
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  );
  
  await ballotContract.deployed();

  for (let index = 0; index < PROPOSALS.length; index++) {
    const proposal = await ballotContract.proposals(index);
    const name = ethers.utils.parseBytes32String(proposal.name);
    console.log({ index, name, proposal }); 
  }

  const chairPerson = await ballotContract.chairperson();
  console.log({ chairPerson });
  console.log({addressO: accounts[0].address, address1: accounts[1].address, address2: accounts[2].address});
  
  console.log("Giving right to vote to account 1");
  let voterForAccount1 = await ballotContract.voters(accounts[1].address);
  console.log({ voterForAccount1 });
  const giveRightToVoteTx = await ballotContract.giveRightToVote(accounts[1].address);
  const giveRightToVoteReceipt = await giveRightToVoteTx.wait();
  console.log({ giveRightToVoteReceipt });
  voterForAccount1 = await ballotContract.voters(accounts[1].address);
  console.log({ voterForAccount1 });
  
  console.log("Using account 1 to cast a vote for proposal 0");
  const castVoteTx = await ballotContract.connect(accounts[1]).vote(0);
  const castVoteReceipt = await castVoteTx.wait();
  console.log({ castVoteReceipt });
  const proposalO = await ballotContract.proposals(0);
  const proposalName = ethers.utils.parseBytes32String(proposalO.name);
  console.log({ index: 0, proposalName, proposalO });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});