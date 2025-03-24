import { useState } from 'react';
import styles from '../styles/VoterLogin.module.css';
import Web3 from 'web3';

export default function VoterLogin({ onConnect }) {
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!privateKey) {
      setError('Please enter your private key');
      return;
    }
    
    try {
      setIsConnecting(true);
      setError('');
      
      // Create a web3 instance
      const web3 = new Web3(window.ethereum || 'http://localhost:8545');
      
      // Import account from private key
      let account;
      try {
        account = web3.eth.accounts.privateKeyToAccount(privateKey);
        console.log("Account imported:", account.address);
      } catch (err) {
        throw new Error('Invalid private key format. Please check and try again.');
      }
      
      // Create a local web3 instance with the imported account
      const localWeb3 = new Web3(window.ethereum || 'http://localhost:8545');
      
      localWeb3.eth.accounts.wallet.add(account);
      localWeb3.eth.defaultAccount = account.address;
      
      // Call the onConnect callback with the account address and web3 instance
      await onConnect(account.address, localWeb3);
      
      // Clear the private key from memory
      setPrivateKey('');
      setIsConnecting(false);
    } catch (err) {
      console.error("Voter login error:", err);
      setError(err.message || 'Failed to connect voter account. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles.voterLogin}>
      <div className={styles.card}>
        <h1>Voter Account Login</h1>
        <p>Enter your private key to access the voting system</p>
        
        <form onSubmit={handleConnect} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="privateKey">Private Key</label>
            <input
              type="password"
              id="privateKey"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your voter account private key"
              className={styles.input}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={isConnecting || !privateKey}
          >
            {isConnecting ? 'Connecting...' : 'Login to Vote'}
          </button>
        </form>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <div className={styles.instructions}>
          <h3>Instructions:</h3>
          <ol>
            <li>You should have received a private key from the election administrator</li>
            <li>Enter your private key in the field above</li>
            <li>Click "Login to Vote" to access the voting system</li>
            <li>Keep your private key secure and do not share it with anyone</li>
          </ol>
          
          <div className={styles.warning}>
            <strong>Security Warning:</strong> Never share your private key with anyone else.
            This login should only be used on a secure, trusted device.
          </div>
        </div>
      </div>
    </div>
  );
}