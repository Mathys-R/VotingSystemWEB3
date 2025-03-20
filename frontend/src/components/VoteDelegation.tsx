import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';
import { WorkflowStatus } from '../constants';

const VoteDelegation: React.FC = () => {
  const { 
    isRegistered, 
    workflowStatus, 
    isLoading, 
    delegateVote, 
    error: storeError 
  } = useVotingStore();
  
  const [delegateAddress, setDelegateAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!delegateAddress) {
      setError("Veuillez entrer une adresse Ethereum valide");
      return;
    }
    
    try {
      await delegateVote(delegateAddress);
      setDelegateAddress('');
      setSuccess("Vote délégué avec succès");
    } catch (err) {
      console.error("Error delegating vote:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  // Only show this component to registered voters during the VotingSessionStarted phase
  if (!isRegistered || workflowStatus !== WorkflowStatus.VotingSessionStarted) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="card-title">Déléguer votre vote</h2>
      
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
      
      <form onSubmit={handleDelegate}>
        <div className="form-group">
          <label className="form-label">Adresse du délégué</label>
          <input 
            className="form-input"
            value={delegateAddress}
            onChange={(e) => setDelegateAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading}
        >
          Déléguer mon vote
        </button>
      </form>
      
      <p className="card-subtitle">
        Vous pouvez déléguer votre vote à un autre électeur enregistré. 
        Une fois délégué, vous ne pourrez plus voter directement.
      </p>
    </div>
  );
};

export default VoteDelegation;
