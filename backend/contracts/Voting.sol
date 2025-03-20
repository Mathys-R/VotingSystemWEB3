// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting
 * @dev Implémente un système de vote décentralisé
 * @notice Ce contrat permet à un administrateur de gérer un processus de vote complet
 */
contract Voting is Ownable {
    
    /**
     * @dev Structure représentant un votant
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    
    /**
     * @dev Structure représentant une proposition
     */
    struct Proposal {
        string description;
        uint voteCount;
    }
    
    /**
     * @dev Énumération des différentes phases du processus de vote
     */
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }
    
    // État actuel du workflow
    WorkflowStatus public workflowStatus;
    
    // Mapping des votants par adresse
    mapping(address => Voter) public voters;
    
    // Tableau des propositions
    Proposal[] public proposals;
    
    // ID de la proposition gagnante
    uint public winningProposalId;
    
    // Tableau des adresses des électeurs inscrits
    address[] public voterAddresses;
    
    // Événements
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);
    
    // Fonctionnalités DWYW (Do What You Want)
    // 1. Délégation de vote
    mapping(address => address) public delegations;
    event VoteDelegated(address from, address to);
    
    // 2. Temps limite pour chaque phase
    uint public phaseDeadline;
    bool public useTimeConstraints;
    event DeadlineSet(uint timestamp);
    
    /**
     * @dev Constructeur du contrat
     * @notice Initialise le contrat en mode RegisteringVoters et définit le déployeur comme propriétaire
     */
    constructor() Ownable(msg.sender) {
        workflowStatus = WorkflowStatus.RegisteringVoters;
    }
    
    /**
     * @dev Modificateur vérifiant que l'appelant est un électeur inscrit
     */
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a registered voter");
        _;
    }
    
    /**
     * @dev Modificateur vérifiant que la phase actuelle est celle attendue
     * @param _status La phase attendue
     */
    modifier onlyDuringPhase(WorkflowStatus _status) {
        require(workflowStatus == _status, "Current phase does not allow this operation");
        if (useTimeConstraints) {
            require(block.timestamp <= phaseDeadline, "Phase deadline has passed");
        }
        _;
    }
    
    /**
     * @dev Inscrire un nouvel électeur sur la liste blanche
     * @param _voterAddress L'adresse Ethereum de l'électeur à inscrire
     */
    function registerVoter(address _voterAddress) 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.RegisteringVoters) 
    {
        require(!voters[_voterAddress].isRegistered, "Voter already registered");
        
        voters[_voterAddress].isRegistered = true;
        voterAddresses.push(_voterAddress);
        
        emit VoterRegistered(_voterAddress);
    }
    
    /**
     * @dev Démarrer la session d'enregistrement des propositions
     */
    function startProposalsRegistration() 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.RegisteringVoters) 
    {
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        
        // Ajouter une proposition vide au début pour que les IDs commencent à 1
        proposals.push(Proposal("", 0));
        
        emit WorkflowStatusChange(previousStatus, workflowStatus);
    }
    
    /**
     * @dev Enregistrer une nouvelle proposition
     * @param _description La description de la proposition
     */
    function registerProposal(string calldata _description) 
        external 
        onlyVoters 
        onlyDuringPhase(WorkflowStatus.ProposalsRegistrationStarted) 
    {
        require(bytes(_description).length > 0, "Cannot submit empty proposal");
        
        proposals.push(Proposal(_description, 0));
        
        emit ProposalRegistered(proposals.length - 1);
    }
    
    /**
     * @dev Mettre fin à la session d'enregistrement des propositions
     */
    function endProposalsRegistration() 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.ProposalsRegistrationStarted) 
    {
        require(proposals.length > 1, "No proposals registered yet");
        
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        
        emit WorkflowStatusChange(previousStatus, workflowStatus);
    }
    
    /**
     * @dev Démarrer la session de vote
     */
    function startVotingSession() 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.ProposalsRegistrationEnded) 
    {
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        
        emit WorkflowStatusChange(previousStatus, workflowStatus);
    }
    
    /**
     * @dev Voter pour une proposition
     * @param _proposalId L'ID de la proposition choisie
     */
    function vote(uint _proposalId) 
        external 
        onlyVoters 
        onlyDuringPhase(WorkflowStatus.VotingSessionStarted) 
    {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_proposalId > 0 && _proposalId < proposals.length, "Invalid proposal ID");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = _proposalId;
        proposals[_proposalId].voteCount++;
        
        // Compter les votes délégués à cet électeur
        for (uint i = 0; i < voterAddresses.length; i++) {
            address delegator = voterAddresses[i];
            if (delegations[delegator] == msg.sender && !voters[delegator].hasVoted) {
                voters[delegator].hasVoted = true;
                voters[delegator].votedProposalId = _proposalId;
                proposals[_proposalId].voteCount++;
            }
        }
        
        emit Voted(msg.sender, _proposalId);
    }
    
    /**
     * @dev Clôturer la session de vote
     */
    function endVotingSession() 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.VotingSessionStarted) 
    {
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        
        emit WorkflowStatusChange(previousStatus, workflowStatus);
    }
    
    /**
     * @dev Comptabiliser les votes et déterminer la proposition gagnante
     */
    function tallyVotes() 
        external 
        onlyOwner 
        onlyDuringPhase(WorkflowStatus.VotingSessionEnded) 
    {
        uint maxVotes = 0;
        
        for (uint i = 1; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVotes) {
                maxVotes = proposals[i].voteCount;
                winningProposalId = i;
            }
        }
        
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotesTallied;
        
        emit WorkflowStatusChange(previousStatus, workflowStatus);
    }
    
    /**
     * @dev Obtenir les informations de la proposition gagnante
     * @return winningProposalId L'ID de la proposition gagnante
     * @return description La description de la proposition gagnante
     * @return voteCount Le nombre de votes pour la proposition gagnante
     */
    function getWinner() 
        external 
        view 
        returns (uint, string memory description, uint voteCount) 
    {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes not tallied yet");
        return (
            winningProposalId,
            proposals[winningProposalId].description,
            proposals[winningProposalId].voteCount
        );
    }
    
    /**
     * @dev Obtenir le nombre total de propositions
     * @return Le nombre de propositions (sans compter la proposition nulle à l'index 0)
     */
    function getProposalsCount() external view returns (uint) {
        return proposals.length > 0 ? proposals.length - 1 : 0;
    }
    
    /**
     * @dev Obtenir les détails d'une proposition
     * @param _proposalId L'ID de la proposition
     * @return description La description de la proposition
     * @return voteCount Le nombre de votes pour la proposition
     */
    function getProposal(uint _proposalId) 
        external 
        view 
        returns (string memory description, uint voteCount) 
    {
        require(_proposalId > 0 && _proposalId < proposals.length, "Invalid proposal ID");
        return (
            proposals[_proposalId].description,
            proposals[_proposalId].voteCount
        );
    }
    
    // Fonctionnalités DWYW (Do What You Want)
    
    /**
     * @dev Déléguer son vote à un autre électeur
     * @param _to L'adresse de l'électeur à qui déléguer son vote
     * @notice La délégation doit être faite avant de voter
     */
    function delegateVoteTo(address _to) 
        external 
        onlyVoters 
        onlyDuringPhase(WorkflowStatus.VotingSessionStarted) 
    {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(voters[_to].isRegistered, "Delegate is not a registered voter");
        require(_to != msg.sender, "Cannot delegate to yourself");
        require(delegations[msg.sender] == address(0), "You have already delegated your vote");
        
        // Éviter les boucles de délégation
        address currentDelegate = _to;
        while (delegations[currentDelegate] != address(0)) {
            currentDelegate = delegations[currentDelegate];
            require(currentDelegate != msg.sender, "Delegation loop detected");
        }
        
        delegations[msg.sender] = _to;
        
        // Si le délégué a déjà voté, ajouter immédiatement le vote délégué
        if (voters[_to].hasVoted) {
            proposals[voters[_to].votedProposalId].voteCount++;
            voters[msg.sender].hasVoted = true;
            voters[msg.sender].votedProposalId = voters[_to].votedProposalId;
        }
        
        emit VoteDelegated(msg.sender, _to);
    }
    
    /**
     * @dev Définir une limite de temps pour la phase actuelle
     * @param _durationInMinutes La durée de la phase en minutes
     */
    function setPhaseDeadline(uint _durationInMinutes) 
        external 
        onlyOwner 
    {
        require(_durationInMinutes > 0, "Duration must be greater than 0");
        
        useTimeConstraints = true;
        phaseDeadline = block.timestamp + (_durationInMinutes * 1 minutes);
        
        emit DeadlineSet(phaseDeadline);
    }
    
    /**
     * @dev Désactiver les contraintes de temps
     */
    function disableTimeConstraints() 
        external 
        onlyOwner 
    {
        useTimeConstraints = false;
    }
    
    /**
     * @dev Passer automatiquement à la phase suivante si la date limite est dépassée
     * @notice Cette fonction peut être appelée par n'importe qui
     */
    function checkAndUpdatePhase() external {
        if (useTimeConstraints && block.timestamp > phaseDeadline) {
            WorkflowStatus previousStatus = workflowStatus;
            
            if (workflowStatus == WorkflowStatus.RegisteringVoters) {
                workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
                // Ajouter une proposition vide au début pour que les IDs commencent à 1
                if (proposals.length == 0) {
                    proposals.push(Proposal("", 0));
                }
            }
            else if (workflowStatus == WorkflowStatus.ProposalsRegistrationStarted) {
                workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
            }
            else if (workflowStatus == WorkflowStatus.ProposalsRegistrationEnded) {
                workflowStatus = WorkflowStatus.VotingSessionStarted;
            }
            else if (workflowStatus == WorkflowStatus.VotingSessionStarted) {
                workflowStatus = WorkflowStatus.VotingSessionEnded;
            }
            else if (workflowStatus == WorkflowStatus.VotingSessionEnded) {
                workflowStatus = WorkflowStatus.VotesTallied;
                
                // Déterminer automatiquement le gagnant
                uint maxVotes = 0;
                for (uint i = 1; i < proposals.length; i++) {
                    if (proposals[i].voteCount > maxVotes) {
                        maxVotes = proposals[i].voteCount;
                        winningProposalId = i;
                    }
                }
            }
            
            if (previousStatus != workflowStatus) {
                emit WorkflowStatusChange(previousStatus, workflowStatus);
            }
        }
    }
}