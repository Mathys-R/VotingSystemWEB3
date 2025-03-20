import { create } from 'zustand';
import { ethers } from 'ethers';
import { VOTING_CONTRACT_ABI, VOTING_CONTRACT_ADDRESS, WorkflowStatus } from '../constants';

interface Voter {
  address: string;
  isRegistered: boolean;
  hasVoted: boolean;
  votedProposalId: number;
}

interface Proposal {
  id: number;
  description: string;
  voteCount: number;
}

interface VotingState {
  // Connection state
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  account: string | null;
  isOwner: boolean;
  isRegistered: boolean;
  
  // Contract data
  workflowStatus: WorkflowStatus;
  proposals: Proposal[];
  voters: Voter[];
  winner: Proposal | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Configuration
  isDevelopmentMode: boolean;
  
  // Actions
  connectWallet: () => Promise<void>;
  fetchContractData: () => Promise<void>;
  registerVoter: (address: string) => Promise<void>;
  startProposalsRegistration: () => Promise<void>;
  registerProposal: (description: string) => Promise<void>;
  endProposalsRegistration: () => Promise<void>;
  startVotingSession: () => Promise<void>;
  vote: (proposalId: number) => Promise<void>;
  endVotingSession: () => Promise<void>;
  tallyVotes: () => Promise<void>;
  delegateVote: (to: string) => Promise<void>;
  setPhaseDeadline: (minutes: number) => Promise<void>;
  disableTimeConstraints: () => Promise<void>;
  checkAndUpdatePhase: () => Promise<void>;
}

const useVotingStore = create<VotingState>((set, get) => ({
  // Initial state
  provider: null,
  signer: null,
  contract: null,
  account: null,
  isOwner: false,
  isRegistered: false,
  workflowStatus: WorkflowStatus.RegisteringVoters,
  proposals: [],
  voters: [],
  winner: null,
  isLoading: false,
  error: null,
  
  // Configuration du mode développement
  isDevelopmentMode: localStorage.getItem('isDevelopmentMode') === 'true' || false, // Par défaut false si pas de valeur dans localStorage
  
  // Connect to wallet and initialize contract
  connectWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Vérifier si on utilise le mode développement
      const { isDevelopmentMode } = get();
      
      if (isDevelopmentMode) {
        console.log("Mode développement activé: utilisation d'un wallet simulé");
        // Mock data for testing
        const mockAccount = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const mockOwner = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Same as account to simulate owner
        
        // Create a mock contract with the same interface
        const mockContract = {
          owner: () => Promise.resolve(mockOwner),
          voters: () => Promise.resolve({ isRegistered: true, hasVoted: false, votedProposalId: 0 }),
          workflowStatus: () => Promise.resolve(WorkflowStatus.RegisteringVoters),
          getProposalsCount: () => Promise.resolve(3),
          getProposal: (id: number) => {
            const proposals = [
              { description: "", voteCount: 0 },
              { description: "Proposition 1", voteCount: 2 },
              { description: "Proposition 2", voteCount: 1 },
              { description: "Proposition 3", voteCount: 0 }
            ];
            return Promise.resolve([proposals[id].description, proposals[id].voteCount]);
          },
          getWinner: () => Promise.resolve([1, "Proposition 1", 2]),
          registerVoter: () => Promise.resolve({ wait: () => Promise.resolve() }),
          startProposalsRegistration: () => Promise.resolve({ wait: () => Promise.resolve() }),
          registerProposal: () => Promise.resolve({ wait: () => Promise.resolve() }),
          endProposalsRegistration: () => Promise.resolve({ wait: () => Promise.resolve() }),
          startVotingSession: () => Promise.resolve({ wait: () => Promise.resolve() }),
          vote: () => Promise.resolve({ wait: () => Promise.resolve() }),
          endVotingSession: () => Promise.resolve({ wait: () => Promise.resolve() }),
          tallyVotes: () => Promise.resolve({ wait: () => Promise.resolve() }),
          delegateVoteTo: () => Promise.resolve({ wait: () => Promise.resolve() }),
          setPhaseDeadline: () => Promise.resolve({ wait: () => Promise.resolve() }),
          disableTimeConstraints: () => Promise.resolve({ wait: () => Promise.resolve() }),
          checkAndUpdatePhase: () => Promise.resolve({ wait: () => Promise.resolve() }),
          on: () => {}
        };
        
        set({
          provider: null,
          signer: null,
          contract: mockContract as any,
          account: mockAccount,
          isOwner: true,
          isRegistered: true,
          workflowStatus: WorkflowStatus.RegisteringVoters,
          isLoading: false
        });
        
        // Fetch initial mock data
        await get().fetchContractData();
        return;
      }
      
      // Real implementation for when MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask n'est pas installé. Veuillez installer MetaMask pour utiliser cette application.");
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Create ethers provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(
        VOTING_CONTRACT_ADDRESS,
        VOTING_CONTRACT_ABI,
        signer
      );
      
      // Check if connected account is the contract owner
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === account.toLowerCase();
      
      // Check if connected account is a registered voter
      const voter = await contract.voters(account);
      const isRegistered = voter.isRegistered;
      
      // Get current workflow status
      const workflowStatus = await contract.workflowStatus();
      
      set({
        provider,
        signer,
        contract,
        account,
        isOwner,
        isRegistered,
        workflowStatus,
        isLoading: false
      });
      
      // Setup event listeners
      setupEventListeners(contract, get, set);
      
      // Fetch initial contract data
      await get().fetchContractData();
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion au portefeuille" 
      });
    }
  },
  
  // Fetch contract data (proposals, voters, etc.)
  fetchContractData: async () => {
    try {
      const { contract, account } = get();
      if (!contract || !account) return;
      
      set({ isLoading: true, error: null });
      
      // Get current workflow status
      const workflowStatus = await contract.workflowStatus();
      
      // Fetch proposals if they exist
      const proposals: Proposal[] = [];
      if (workflowStatus >= WorkflowStatus.ProposalsRegistrationStarted) {
        const proposalCount = await contract.getProposalsCount();
        
        // Start from 1 because index 0 is reserved for empty proposal
        for (let i = 1; i <= proposalCount; i++) {
          const [description, voteCount] = await contract.getProposal(i);
          proposals.push({
            id: i,
            description,
            voteCount: voteCount.toNumber()
          });
        }
      }
      
      // Fetch winner if votes are tallied
      let winner = null;
      if (workflowStatus === WorkflowStatus.VotesTallied) {
        try {
          const [id, description, voteCount] = await contract.getWinner();
          winner = {
            id: id.toNumber(),
            description,
            voteCount: voteCount.toNumber()
          };
        } catch (error) {
          console.error("Error fetching winner:", error);
        }
      }
      
      // Update state
      set({
        workflowStatus,
        proposals,
        winner,
        isLoading: false
      });
      
    } catch (error) {
      console.error("Error fetching contract data:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la récupération des données du contrat" 
      });
    }
  },
  
  // Register a new voter
  registerVoter: async (address: string) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.registerVoter(address);
      await tx.wait();
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error registering voter:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'enregistrement de l'électeur" 
      });
    }
  },
  
  // Start proposals registration phase
  startProposalsRegistration: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.startProposalsRegistration();
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        set({
          workflowStatus: WorkflowStatus.ProposalsRegistrationStarted,
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error starting proposals registration:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors du démarrage de l'enregistrement des propositions" 
      });
    }
  },
  
  // Register a new proposal
  registerProposal: async (description: string) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.registerProposal(description);
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        const { proposals } = get();
        const newProposal = {
          id: proposals.length + 1,
          description,
          voteCount: 0
        };
        
        set({
          proposals: [...proposals, newProposal],
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error registering proposal:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'enregistrement de la proposition" 
      });
    }
  },
  
  // End proposals registration phase
  endProposalsRegistration: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.endProposalsRegistration();
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        set({
          workflowStatus: WorkflowStatus.ProposalsRegistrationEnded,
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error ending proposals registration:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la fin de l'enregistrement des propositions" 
      });
    }
  },
  
  // Start voting session
  startVotingSession: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.startVotingSession();
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        set({
          workflowStatus: WorkflowStatus.VotingSessionStarted,
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error starting voting session:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors du démarrage de la session de vote" 
      });
    }
  },
  
  // Vote for a proposal
  vote: async (proposalId: number) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.vote(proposalId);
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        const { proposals } = get();
        const updatedProposals = proposals.map(proposal => 
          proposal.id === proposalId 
            ? { ...proposal, voteCount: proposal.voteCount + 1 } 
            : proposal
        );
        
        set({
          proposals: updatedProposals,
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error voting:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors du vote" 
      });
    }
  },
  
  // End voting session
  endVotingSession: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.endVotingSession();
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        set({
          workflowStatus: WorkflowStatus.VotingSessionEnded,
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error ending voting session:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la fin de la session de vote" 
      });
    }
  },
  
  // Tally votes
  tallyVotes: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.tallyVotes();
      await tx.wait();
      
      // For mock implementation, directly update the state
      const { isDevelopmentMode } = get();
      if (isDevelopmentMode) {
        set({
          workflowStatus: WorkflowStatus.VotesTallied,
          winner: {
            id: 1,
            description: "Proposition 1",
            voteCount: 2
          },
          isLoading: false
        });
        return;
      }
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error tallying votes:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors du décompte des votes" 
      });
    }
  },
  
  // Delegate vote to another voter
  delegateVote: async (to: string) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.delegateVoteTo(to);
      await tx.wait();
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error delegating vote:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la délégation du vote" 
      });
    }
  },
  
  // Set phase deadline
  setPhaseDeadline: async (minutes: number) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.setPhaseDeadline(minutes);
      await tx.wait();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error setting phase deadline:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la définition de la date limite de phase" 
      });
    }
  },
  
  // Disable time constraints
  disableTimeConstraints: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.disableTimeConstraints();
      await tx.wait();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error disabling time constraints:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la désactivation des contraintes de temps" 
      });
    }
  },
  
  // Check and update phase
  checkAndUpdatePhase: async () => {
    try {
      const { contract } = get();
      if (!contract) throw new Error("Contract not initialized");
      
      set({ isLoading: true, error: null });
      
      // Call contract method
      const tx = await contract.checkAndUpdatePhase();
      await tx.wait();
      
      // Refresh data
      await get().fetchContractData();
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error checking and updating phase:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Une erreur s'est produite lors de la vérification et de la mise à jour de la phase" 
      });
    }
  }
}));

// Setup event listeners for contract events
function setupEventListeners(
  contract: ethers.Contract,
  get: () => VotingState,
  set: (state: Partial<VotingState>) => void
) {
  // Listen for workflow status changes
  contract.on("WorkflowStatusChange", async (previousStatus, newStatus) => {
    console.log("Workflow status changed:", previousStatus, "->", newStatus);
    await get().fetchContractData();
  });
  
  // Listen for new proposals
  contract.on("ProposalRegistered", async (proposalId) => {
    console.log("New proposal registered:", proposalId.toNumber());
    await get().fetchContractData();
  });
  
  // Listen for votes
  contract.on("Voted", async (voter, proposalId) => {
    console.log("Vote cast by", voter, "for proposal", proposalId.toNumber());
    await get().fetchContractData();
  });
  
  // Listen for voter registrations
  contract.on("VoterRegistered", async (voterAddress) => {
    console.log("New voter registered:", voterAddress);
    
    // If the registered voter is the current user, update isRegistered
    const { account } = get();
    if (account && voterAddress.toLowerCase() === account.toLowerCase()) {
      set({ isRegistered: true });
    }
    
    await get().fetchContractData();
  });
}

// Add type definition for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

export default useVotingStore;
