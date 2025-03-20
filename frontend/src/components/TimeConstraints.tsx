import React, { useState } from 'react';
import useVotingStore from '../store/useVotingStore';

const TimeConstraints: React.FC = () => {
  const { 
    isOwner, 
    isLoading, 
    setPhaseDeadline, 
    disableTimeConstraints 
  } = useVotingStore();
  
  const [minutes, setMinutes] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetDeadline = async () => {
    try {
      setError(null);
      setSuccess(null);
      await setPhaseDeadline(minutes);
      setSuccess(`Limite de temps définie à ${minutes} minutes`);
    } catch (err) {
      console.error("Error setting deadline:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  const handleDisableConstraints = async () => {
    try {
      setError(null);
      setSuccess(null);
      await disableTimeConstraints();
      setSuccess("Contraintes de temps désactivées");
    } catch (err) {
      console.error("Error disabling constraints:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }
  };

  // Only show this component to the owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="card-title">Contraintes de temps</h2>
      
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
      
      <div className="form-group">
        <label className="form-label">Durée de la phase (minutes)</label>
        <input 
          type="number"
          className="form-input"
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value) || 1)}
          min={1}
          max={60}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
          onClick={handleSetDeadline}
          disabled={isLoading}
        >
          Définir la limite
        </button>
        
        <button 
          className={`btn btn-outline ${isLoading ? 'btn-loading' : ''}`}
          onClick={handleDisableConstraints}
          disabled={isLoading}
        >
          Désactiver les contraintes
        </button>
      </div>
      
      <p className="card-subtitle">
        Définissez une limite de temps pour la phase actuelle. Une fois la limite atteinte, 
        le contrat passera automatiquement à la phase suivante.
      </p>
    </div>
  );
};

export default TimeConstraints;
