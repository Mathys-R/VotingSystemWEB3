const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting Contract", function () {
  let Voting;
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;
  let nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    
    // Déploiement du contrat
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Initialisation", function () {
    it("devrait être déployé avec l'état initial RegisteringVoters", async function () {
      expect(await voting.workflowStatus()).to.equal(0);
    });
    
    it("devrait définir le déployeur comme owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });
  });

  describe("Enregistrement des électeurs", function () {
    it("permet à l'owner d'enregistrer un électeur", async function () {
      await voting.registerVoter(voter1.address);
      const voter = await voting.voters(voter1.address);
      expect(voter.isRegistered).to.be.true;
    });
    
    it("émet un événement VoterRegistered lors de l'enregistrement", async function () {
      await expect(voting.registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
    });
    
    it("empêche l'enregistrement d'un électeur déjà inscrit", async function () {
      await voting.registerVoter(voter1.address);
      await expect(voting.registerVoter(voter1.address))
        .to.be.revertedWith("Voter already registered");
    });
    
    it("empêche les non-propriétaires d'enregistrer des électeurs", async function () {
      await expect(voting.connect(voter1).registerVoter(voter2.address))
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });
    
    it("empêche l'enregistrement dans une phase incorrecte", async function () {
      await voting.startProposalsRegistration();
      await expect(voting.registerVoter(voter1.address))
        .to.be.revertedWith("Current phase does not allow this operation");
    });
  });

  describe("Gestion des phases du workflow", function () {
    it("permet à l'owner de démarrer la session d'enregistrement des propositions", async function () {
      await voting.startProposalsRegistration();
      expect(await voting.workflowStatus()).to.equal(1);
    });
    
    it("empêche les non-propriétaires de changer la phase", async function () {
      await expect(voting.connect(voter1).startProposalsRegistration())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });
    
    it("émet WorkflowStatusChange lors du changement de phase", async function () {
      await expect(voting.startProposalsRegistration())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(0, 1);
    });
    
    it("suit la séquence correcte des phases", async function () {
      // Préparer des électeurs et des propositions
      await voting.registerVoter(voter1.address);
      
      // Phase 1: ProposalsRegistrationStarted
      await voting.startProposalsRegistration();
      expect(await voting.workflowStatus()).to.equal(1);
      
      // Soumettre une proposition
      await voting.connect(voter1).registerProposal("Proposition 1");
      
      // Phase 2: ProposalsRegistrationEnded
      await voting.endProposalsRegistration();
      expect(await voting.workflowStatus()).to.equal(2);
      
      // Phase 3: VotingSessionStarted
      await voting.startVotingSession();
      expect(await voting.workflowStatus()).to.equal(3);
      
      // Voter
      await voting.connect(voter1).vote(1);
      
      // Phase 4: VotingSessionEnded
      await voting.endVotingSession();
      expect(await voting.workflowStatus()).to.equal(4);
      
      // Phase 5: VotesTallied
      await voting.tallyVotes();
      expect(await voting.workflowStatus()).to.equal(5);
    });
    
    it("empêche de sauter des phases", async function () {
      await expect(voting.endProposalsRegistration())
        .to.be.revertedWith("Current phase does not allow this operation");
    });
  });

  describe("Enregistrement des propositions", function () {
    beforeEach(async function () {
      await voting.registerVoter(voter1.address);
      await voting.startProposalsRegistration();
    });
    
    it("permet aux électeurs inscrits de soumettre une proposition", async function () {
      await voting.connect(voter1).registerProposal("Proposition 1");
      
      // La première proposition est à l'index 1 (index 0 est réservé)
      const [description, votes] = await voting.getProposal(1);
      expect(description).to.equal("Proposition 1");
      expect(votes).to.equal(0);
    });
    
    it("émet un événement ProposalRegistered lors d'une nouvelle proposition", async function () {
      await expect(voting.connect(voter1).registerProposal("Proposition 1"))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
    });
    
    it("empêche les non-électeurs de soumettre des propositions", async function () {
      await expect(voting.connect(nonVoter).registerProposal("Proposition non autorisée"))
        .to.be.revertedWith("You're not a registered voter");
    });
    
    it("empêche de soumettre une proposition vide", async function () {
      await expect(voting.connect(voter1).registerProposal(""))
        .to.be.revertedWith("Cannot submit empty proposal");
    });
  });

  describe("Vote", function () {
    beforeEach(async function () {
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      
      await voting.startProposalsRegistration();
      await voting.connect(voter1).registerProposal("Proposition 1");
      await voting.connect(voter2).registerProposal("Proposition 2");
      
      await voting.endProposalsRegistration();
      await voting.startVotingSession();
    });
    
    it("permet aux électeurs inscrits de voter", async function () {
      await voting.connect(voter1).vote(1);
      
      const voter = await voting.voters(voter1.address);
      expect(voter.hasVoted).to.be.true;
      expect(voter.votedProposalId).to.equal(1);
      
      const [, voteCount] = await voting.getProposal(1);
      expect(voteCount).to.equal(1);
    });
    
    it("émet un événement Voted lors du vote", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 1);
    });
    
    it("empêche de voter pour une proposition invalide", async function () {
      await expect(voting.connect(voter1).vote(99))
        .to.be.revertedWith("Invalid proposal ID");
    });
    
    it("empêche de voter deux fois", async function () {
      await voting.connect(voter1).vote(1);
      await expect(voting.connect(voter1).vote(2))
        .to.be.revertedWith("You have already voted");
    });
  });

  describe("Comptabilisation des votes", function () {
    beforeEach(async function () {
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.registerVoter(voter3.address);
      
      await voting.startProposalsRegistration();
      await voting.connect(voter1).registerProposal("Proposition 1");
      await voting.connect(voter2).registerProposal("Proposition 2");
      
      await voting.endProposalsRegistration();
      await voting.startVotingSession();
      
      // Voter pour la proposition 2
      await voting.connect(voter1).vote(2);
      await voting.connect(voter2).vote(2);
      await voting.connect(voter3).vote(1);
      
      await voting.endVotingSession();
    });
    
    it("détermine correctement la proposition gagnante", async function () {
      await voting.tallyVotes();
      
      expect(await voting.winningProposalId()).to.equal(2);
    });
    
    it("renvoie les détails corrects du gagnant", async function () {
      await voting.tallyVotes();
      
      const [id, description, voteCount] = await voting.getWinner();
      expect(id).to.equal(2);
      expect(description).to.equal("Proposition 2");
      expect(voteCount).to.equal(2);
    });
  });

  describe("Fonctionnalité de délégation", function () {
    beforeEach(async function () {
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      
      await voting.startProposalsRegistration();
      await voting.connect(voter1).registerProposal("Proposition 1");
      await voting.endProposalsRegistration();
      await voting.startVotingSession();
    });
    
    it("permet de déléguer son vote", async function () {
      await voting.connect(voter1).delegateVoteTo(voter2.address);
      expect(await voting.delegations(voter1.address)).to.equal(voter2.address);
    });
    
    it("applique la délégation lors du vote du délégué", async function () {
      await voting.connect(voter1).delegateVoteTo(voter2.address);
      await voting.connect(voter2).vote(1);
      
      const [, voteCount] = await voting.getProposal(1);
      expect(voteCount).to.equal(2); // Le vote de voter2 + le vote délégué de voter1
    });
    
    it("empêche les délégations en boucle", async function () {
      await voting.connect(voter1).delegateVoteTo(voter2.address);
      await expect(voting.connect(voter2).delegateVoteTo(voter1.address))
        .to.be.revertedWith("Delegation loop detected");
    });
  });

  describe("Fonctionnalité de contrainte de temps", function () {
    it("permet de définir une contrainte de temps", async function () {
      await voting.setPhaseDeadline(10); // 10 minutes
      expect(await voting.useTimeConstraints()).to.be.true;
    });
    
    it("permet de désactiver les contraintes de temps", async function () {
      await voting.setPhaseDeadline(10);
      await voting.disableTimeConstraints();
      expect(await voting.useTimeConstraints()).to.be.false;
    });
    
    it("passe automatiquement à la phase suivante après la date limite", async function () {
      await voting.setPhaseDeadline(1); // 1 minute
      
      // Avancer le temps de 2 minutes
      await time.increase(120);
      
      // Vérifier le changement de phase
      await voting.checkAndUpdatePhase();
      expect(await voting.workflowStatus()).to.equal(1); // ProposalsRegistrationStarted
    });
  });
});