import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';
import { WorkflowStatus } from '../constants';

const ProposalForm: React.FC = () => {
  const { 
    isRegistered, 
    workflowStatus, 
    isLoading, 
    registerProposal, 
    error: storeError 
  } = useVotingStore();
  
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!description.trim()) {
      setError("Veuillez entrer une description pour votre proposition");
      return;
    }
    
    try {
      await registerProposal(description.trim());
      setDescription('');
      setSuccess("Proposition enregistrée avec succès");
    } catch (err) {
      console.error("Error registering proposal:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  // Only show this component to registered voters during the ProposalsRegistrationStarted phase
  if (!isRegistered || workflowStatus !== WorkflowStatus.ProposalsRegistrationStarted) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="card-title">Soumettre une proposition</h2>
      
      {storeError && (
        <div className="alert alert-error">
          {storeError}
        </div>
      )}
      
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
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Description de la proposition</label>
          <textarea 
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre proposition..."
            rows={4}
          />
        </div>
        
        <button 
          type="submit" 
          className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading || !description.trim()}
        >
          Soumettre la proposition
        </button>
      </form>
      
      <p className="card-subtitle">
        Votre proposition sera visible par tous les électeurs et pourra être votée lors de la phase de vote.
      </p>
    </div>
  );
};

export default ProposalForm;
