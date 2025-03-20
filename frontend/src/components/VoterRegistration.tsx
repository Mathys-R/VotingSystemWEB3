import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';
import { WorkflowStatus } from '../constants';

const VoterRegistration: React.FC = () => {
  const { 
    isOwner, 
    workflowStatus, 
    isLoading, 
    registerVoter, 
    error: storeError 
  } = useVotingStore();
  
  const [voterAddress, setVoterAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!voterAddress) {
      setError("Veuillez entrer une adresse Ethereum valide");
      return;
    }
    
    try {
      await registerVoter(voterAddress);
      setVoterAddress('');
      setSuccess("Électeur enregistré avec succès");
    } catch (err) {
      console.error("Error registering voter:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  // Only show this component to the owner during the RegisteringVoters phase
  if (!isOwner || workflowStatus !== WorkflowStatus.RegisteringVoters) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="card-title">Enregistrer un électeur</h2>
      
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
      
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label className="form-label">Adresse Ethereum</label>
          <input 
            className="form-input"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading}
        >
          Enregistrer l'électeur
        </button>
      </form>
      
      <p className="card-subtitle">
        Seuls les électeurs enregistrés pourront soumettre des propositions et voter.
      </p>
    </div>
  );
};

export default VoterRegistration;
