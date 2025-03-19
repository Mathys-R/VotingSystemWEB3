const { ethers } = require("hardhat");

async function main() {
  // Prépare le contrat pour le déploiement
  const MessageContract = await ethers.getContractFactory("MessageContract");

  // Déploie avec un message initial
  const contract = await MessageContract.deploy("Hello, Blockchain!");

  await contract.waitForDeployment();
  console.log("✅ Contrat déployé à l'adresse :", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});