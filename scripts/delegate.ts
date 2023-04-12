import { ethers } from "hardhat";
import { Ballot } from "../typechain-types/Ballot";
import { CONTRACT_ADDRESS, Ballot_Json } from "./util/scriptUtils";

async function main() {
  const provider = ethers.getDefaultProvider("goerli");
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  const signer = wallet.connect(provider);

  const ballotContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    Ballot_Json.abi,
    signer
  ) as Ballot;
  // Liobrasil is delegating his vote to Karlito971
  const tx = await ballotContract.delegate(
    "0x7bbf8a7971f5459b738ef2e1698ae4459ea535f7"
  );
  const receipt = await tx.wait();
  console.log(receipt);

  //checking the state change on my Voter variable
  const voterStruct = await ballotContract.voters(signer.address);

  //   Voter structured
  //   [
  //     BigNumber { _hex: '0x01', _isBigNumber: true },
  //     true,
  //     '0x7BBf8A7971F5459b738ef2E1698aE4459EA535F7',
  //     BigNumber { _hex: '0x00', _isBigNumber: true },
  //     weight: BigNumber { _hex: '0x01', _isBigNumber: true },
  //     voted: true,
  //     delegate: '0x7BBf8A7971F5459b738ef2E1698aE4459EA535F7',
  //     vote: BigNumber { _hex: '0x00', _isBigNumber: true }
  //   ]

  //delegate should be "0x7bbf8a7971f5459b738ef2e1698ae4459ea535f7"
  console.log(voterStruct[2]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
