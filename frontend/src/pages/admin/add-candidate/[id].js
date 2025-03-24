import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../../styles/Admin.module.css';
import ConnectWallet from '../../../components/ConnectWallet';
import { formatElectionStatus } from '../../../utils/web3';

export default function AddCandidate({ contract, account, isAdmin, loading, onConnect }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  
  // Fetch election details and candidates
  useEffect(() => {
    const fetchElectionData = async () => {
      if (!contract || !account || !id) return;
      
      try {
        setLoadingData(true);
        
        // Get election details
        const details = await contract.methods.getElectionDetails(id).call();
        
        setElection({
          id: parseInt(id),
          name: details.name,
          description: details.description,
          status: parseInt(details.status),
          candidatesCount: parseInt(details.candidatesCount)
        });
        
        // Get candidates if any
        if (parseInt(details.candidatesCount) > 0) {
          const candidateData = await contract.methods.getAllCandidates(id).call();
          
          const formattedCandidates = candidateData.ids.map((candidateId, index) => ({
            id: parseInt(candidateId),
            name: candidateData.names[index],
            voteCount: parseInt(candidateData.voteCounts[index])
          }));
          
          setCandidates(formattedCandidates);
        }
        
        setLoadingData(false);
      } catch (error) {
        console.error("Error fetching election data:", error);
        setErrorMessage("Error loading election data. Please try again.");
        setLoadingData(false);
      }
    };
    
    fetchElectionData();
  }, [contract, account, id]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account || !id) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Validate input
      if (!candidateName.trim()) {
        throw new Error('Candidate name is required');
      }
      
      // Call contract to add candidate
      await contract.methods
        .addCandidate(id, candidateName)
        .send({ from: account });
      
      // Reset form and refresh candidates list
      setCandidateName('');
      
      // Fetch updated candidates
      const candidateData = await contract.methods.getAllCandidates(id).call();
      const details = await contract.methods.getElectionDetails(id).call();
      
      const formattedCandidates = candidateData.ids.map((candidateId, index) => ({
        id: parseInt(candidateId),
        name: candidateData.names[index],
        voteCount: parseInt(candidateData.voteCounts[index])
      }));
      
      setCandidates(formattedCandidates);
      setElection(prev => ({
        ...prev,
        candidatesCount: parseInt(details.candidatesCount)
      }));
      
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error adding candidate:", error);
      setErrorMessage(error.message || "Error adding candidate. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  if (loading || !router.isReady) {
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
  
  if (loadingData) {
    return <div className={styles.loading}>Loading election data...</div>;
  }
  
  if (!election) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Election Not Found | E-Voting System</title>
        </Head>
        <div className={styles.error}>
          <h1>Election Not Found</h1>
          <p>The election you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/admin/manage-elections">
            <button className={styles.button}>Back to Manage Elections</button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Check if election is in a state where candidates can be added
  const canAddCandidates = election.status === 0; // Created state
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Add Candidates | E-Voting System</title>
      </Head>
      
      <div className={styles.backLink}>
        <Link href={`/elections/${id}`}>
          &larr; Back to Election
        </Link>
      </div>
      
      <div className={styles.electionHeader}>
        <h1>Add Candidates</h1>
        <div className={styles.electionInfo}>
          <h2>{election.name}</h2>
          <span className={`${styles.badge} ${styles[`status${election.status}`]}`}>
            {formatElectionStatus(election.status)}
          </span>
        </div>
      </div>
      
      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
        </div>
      )}
      
      {!canAddCandidates ? (
        <div className={styles.warning}>
          <p>Candidates can only be added when the election is in 'Created' state.</p>
          <Link href={`/elections/${id}`}>
            <button className={styles.button}>View Election</button>
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="candidateName">Candidate Name*</label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="candidateName"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className={styles.input}
                placeholder="Enter candidate name"
                required
              />
              <button
                type="submit"
                className={styles.button}
                disabled={isSubmitting || !candidateName.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      <div className={styles.candidatesSection}>
        <h2>Current Candidates</h2>
        
        {candidates.length === 0 ? (
          <p>No candidates have been added to this election yet.</p>
        ) : (
          <div className={styles.candidatesList}>
            {candidates.map((candidate) => (
              <div key={candidate.id} className={styles.candidateCard}>
                <div className={styles.candidateInfo}>
                  <span className={styles.candidateId}>{candidate.id}</span>
                  <h3>{candidate.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.actionButtons}>
        <Link href={`/elections/${id}`}>
          <button className={styles.button}>View Election</button>
        </Link>
        {canAddCandidates && candidates.length > 0 && (
          <Link href={`/admin/manage-elections`}>
            <button className={styles.buttonSecondary}>Done Adding Candidates</button>
          </Link>
        )}
      </div>
    </div>
  );
}