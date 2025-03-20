import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
  // Déploiement du contrat Voting
  const voting = m.contract("Voting");

  return { voting };
});

export default VotingModule;