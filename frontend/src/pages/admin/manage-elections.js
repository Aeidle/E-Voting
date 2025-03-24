// Get appropriate CSS class based on election status and time
const getStatusClassName = (election) => {
  // Election is in "Created" state
  if (election.status === 0) {
    return styles.statusCreated;
  }
  
  // Election is in "Active" state
  if (election.status === 1) {
    // Check if start time is in the future
    if (election.startTime && parseInt(election.startTime) > currentTime) {
      return styles.statusStartsSoon;
    }
    
    // Check if end time has passed
    if (election.endTime && parseInt(election.endTime) < currentTime) {
      return styles.statusEnded;
    }
    
    return styles.statusActive;
  }
  
  // Election is in "Closed" state
  if (election.status === 2) {
    return styles.statusClosed;
  }
  
  return '';
};import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Admin.module.css';
import ConnectWallet from '../../components/ConnectWallet';
import { formatElectionStatus, formatDate } from '../../utils/web3';

export default function ManageElections({ contract, account, isAdmin, loading, onConnect }) {
const [elections, setElections] = useState([]);
const [loadingElections, setLoadingElections] = useState(true);

// Fetch all elections
useEffect(() => {
  const fetchElections = async () => {
    if (!contract || !account) return;
    
    try {
      setLoadingElections(true);
      
      // Get total count of elections
      const count = await contract.methods.getElectionsCount().call();
      
      // Fetch each election's details
      const electionData = [];
      for (let i = 1; i <= count; i++) {
        const details = await contract.methods.getElectionDetails(i).call();
        
        electionData.push({
          id: i,
          name: details.name,
          description: details.description,
          startTime: details.startTime,
          endTime: details.endTime,
          status: parseInt(details.status),
          candidatesCount: parseInt(details.candidatesCount),
          totalVotes: parseInt(details.totalVotes)
        });
      }
      
      setElections(electionData);
      setLoadingElections(false);
    } catch (error) {
      console.error("Error fetching elections:", error);
      setLoadingElections(false);
    }
  };
  
  fetchElections();
}, [contract, account]);

// Handle election actions (start/end)
const handleStartElection = async (id) => {
  try {
    await contract.methods.startElection(id).send({ from: account });
    
    // Update local state
    setElections(prev => 
      prev.map(election => 
        election.id === id 
          ? { ...election, status: 1 } 
          : election
      )
    );
  } catch (error) {
    console.error(`Error starting election ${id}:`, error);
    alert(error.message || "Error starting election. Please try again.");
  }
};

const handleEndElection = async (id) => {
  try {
    await contract.methods.endElection(id).send({ from: account });
    
    // Update local state
    setElections(prev => 
      prev.map(election => 
        election.id === id 
          ? { ...election, status: 2 } 
          : election
      )
    );
  } catch (error) {
    console.error(`Error ending election ${id}:`, error);
    alert(error.message || "Error ending election. Please try again.");
  }
};

// Filter elections by status
const createdElections = elections.filter(e => e.status === 0);
const activeElections = elections.filter(e => e.status === 1);
const closedElections = elections.filter(e => e.status === 2);

// Get current time
const currentTime = Math.floor(Date.now() / 1000);

if (loading) {
  return <div className={styles.loading}>Loading...</div>;
}

if (!account) {
  return <ConnectWallet onConnect={onConnect} />;
}

if (!isAdmin) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Access Denied | E-Voting System</title>
      </Head>
      <div className={styles.error}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <Link href="/">
          <button className={styles.button}>Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

return (
  <div className={styles.container}>
    <Head>
      <title>Manage Elections | E-Voting System</title>
    </Head>
    
    <div className={styles.backLink}>
      <Link href="/">
        &larr; Back to Home
      </Link>
    </div>
    
    <div className={styles.adminHeader}>
      <h1>Manage Elections</h1>
      <div className={styles.adminActions}>
        <Link href="/admin/create-election">
          <button className={styles.button}>Create New Election</button>
        </Link>
        <Link href="/admin/credential-manager">
          <button className={styles.button}>Manage Credentials</button>
        </Link>
      </div>
    </div>
    
    {loadingElections ? (
      <div className={styles.loading}>Loading elections...</div>
    ) : elections.length === 0 ? (
      <div className={styles.emptyState}>
        <p>No elections have been created yet.</p>
        <Link href="/admin/create-election">
          <button className={styles.button}>Create Your First Election</button>
        </Link>
      </div>
    ) : (
      <div className={styles.electionsGrid}>
        <div className={styles.electionSection}>
          <h2>Created Elections</h2>
          {createdElections.length === 0 ? (
            <p>No elections in created state.</p>
          ) : (
            <div className={styles.electionTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Candidates</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {createdElections.map(election => (
                    <tr key={election.id}>
                      <td>{election.id}</td>
                      <td>
                        <Link href={`/elections/${election.id}`}>
                          {election.name}
                        </Link>
                      </td>
                      <td>{election.candidatesCount}</td>
                      <td>{formatDate(election.startTime)}</td>
                      <td className={styles.actions}>
                        <Link href={`/admin/add-candidate/${election.id}`}>
                          <button className={styles.buttonSmall}>Add Candidates</button>
                        </Link>
                        <button 
                          className={styles.buttonSmall}
                          onClick={() => handleStartElection(election.id)}
                          disabled={election.candidatesCount === 0}
                        >
                          Start
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className={styles.electionSection}>
          <h2>Active Elections</h2>
          {activeElections.length === 0 ? (
            <p>No active elections.</p>
          ) : (
            <div className={styles.electionTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Candidates</th>
                    <th>Votes</th>
                    <th>End Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeElections.map(election => (
                    <tr key={election.id}>
                      <td>{election.id}</td>
                      <td>
                        <Link href={`/elections/${election.id}`}>
                          {election.name}
                        </Link>
                      </td>
                      <td>{election.candidatesCount}</td>
                      <td>{election.totalVotes}</td>
                      <td>{formatDate(election.endTime)}</td>
                      <td className={styles.actions}>
                        <button 
                          className={`${styles.buttonSmall} ${styles.dangerButton}`}
                          onClick={() => handleEndElection(election.id)}
                        >
                          End
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className={styles.electionSection}>
          <h2>Closed Elections</h2>
          {closedElections.length === 0 ? (
            <p>No closed elections.</p>
          ) : (
            <div className={styles.electionTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Candidates</th>
                    <th>Total Votes</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {closedElections.map(election => (
                    <tr key={election.id}>
                      <td>{election.id}</td>
                      <td>{election.name}</td>
                      <td>{election.candidatesCount}</td>
                      <td>{election.totalVotes}</td>
                      <td className={styles.actions}>
                        <Link href={`/elections/${election.id}`}>
                          <button className={styles.buttonSmall}>View Results</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
}