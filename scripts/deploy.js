const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy AIToken
  const AIToken = await hre.ethers.getContractFactory("AIToken");
  const aiToken = await AIToken.deploy(deployer.address);
  await aiToken.waitForDeployment();

  console.log("AIToken deployed to:", await aiToken.getAddress());

  // Deploy AIMarketplace
  const AIMarketplace = await hre.ethers.getContractFactory("AIMarketplace");
  const marketplace = await AIMarketplace.deploy(await aiToken.getAddress(), deployer.address);
  await marketplace.waitForDeployment();

  console.log("AIMarketplace deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});