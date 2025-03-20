const fs = require("fs");
const path = require("path");

async function main() {
  // Adresse par défaut du premier contrat déployé sur Hardhat local
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log(`Utilisation de l'adresse standard pour le déploiement local: ${contractAddress}`);

  // Récupérer l'ABI
  const abiFile = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
  if (!fs.existsSync(abiFile)) {
    throw new Error("Fichier ABI non trouvé. Veuillez compiler le contrat d'abord.");
  }
  
  const abiData = JSON.parse(fs.readFileSync(abiFile, "utf8"));
  const abi = abiData.abi;

  // Créer le fichier constants
  const constantsContent = `// Généré automatiquement - ${new Date().toISOString()}
export const VOTING_CONTRACT_ADDRESS = "${contractAddress}";
export const VOTING_CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};
`;

  // Créer le répertoire constants s'il n'existe pas
  const constantsDir = path.join(__dirname, "../../frontend/constants");
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }

  // Écrire le fichier constants
  const constantsPath = path.join(constantsDir, "index.js");
  fs.writeFileSync(constantsPath, constantsContent);

  console.log("Frontend constants updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });