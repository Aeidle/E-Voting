import { useState } from 'react';
import styles from '../styles/ConnectWallet.module.css';

export default function ConnectWallet({ onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showVoterInfo, setShowVoterInfo] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      // First check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application or use a voter private key.');
      }
      
      console.log("ConnectWallet: Starting connection process");
      await onConnect();
      console.log("ConnectWallet: Connection completed");
    } catch (err) {
      console.error("ConnectWallet Error:", err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles.connectWallet}>
      <div className={styles.card}>
        <h1>Welcome to E-Voting System</h1>
        <p>A secure and transparent blockchain-based voting platform</p>
        
        <button 
          onClick={handleConnect} 
          className={styles.button}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
        </button>
        
        <button
          onClick={() => setShowVoterInfo(!showVoterInfo)}
          className={styles.voterInfoButton}
        >
          {showVoterInfo ? 'Hide Voter Information' : 'Show Voter Information'}
        </button>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <div className={styles.instructions}>
          <h3>How to connect:</h3>
          <ol>
            <li>Install <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">MetaMask</a> browser extension</li>
            <li>Configure MetaMask to connect to local blockchain:
              <ul>
                <li>Network Name: Local Blockchain</li>
                <li>RPC URL: http://localhost:8545</li>
                <li>Chain ID: 1337</li>
                <li>Currency Symbol: ETH</li>
              </ul>
            </li>
            <li>Import one of the test accounts using a private key</li>
          </ol>
        </div>
        
        {showVoterInfo && (
          <div className={styles.voterInfo}>
            <h3>For Voters</h3>
            <p>If you are a voter, please use the "Use Private Key" option at the top right to log in with your assigned voter wallet.</p>
            <p>The election administrator should have provided you with a private key for your voting wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
}