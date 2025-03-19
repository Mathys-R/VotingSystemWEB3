// Configuration du frontend pour interagir avec MessageContract

// ABI correct du contrat MessageContract
const contractABI = [
    // Constructeur implicite dans l'ABI
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_initialMessage",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    // Fonction getMessage
    {
        "inputs": [],
        "name": "getMessage",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Fonction setMessage
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_newMessage",
                "type": "string"
            }
        ],
        "name": "setMessage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Adresse du contrat déployé (à mettre à jour après déploiement)
let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Variables globales
let provider;
let signer;
let contract;
let currentAccount = null;

// Éléments DOM
const connectButton = document.getElementById('connect-button');
const readMessageButton = document.getElementById('read-message');
const setMessageButton = document.getElementById('set-message-button');

// Initialisation de l'application
async function init() {
    try {
        // Charger l'adresse du contrat depuis le fichier JSON
        await loadContractAddress();
        
        // Configurer les écouteurs d'événements
        connectButton.addEventListener('click', connectWallet);
        readMessageButton.addEventListener('click', readMessage);
        setMessageButton.addEventListener('click', setMessage);

        // Vérifier si MetaMask est déjà connecté
        if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Écouter les changements de compte
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
            
            // Essayer de se connecter automatiquement
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                handleAccountsChanged(accounts);
            }
        } else {
            updateStatus("Veuillez installer MetaMask pour utiliser cette application");
        }
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        updateStatus("Erreur d'initialisation: " + error.message);
    }
}

// Charger l'adresse du contrat depuis le fichier JSON
async function loadContractAddress() {
    try {
        const response = await fetch('./contracts/contract-address.json');
        const data = await response.json();
        contractAddress = data.MessageContract;
        document.getElementById('contract-address').textContent = contractAddress;
    } catch (error) {
        console.error("Impossible de charger l'adresse du contrat:", error);
        document.getElementById('contract-address').textContent = "Erreur de chargement";
    }
}

// Connecter le portefeuille
async function connectWallet() {
    try {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
        } else {
            alert("Veuillez installer MetaMask!");
        }
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
    }
}

// Gérer le changement de compte
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        currentAccount = null;
        updateStatus("Non connecté");
        connectButton.textContent = "Connecter Wallet";
        document.getElementById('account').textContent = "";
    } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        document.getElementById('account').textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        connectButton.textContent = "Connecté";
        
        // Initialiser le contrat
        initContract();
    }
}

// Initialiser l'instance du contrat
async function initContract() {
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // Afficher le réseau
        const network = await provider.getNetwork();
        document.getElementById('network').textContent = `Réseau: ${network.name}`;
        
        updateStatus("Connecté au contrat");
    } catch (error) {
        console.error("Erreur lors de l'initialisation du contrat:", error);
        updateStatus("Erreur de connexion au contrat");
    }
}

// Lire le message actuel
async function readMessage() {
    try {
        if (!contract) {
            alert("Veuillez d'abord vous connecter");
            return;
        }
        
        const message = await contract.getMessage();
        document.getElementById('message-result').textContent = `Résultat: ${message}`;
    } catch (error) {
        console.error("Erreur lors de la lecture du message:", error);
        document.getElementById('message-result').textContent = `Erreur: ${error.message}`;
    }
}

// Définir un nouveau message
async function setMessage() {
    try {
        if (!contract) {
            alert("Veuillez d'abord vous connecter");
            return;
        }
        
        const newMessage = document.getElementById('new-message').value;
        if (!newMessage) {
            alert("Veuillez entrer un message");
            return;
        }
        
        showTransaction();
        const tx = await contract.setMessage(newMessage);
        await handleTransaction(tx, "Message défini avec succès");
        
        // Mettre à jour l'affichage du message après la modification
        readMessage();
    } catch (error) {
        hideTransaction();
        console.error("Erreur lors de la définition du message:", error);
        alert(`Erreur: ${error.message}`);
    }
}

// Gérer une transaction
async function handleTransaction(tx, successMessage) {
    try {
        document.getElementById('tx-status').textContent = "Transaction en attente de confirmation...";
        await tx.wait();
        hideTransaction();
        alert(successMessage);
    } catch (error) {
        hideTransaction();
        console.error("Erreur lors de la transaction:", error);
        alert(`Erreur de transaction: ${error.message}`);
    }
}

// Afficher l'animation de transaction
function showTransaction() {
    document.getElementById('transaction').classList.remove('hidden');
}

// Cacher l'animation de transaction
function hideTransaction() {
    document.getElementById('transaction').classList.add('hidden');
}

// Mettre à jour le statut du contrat
function updateStatus(message) {
    document.getElementById('contract-status').textContent = message;
}

// Initialiser l'application au chargement de la page
window.addEventListener('DOMContentLoaded', init);