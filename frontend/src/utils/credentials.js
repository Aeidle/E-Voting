import Web3 from 'web3';
import CredentialManagerContract from '../../build/contracts/CredentialManager.json';
import Papa from 'papaparse';

// Initialize web3 and contract
const initCredentialManager = async (web3Instance) => {
  try {
    if (!web3Instance) {
      console.error("Web3 instance is required");
      return null;
    }
    
    // Get the network ID
    const networkId = await web3Instance.eth.net.getId();
    
    // Get the deployed contract address
    const deployedNetwork = CredentialManagerContract.networks[networkId];
    
    if (!deployedNetwork) {
      console.error('CredentialManager contract not deployed to detected network.');
      return null;
    }
    
    // Create contract instance
    const credentialManager = new web3Instance.eth.Contract(
      CredentialManagerContract.abi,
      deployedNetwork.address,
    );
    
    return credentialManager;
  } catch (error) {
    console.error("Error initializing credential manager:", error);
    return null;
  }
};

// Format wallet address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format ETH balance
export const formatBalance = (balanceWei, web3Instance) => {
  if (!balanceWei) return '0 ETH';
  const eth = web3Instance.utils.fromWei(balanceWei, 'ether');
  return `${parseFloat(eth).toFixed(4)} ETH`;
};

// Generate a new random wallet
export const generateWallet = () => {
  const web3 = new Web3();
  return web3.eth.accounts.create();
};

// Generate multiple wallets
export const generateMultipleWallets = (count) => {
  const wallets = [];
  const web3 = new Web3();
  
  for (let i = 0; i < count; i++) {
    wallets.push(web3.eth.accounts.create());
  }
  
  return wallets;
};

// Create credential in the contract
export const createCredential = async (credentialManager, account, walletAddress) => {
  try {
    return await credentialManager.methods
      .createCredential(walletAddress)
      .send({ from: account, gas: 500000 });
  } catch (error) {
    console.error("Error creating credential:", error);
    throw error;
  }
};

// Create multiple credentials in batch
export const createCredentialsBatch = async (credentialManager, account, walletAddresses) => {
  try {
    return await credentialManager.methods
      .createCredentialsBatch(walletAddresses)
      .send({ from: account, gas: 1500000 });
  } catch (error) {
    console.error("Error creating credentials in batch:", error);
    throw error;
  }
};

// Update credential status
export const updateCredentialStatus = async (credentialManager, account, walletAddress, isActive) => {
  try {
    return await credentialManager.methods
      .updateCredentialStatus(walletAddress, isActive)
      .send({ from: account, gas: 500000 });
  } catch (error) {
    console.error("Error updating credential status:", error);
    throw error;
  }
};

// Update multiple credentials' statuses in batch
export const updateCredentialsStatusBatch = async (credentialManager, account, walletAddresses, isActive) => {
  try {
    return await credentialManager.methods
      .updateCredentialsStatusBatch(walletAddresses, isActive)
      .send({ from: account, gas: 1500000 });
  } catch (error) {
    console.error("Error updating credentials in batch:", error);
    throw error;
  }
};

// Add funds to a wallet
export const addFunds = async (credentialManager, account, walletAddress, amountEth) => {
  try {
    const web3 = new Web3(window.ethereum);
    const amountWei = web3.utils.toWei(amountEth.toString(), 'ether');
    
    return await credentialManager.methods
      .addFunds(walletAddress)
      .send({ from: account, value: amountWei, gas: 500000 });
  } catch (error) {
    console.error("Error adding funds:", error);
    throw error;
  }
};

// Add funds to multiple wallets in batch
export const addFundsBatch = async (credentialManager, account, walletAddresses, totalAmountEth) => {
  try {
    const web3 = new Web3(window.ethereum);
    const totalAmountWei = web3.utils.toWei(totalAmountEth.toString(), 'ether');
    
    return await credentialManager.methods
      .addFundsBatch(walletAddresses)
      .send({ from: account, value: totalAmountWei, gas: 1500000 });
  } catch (error) {
    console.error("Error adding funds in batch:", error);
    throw error;
  }
};

// Get all credentials (paginated)
export const getCredentials = async (credentialManager, start, count) => {
  try {
    const result = await credentialManager.methods
      .getCredentials(start, count)
      .call();
    
    const { 
      walletAddresses, 
      activeStatuses, 
      createdAts, 
      balances 
    } = result;
    
    // Convert to array of objects for easier handling
    const credentials = walletAddresses.map((address, i) => ({
      walletAddress: address,
      isActive: activeStatuses[i],
      createdAt: parseInt(createdAts[i]),
      balance: balances[i]
    }));
    
    return credentials;
  } catch (error) {
    console.error("Error getting credentials:", error);
    throw error;
  }
};

// Get credential count
export const getCredentialCount = async (credentialManager) => {
  try {
    return await credentialManager.methods
      .getCredentialCount()
      .call();
  } catch (error) {
    console.error("Error getting credential count:", error);
    throw error;
  }
};

// Export credentials to CSV
export const exportCredentialsToCSV = (credentials, includePK = false) => {
  const fields = includePK 
    ? ['walletAddress', 'privateKey', 'isActive', 'balance'] 
    : ['walletAddress', 'isActive', 'balance'];
  
  const data = credentials.map(cred => {
    const item = {
      walletAddress: cred.walletAddress,
      isActive: cred.isActive,
      balance: cred.formattedBalance || cred.balance
    };
    
    if (includePK && cred.privateKey) {
      item.privateKey = cred.privateKey;
    }
    
    return item;
  });
  
  const csv = Papa.unparse({
    fields,
    data: data.map(d => fields.map(f => d[f]))
  });
  
  return csv;
};

// Download CSV file
export const downloadCSV = (csv, filename = 'credentials.csv') => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add to document, click and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default initCredentialManager;