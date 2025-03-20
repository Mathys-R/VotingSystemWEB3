const fs = require("fs");
const path = require("path");
const readline = require('readline');

async function main() {
  // Déterminer le chemin du fichier journal de déploiement
  const deploymentDir = path.join(__dirname, "../ignition/deployments");
  
  // Essayer d'abord le réseau local (chain-31337)
  let journalPath = path.join(deploymentDir, "chain-31337", "journal.jsonl");
  
  // Si ce fichier n'existe pas, essayer Sepolia
  if (!fs.existsSync(journalPath)) {
    journalPath = path.join(deploymentDir, "chain-11155111", "journal.jsonl");
    if (!fs.existsSync(journalPath)) {
      throw new Error("Aucun fichier de déploiement trouvé. Veuillez d'abord déployer le contrat.");
    }
  }
  
  console.log(`Utilisation du fichier de déploiement: ${journalPath}`);
  
  // Lire le fichier journal ligne par ligne pour trouver l'adresse du contrat
  let contractAddress = null;
  const fileStream = fs.createReadStream(journalPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const logEntry = JSON.parse(line);
      // Rechercher les entrées contenant l'adresse du contrat déployé
      if (logEntry.type === "CONTRACT_ADDRESS_CREATED" && logEntry.contractName === "Voting") {
        contractAddress = logEntry.address;
        break;
      }
    } catch (e) {
      // Ignorer les lignes qui ne sont pas du JSON valide
    }
  }

  if (!contractAddress) {
    throw new Error("Adresse du contrat Voting non trouvée dans le journal de déploiement");
  }
  
  console.log(`Adresse du contrat Voting trouvée: ${contractAddress}`);

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