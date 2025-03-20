import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';
import { WorkflowStatus } from '../constants';

const ProposalList: React.FC = () => {
  const { 
    proposals, 
    workflowStatus, 
    isRegistered, 
    isLoading, 
    vote,
    winner
  } = useVotingStore();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const canVote = isRegistered && workflowStatus === WorkflowStatus.VotingSessionStarted;
  const showResults = workflowStatus >= WorkflowStatus.VotingSessionEnded;
  
  const handleVote = async (proposalId: number) => {
    try {
      setError(null);
      setSuccess(null);
      await vote(proposalId);
      setSuccess("Vote enregistré avec succès");
    } catch (err) {
      console.error("Error voting:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite lors du vote");
    }
  };
  
  // Don't show anything before the proposal registration phase
  if (workflowStatus < WorkflowStatus.ProposalsRegistrationStarted) {
    return null;
  }
  
  // Show a message if there are no proposals yet
  if (proposals.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 className="card-title">Propositions</h2>
        <p>Aucune proposition n'a encore été soumise.</p>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'gray' }}>
          <div>État actuel: {WorkflowStatus[workflowStatus]}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">
        {showResults ? "Résultats du vote" : "Propositions"}
        {workflowStatus === WorkflowStatus.VotesTallied && winner && (
          <span className="badge badge-winner" style={{ marginLeft: '0.5rem' }}>Gagnant déterminé</span>
        )}
      </h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert" style={{ backgroundColor: 'var(--color-green-50)', color: 'var(--color-green-600)', border: '1px solid var(--color-green-100)' }}>
          {success}
        </div>
      )}
      
      <div className="proposal-list">
        {proposals.map((proposal) => (
          <div 
            key={proposal.id} 
            className={`proposal-item ${winner && winner.id === proposal.id ? 'proposal-winner' : ''}`}
          >
            <div className="proposal-header">
              <div className="proposal-title">Proposition #{proposal.id}</div>
              {showResults && (
                <div className={`proposal-votes ${winner && winner.id === proposal.id ? 'badge-winner' : ''}`}>
                  {proposal.voteCount} vote{proposal.voteCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div className="proposal-description">{proposal.description}</div>
            
            {canVote && (
              <button 
                className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
                onClick={() => handleVote(proposal.id)}
                disabled={isLoading}
              >
                Voter pour cette proposition
              </button>
            )}
            
            {winner && winner.id === proposal.id && (
              <div className="badge badge-winner" style={{ marginTop: '0.5rem' }}>Proposition gagnante</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalList;
