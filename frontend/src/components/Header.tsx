import React from 'react';
import useVotingStore from '../store/useVotingStore';

const Header: React.FC = () => {
  const { 
    account, 
    isOwner, 
    isRegistered, 
    connectWallet 
  } = useVotingStore();

  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M11.584 2.376a.75.75 0 01.832 0l9 6a.75.75 0 11-.832 1.248L12 3.901 3.416 9.624a.75.75 0 01-.832-1.248l9-6z" />
            <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 010 1.5H3a.75.75 0 010-1.5h.75v-9.918a.75.75 0 01.634-.74A49.109 49.109 0 0112 9c2.59 0 5.134.202 7.616.592a.75.75 0 01.634.74zm-7.5 2.418a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zm3-.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0v-6.75a.75.75 0 01.75-.75zM9 12.75a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75z" clipRule="evenodd" />
          </svg>
          Système de Vote
        </div>
        
        {account ? (
          <div className="account-info">
            <div className="account-details">
              <div className="account-label">Connecté en tant que</div>
              <div className="account-address">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
            </div>
            <div className="account-badges">
              {isOwner && (
                <span className="badge badge-admin">
                  Admin
                </span>
              )}
              {isRegistered && (
                <span className="badge badge-voter">
                  Électeur
                </span>
              )}
            </div>
          </div>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={connectWallet}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="wallet-icon" style={{ marginRight: '8px' }}>
              <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
            </svg>
            Connecter Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
