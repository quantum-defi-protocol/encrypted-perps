const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ConfidentialPerpDEX...");

  const ConfidentialPerpDEX = await hre.ethers.getContractFactory("ConfidentialPerpDEX");
  const dex = await ConfidentialPerpDEX.deploy();
  await dex.waitForDeployment();

  const address = await dex.getAddress();
  console.log("✅ Deployed to:", address);
  console.log("\nAdd to .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch(console.error);
