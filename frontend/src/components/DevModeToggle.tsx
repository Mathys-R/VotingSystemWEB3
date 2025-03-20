import React from 'react';
import useVotingStore from '../store/useVotingStore';

const DevModeToggle: React.FC = () => {
  const { isDevelopmentMode } = useVotingStore();
  
  const toggleDevMode = () => {
    const newMode = !isDevelopmentMode;
    console.log('Ancien mode:', isDevelopmentMode);
    console.log('Nouveau mode:', newMode);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('isDevelopmentMode', String(newMode));
    console.log('Valeur sauvegardée dans localStorage:', localStorage.getItem('isDevelopmentMode'));
    
    // Nous devons accéder directement au store pour modifier la valeur
    // car nous n'avons pas de setter dans l'interface
    useVotingStore.setState({ isDevelopmentMode: newMode });
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  };
  
  return (
    <div className="dev-mode-toggle">
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          checked={isDevelopmentMode} 
          onChange={toggleDevMode}
        />
        <span className="toggle-slider"></span>
      </label>
      <span className="toggle-label">
        {isDevelopmentMode ? 'Mode développement' : 'Mode production'}
      </span>
    </div>
  );
};

export default DevModeToggle;
