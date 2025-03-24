import Web3 from 'web3';
import VotingContract from '../../build/contracts/Voting.json';

// Initialize the connection to blockchain and contract
const initWeb3 = async () => {
  let web3;
  let voting;
  let accounts;
  let isAdmin = false;

  try {
    // Modern dapp browsers
    if (window.ethereum) {
      console.log("Modern ethereum provider detected");
      web3 = new Web3(window.ethereum);
      try {
        // Request account access
        console.log("Requesting account access...");
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        accounts = await web3.eth.getAccounts();
        console.log("Accounts:", accounts);
      } catch (error) {
        console.error("User denied account access:", error);
        alert("Please allow MetaMask to connect to this site.");
        return { web3: null, voting: null, accounts: null, isAdmin: false };
      }
    } 
    // Legacy dapp browsers
    else if (window.web3) {
      console.log("Legacy web3 provider detected");
      web3 = new Web3(window.web3.currentProvider);
      accounts = await web3.eth.getAccounts();
      console.log("Accounts:", accounts);
    } 
    // Fallback to local provider (for development)
    else {
      console.log("No Ethereum browser extension detected, falling back to local provider");
      const provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();
      console.log("Accounts from local provider:", accounts);
    }

    // Get the network ID
    const networkId = await web3.eth.net.getId();
    console.log("Network ID:", networkId);
    
    // Get the deployed contract if it exists on this network
    const deployedNetwork = VotingContract.networks[networkId];
    
    if (!deployedNetwork) {
      console.error('Smart contract not deployed to detected network.');
      alert("The voting contract is not deployed on this network. Please connect to the correct network.");
      return { web3, voting: null, accounts, isAdmin: false };
    }

    // Create contract instance
    voting = new web3.eth.Contract(
      VotingContract.abi,
      deployedNetwork.address,
    );
    console.log("Contract instance created at:", deployedNetwork.address);

    // Check if user is admin
    if (accounts && accounts.length > 0) {
      isAdmin = await voting.methods.isAdmin().call({ from: accounts[0] });
      console.log("Is admin:", isAdmin);
    }

    return { web3, voting, accounts, isAdmin };
  } catch (error) {
    console.error("Error initializing web3:", error);
    alert("Error connecting to blockchain. Please check console for details.");
    return { web3: null, voting: null, accounts: null, isAdmin: false };
  }
};

// Format timestamp to readable date
export const formatDate = (timestamp) => {
  if (!timestamp || timestamp === '0') return 'Not set';
  return new Date(timestamp * 1000).toLocaleString();
};

// Format time remaining for countdown
export const formatTimeRemaining = (targetTimestamp) => {
  if (!targetTimestamp) return 'Not set';
  
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = parseInt(targetTimestamp) - now;
  
  if (timeLeft <= 0) return 'Time has elapsed';
  
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  result += `${seconds}s`;
  
  return result;
};

// Format election status to readable string with time considerations
export const formatElectionStatus = (status, startTime, endTime) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Election is in "Created" state
  if (status === 0) {
    return 'Created';
  }
  
  // Election is in "Active" state
  if (status === 1) {
    // Check if start time is in the future
    if (startTime && parseInt(startTime) > now) {
      return 'Starts Soon';
    }
    
    // Check if end time has passed
    if (endTime && parseInt(endTime) < now) {
      return 'Ended';
    }
    
    return 'Active';
  }
  
  // Election is in "Closed" state
  if (status === 2) {
    return 'Closed';
  }
  
  return 'Unknown';
};

// Determine if an election is in waiting period (after start time is set but before that time arrives)
export const isElectionInWaitingPeriod = (startTime) => {
  if (!startTime || startTime === '0') return false;
  
  const now = Math.floor(Date.now() / 1000);
  return parseInt(startTime) > now;
};

// Format candidate vote data for time-series chart
export const formatVoteTimeData = (candidateIds, timestamps, candidates) => {
  if (!candidateIds || !timestamps || !candidates || candidateIds.length === 0) {
    return [];
  }
  
  // Create map of candidates by ID for easy lookup
  const candidateMap = candidates.reduce((map, candidate) => {
    map[candidate.id] = candidate;
    return map;
  }, {});
  
  // Create timeline points
  const timelinePoints = [];
  const voteCounts = {};
  
  // Initialize vote counts for each candidate
  candidates.forEach(candidate => {
    voteCounts[candidate.id] = 0;
  });
  
  // Sort data points by timestamp
  const sortedIndices = Array.from({ length: timestamps.length }, (_, i) => i)
    .sort((a, b) => timestamps[a] - timestamps[b]);
  
  // Create cumulative data points
  sortedIndices.forEach(index => {
    const candidateId = parseInt(candidateIds[index]);
    const timestamp = parseInt(timestamps[index]);
    
    // Increment vote count for this candidate
    voteCounts[candidateId]++;
    
    // Add data point with all current vote counts
    const dataPoint = {
      timestamp,
      date: new Date(timestamp * 1000).toLocaleString(),
    };
    
    // Add vote count for each candidate
    candidates.forEach(candidate => {
      dataPoint[`candidate${candidate.id}`] = voteCounts[candidate.id];
      dataPoint[`candidate${candidate.id}Name`] = candidate.name;
    });
    
    timelinePoints.push(dataPoint);
  });
  
  return timelinePoints;
};

// Utility to listen for account changes
export const setupAccountChangeListener = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts);
      callback(accounts);
    });
  }
};

export default initWeb3;