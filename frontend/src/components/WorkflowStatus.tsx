import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';
import { WorkflowStatus as Status, WORKFLOW_STATUS_LABELS } from '../constants';

const WorkflowStatus: React.FC = () => {
  const { 
    workflowStatus, 
    isOwner,
    isLoading,
    startProposalsRegistration,
    endProposalsRegistration,
    startVotingSession,
    endVotingSession,
    tallyVotes,
    checkAndUpdatePhase
  } = useVotingStore();
  
  const [error, setError] = useState<string | null>(null);

  const handleNextPhase = async () => {
    try {
      setError(null);
      switch (workflowStatus) {
        case Status.RegisteringVoters:
          await startProposalsRegistration();
          break;
        case Status.ProposalsRegistrationStarted:
          await endProposalsRegistration();
          break;
        case Status.ProposalsRegistrationEnded:
          await startVotingSession();
          break;
        case Status.VotingSessionStarted:
          await endVotingSession();
          break;
        case Status.VotingSessionEnded:
          await tallyVotes();
          break;
        default:
          break;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  const handleCheckPhase = async () => {
    try {
      setError(null);
      await checkAndUpdatePhase();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  const getNextPhaseLabel = () => {
    switch (workflowStatus) {
      case Status.RegisteringVoters:
        return "Démarrer l'enregistrement des propositions";
      case Status.ProposalsRegistrationStarted:
        return "Terminer l'enregistrement des propositions";
      case Status.ProposalsRegistrationEnded:
        return "Démarrer la session de vote";
      case Status.VotingSessionStarted:
        return "Terminer la session de vote";
      case Status.VotingSessionEnded:
        return "Comptabiliser les votes";
      default:
        return "";
    }
  };

  return (
    <div className="card">
      <div className="workflow-status">
        <div className="status-label">
          Phase actuelle
        </div>
        <div className="status-value">
          {WORKFLOW_STATUS_LABELS[workflowStatus]}
        </div>
        
        <div className="divider"></div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', margin: '0 auto' }}>
          {isOwner && workflowStatus !== Status.VotesTallied && (
            <button
              className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
              onClick={handleNextPhase}
              disabled={isLoading}
            >
              {getNextPhaseLabel()}
            </button>
          )}
          
          <button
            className={`btn btn-outline btn-full ${isLoading ? 'btn-loading' : ''}`}
            onClick={handleCheckPhase}
            disabled={isLoading}
          >
            Vérifier changement de phase
          </button>
        </div>
        
        {/* Debug information */}
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'gray' }}>
          <div>État actuel: {Status[workflowStatus]}</div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatus;
