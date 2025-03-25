// Get appropriate CSS class based on election status and time
const getStatusClassName = (election) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Election is in "Created" state
  if (election.status === 0) {
    return styles.statusCreated;
  }
  
  // Election is in "Active" state
  if (election.status === 1) {
    // Check if start time is in the future
    if (election.startTime && parseInt(election.startTime) > now) {
      return styles.statusStartsSoon;
    }
    
    // Check if end time has passed
    if (election.endTime && parseInt(election.endTime) < now) {
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
import styles from '../styles/Home.module.css';
import ConnectWallet from '../components/ConnectWallet';
import { formatElectionStatus, formatDate } from '../utils/web3';

export default function Home({ contract, account, isAdmin, loading, onConnect }) {
const [activeElections, setActiveElections] = useState([]);
const [allElections, setAllElections] = useState([]);
const [loadingElections, setLoadingElections] = useState(false);

// Fetch elections when contract and account are available
useEffect(() => {
  const fetchElections = async () => {
    if (!contract || !account) return;

    try {
      setLoadingElections(true);
      
      // Get all elections
      const count = await contract.methods.getElectionsCount().call();
      const elections = [];
      
      for (let i = 1; i <= count; i++) {
        const details = await contract.methods.getElectionDetails(i).call();
        elections.push({
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
      
      setAllElections(elections);
      
      // Get active elections
      const activeIds = await contract.methods.getActiveElections().call();
      const active = elections.filter(e => activeIds.includes(e.id.toString()));
      setActiveElections(active);
      
      setLoadingElections(false);
    } catch (error) {
      console.error("Error fetching elections:", error);
      setLoadingElections(false);
    }
  };

  fetchElections();
}, [contract, account]);

if (loading) {
  return <div className={styles.loading}>Loading...</div>;
}

if (!account) {
  return <ConnectWallet onConnect={onConnect} />;
}

return (
  <div className={styles.container}>
    <Head>
      <title>Blockchain E-Voting System</title>
      <meta name="description" content="A decentralized e-voting system" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className={styles.main}>
      <h1 className={styles.title}>
        Blockchain E-Voting System
      </h1>
      
      <p className={styles.description}>
        A secure and transparent voting platform using blockchain technology
      </p>
      
      {isAdmin && (
        <div className={styles.adminActions}>
          <Link href="/admin/create-election">
            <button className={styles.button}>Create New Election</button>
          </Link>
          <Link href="/admin/manage-elections">
            <button className={styles.button}>Manage Elections</button>
          </Link>
        </div>
      )}
      
      <div className={styles.grid}>
        <div className={styles.section}>
          <h2>Active Elections</h2>
          {loadingElections ? (
            <p>Loading elections...</p>
          ) : activeElections.length > 0 ? (
            <div className={styles.electionList}>
              {activeElections.map((election) => (
                <Link href={`/elections/${election.id}`} key={election.id}>
                  <div className={styles.electionCard}>
                    <h3>{election.name}</h3>
                    <p>{election.description}</p>
                    <div className={styles.electionDetails}>
                      <span className={`${styles.badge} ${getStatusClassName(election)}`}>
                        {formatElectionStatus(election.status, election.startTime, election.endTime)}
                      </span>
                      <span>Candidates: {election.candidatesCount}</span>
                      <span>Votes: {election.totalVotes}</span>
                    </div>
                    <p className={styles.dates}>
                      Ends: {formatDate(election.endTime)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>No active elections at the moment.</p>
          )}
        </div>
        
        <div className={styles.section}>
          <h2>All Elections</h2>
          {loadingElections ? (
            <p>Loading elections...</p>
          ) : allElections.length > 0 ? (
            <div className={styles.electionList}>
              {allElections.map((election) => (
                <Link href={`/elections/${election.id}`} key={election.id}>
                  <div className={styles.electionCard}>
                    <h3>{election.name}</h3>
                    <p>{election.description}</p>
                    <div className={styles.electionDetails}>
                      <span className={`${styles.badge} ${getStatusClassName(election)}`}>
                        {formatElectionStatus(election.status, election.startTime, election.endTime)}
                      </span>
                      <span>Candidates: {election.candidatesCount}</span>
                      <span>Votes: {election.totalVotes}</span>
                    </div>
                    <div className={styles.electionDates}>
                      <span>Start: {formatDate(election.startTime) || 'Manual start'}</span>
                      <span>End: {formatDate(election.endTime) || 'Manual end'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>No elections have been created yet.</p>
          )}
        </div>
      </div>
    </main>
  </div>
);
}