import React, { useEffect } from 'react';
import Header from './components/Header';
import WorkflowStatus from './components/WorkflowStatus';
import VoterRegistration from './components/VoterRegistration';
import TimeConstraints from './components/TimeConstraints';
import ProposalForm from './components/ProposalForm';
import ProposalList from './components/ProposalList';
import VoteDelegation from './components/VoteDelegation';
import DevModeToggle from './components/DevModeToggle';
import useVotingStore from './store/useVotingStore';

const App: React.FC = () => {
  const { account, connectWallet, error } = useVotingStore();

  // Auto-connect wallet on page load
  useEffect(() => {
    if (window.ethereum && !account) {
      connectWallet();
    }
  }, [account, connectWallet]);

  return (
    <div className="app">
      <Header />
      <DevModeToggle />
      
      <div className="container">
        {!account ? (
          <div className="welcome-container">
            <div className="welcome-card">
              <div className="welcome-header">
                <div className="welcome-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M11.584 2.376a.75.75 0 01.832 0l9 6a.75.75 0 11-.832 1.248L12 3.901 3.416 9.624a.75.75 0 01-.832-1.248l9-6z" />
                    <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 010 1.5H3a.75.75 0 010-1.5h.75v-9.918a.75.75 0 01.634-.74A49.109 49.109 0 0112 9c2.59 0 5.134.202 7.616.592a.75.75 0 01.634.74zm-7.5 2.418a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zm3-.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0v-6.75a.75.75 0 01.75-.75zM9 12.75a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75z" clipRule="evenodd" />
                    <path d="M12 7.875a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
                  </svg>
                </div>
                <h1 className="welcome-title">Système de Vote Décentralisé</h1>
              </div>
              
              <div className="welcome-content">
                <p className="welcome-description">
                  Bienvenue sur notre plateforme de vote décentralisé basée sur la blockchain Ethereum. 
                  Cette application vous permet de participer à un processus de vote transparent, sécurisé et immuable.
                </p>
                
                <div className="welcome-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Sécurisé</h3>
                      <p>Basé sur la blockchain Ethereum pour une sécurité maximale</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Transparent</h3>
                      <p>Toutes les actions sont enregistrées sur la blockchain</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                        <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <h3>Décentralisé</h3>
                      <p>Aucune autorité centrale ne contrôle le processus</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="welcome-footer">
                <button 
                  className="btn btn-primary btn-connect"
                  onClick={connectWallet}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="wallet-icon">
                    <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
                  </svg>
                  Connecter votre wallet
                </button>
                
                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}
                
                <p className="welcome-note">
                  Vous avez besoin d'un portefeuille Ethereum comme MetaMask pour utiliser cette application.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="content">
            <div className="status-row">
              <div className="status-column">
                <WorkflowStatus />
              </div>
              <div className="status-column">
                <TimeConstraints />
              </div>
            </div>
            
            <VoterRegistration />
            <ProposalForm />
            <VoteDelegation />
            <ProposalList />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
