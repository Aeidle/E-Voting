import { useState, useEffect } from 'react';
import '../styles/globals.css';
import initWeb3, { setupAccountChangeListener } from '../utils/web3';
import Navbar from '../components/Navbar';
import WalletLogin from '../components/WalletLogin';

function MyApp({ Component, pageProps }) {
  const [web3State, setWeb3State] = useState({
    web3: null,
    contract: null,
    account: '',
    isAdmin: false,
    isVoterWallet: false,
    loading: true
  });
  
  // State to track login method
  const [loginMethod, setLoginMethod] = useState('metamask'); // 'metamask' or 'privatekey'
  
  const connectMetaMask = async () => {
    try {
      const { web3, voting, accounts, isAdmin } = await initWeb3();
      if (web3 && voting && accounts && accounts.length > 0) {
        setWeb3State({
          web3,
          contract: voting,
          account: accounts[0],
          isAdmin,
          isVoterWallet: false, // MetaMask connections are not voter wallets by default
          loading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setWeb3State(prev => ({ ...prev, loading: false }));
      return false;
    }
  };
  
  const connectPrivateKey = async (address, web3Instance) => {
    try {
      // Initialize with the web3 instance created from the private key
      const { voting } = await initWeb3(web3Instance);
      
      if (web3Instance && voting && address) {
        // Check if this is an admin account
        const isAdmin = await voting.methods.isAdmin().call({ from: address });
        
        // For demo purposes, any account imported with private key is considered a voter wallet
        // In a real app, you would check against the WalletManager contract
        const isVoterWallet = !isAdmin; // Assume non-admin wallets are voter wallets
        
        setWeb3State({
          web3: web3Instance,
          contract: voting,
          account: address,
          isAdmin,
          isVoterWallet,
          loading: false
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error connecting with private key:", error);
      setWeb3State(prev => ({ ...prev, loading: false }));
      return false;
    }
  };
  
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setWeb3State({
        web3: null,
        contract: null,
        account: '',
        isAdmin: false,
        isVoterWallet: false,
        loading: false
      });
    } else {
      // User changed account, reconnect to get updated isAdmin status
      await connectMetaMask();
    }
  };
  
  const switchLoginMethod = (method) => {
    setLoginMethod(method);
  };
  
  useEffect(() => {
    // Setup account change listener
    setupAccountChangeListener(handleAccountsChanged);
    
    // Auto-connect if MetaMask is already connected
    const autoConnect = async () => {
      if (window.ethereum && window.ethereum.isConnected()) {
        try {
          await connectMetaMask();
        } catch (error) {
          console.error("Auto-connect error:", error);
          setWeb3State(prev => ({ ...prev, loading: false }));
        }
      } else {
        setWeb3State(prev => ({ ...prev, loading: false }));
      }
    };
    
    autoConnect();
  }, []);
  
  // Show appropriate login component based on login method
  if (!web3State.account && !web3State.loading) {
    if (loginMethod === 'privatekey') {
      return (
        <div className="app-container">
          <Navbar 
            account={web3State.account} 
            isAdmin={web3State.isAdmin}
            onConnect={() => {}}
            onSwitchLogin={() => switchLoginMethod('metamask')}
            loginMethod={loginMethod}
          />
          <main className="main-content">
            <WalletLogin onConnect={connectPrivateKey} />
          </main>
        </div>
      );
    } else {
      // Default MetaMask login
      return (
        <div className="app-container">
          <Navbar 
            account={web3State.account} 
            isAdmin={web3State.isAdmin}
            onConnect={connectMetaMask}
            onSwitchLogin={() => switchLoginMethod('privatekey')}
            loginMethod={loginMethod}
          />
          <main className="main-content">
            <Component 
              {...pageProps} 
              web3={web3State.web3} 
              contract={web3State.contract} 
              account={web3State.account}
              isAdmin={web3State.isAdmin}
              isVoterWallet={web3State.isVoterWallet}
              loading={web3State.loading}
              onConnect={connectMetaMask}
            />
          </main>
        </div>
      );
    }
  }
  
  return (
    <div className="app-container">
      <Navbar 
        account={web3State.account} 
        isAdmin={web3State.isAdmin}
        isVoterWallet={web3State.isVoterWallet}
        onConnect={connectMetaMask}
        onSwitchLogin={() => switchLoginMethod(loginMethod === 'metamask' ? 'privatekey' : 'metamask')}
        loginMethod={loginMethod}
      />
      <main className="main-content">
        <Component 
          {...pageProps} 
          web3={web3State.web3} 
          contract={web3State.contract} 
          account={web3State.account}
          isAdmin={web3State.isAdmin}
          isVoterWallet={web3State.isVoterWallet}
          loading={web3State.loading}
          onConnect={connectMetaMask}
        />
      </main>
    </div>
  );
}

export default MyApp;