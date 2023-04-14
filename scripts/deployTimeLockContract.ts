async function main() {
  const hre = require("hardhat");
  await hre.run('compile');
  const timeLockFactory = await hre.thor.getContractFactory("TimeLock");
  const jurFactory = await hre.thor.getContractFactory("JURToken");
  const timeLock = await timeLockFactory.deploy();
  await timeLock.deployed();
  console.log("TimeLock deployed to:", timeLock.address);
  const jurContract = await jurFactory.deploy();
  await jurContract.deployed();
  console.log("JUR token deployed to:", timeLock.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});