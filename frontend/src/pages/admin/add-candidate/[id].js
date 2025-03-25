import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../../styles/Admin.module.css';
import ConnectWallet from '../../../components/ConnectWallet';
import GasEstimation from '../../../components/GasEstimation';
import initWeb3, { formatElectionStatus } from '../../../utils/web3';

export default function AddCandidate({ contract, account, isAdmin, loading, onConnect }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateEntries, setCandidateEntries] = useState([{ name: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [web3, setWeb3] = useState(null);
  
  // Initialize web3
  useEffect(() => {
    const setupWeb3 = async () => {
      const { web3: web3Instance } = await initWeb3();
      setWeb3(web3Instance);
    };
    
    setupWeb3();
  }, []);
  
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
  
  // Update gas estimation when candidates change
  useEffect(() => {
    const updateGasEstimate = async () => {
      if (!contract || !account || !id || !election || election.status !== 0) {
        setEstimatedGas(null);
        return;
      }

      // Check if at least one candidate entry has a valid name
      const hasValidEntry = candidateEntries.some(entry => entry.name.trim() !== '');
      if (!hasValidEntry) {
        setEstimatedGas(null);
        return;
      }
      
      try {
        // Estimate gas for one candidate (as a general estimate)
        // We'll use the first valid candidate name for estimation
        const validName = candidateEntries.find(entry => entry.name.trim() !== '').name;
        const gas = await contract.methods
          .addCandidate(id, validName)
          .estimateGas({ from: account });
          
        // Multiply by number of valid candidates for a rough estimate
        const validCandidatesCount = candidateEntries.filter(entry => entry.name.trim() !== '').length;
        setEstimatedGas(gas * validCandidatesCount);
      } catch (error) {
        console.error("Error estimating gas:", error);
        setEstimatedGas(null);
      }
    };
    
    updateGasEstimate();
  }, [contract, account, id, candidateEntries, election]);
  
  // Add a new candidate entry field
  const addCandidateEntry = () => {
    setCandidateEntries([...candidateEntries, { name: '' }]);
  };

  // Remove a candidate entry field
  const removeCandidateEntry = (index) => {
    if (candidateEntries.length > 1) {
      const updatedEntries = [...candidateEntries];
      updatedEntries.splice(index, 1);
      setCandidateEntries(updatedEntries);
    }
  };

  // Update candidate entry name
  const updateCandidateEntry = (index, name) => {
    const updatedEntries = [...candidateEntries];
    updatedEntries[index].name = name;
    setCandidateEntries(updatedEntries);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account || !id) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Filter out empty candidate entries
      const validCandidates = candidateEntries.filter(entry => entry.name.trim() !== '');
      
      // Validate input
      if (validCandidates.length === 0) {
        throw new Error('At least one candidate name is required');
      }
      
      // Add each candidate one by one
      for (const candidate of validCandidates) {
        // Get gas estimate with 10% buffer for each candidate
        let gasToUse;
        try {
          const estimatedGas = await contract.methods
            .addCandidate(id, candidate.name)
            .estimateGas({ from: account });
            
          // Add 10% buffer
          gasToUse = Math.floor(estimatedGas * 1.1);
        } catch (error) {
          console.error("Error estimating gas, using default:", error);
          gasToUse = 200000; // Fallback to default if estimation fails
        }
        
        // Call contract to add candidate with dynamic gas estimation
        await contract.methods
          .addCandidate(id, candidate.name)
          .send({ 
            from: account,
            gas: gasToUse
          });
      }
      
      // Reset form
      setCandidateEntries([{ name: '' }]);
      
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
      console.error("Error adding candidates:", error);
      setErrorMessage(error.message || "Error adding candidates. Please try again.");
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
          <h3>Add Multiple Candidates</h3>
          
          {candidateEntries.map((entry, index) => (
            <div key={index} className={styles.formGroup}>
              <label htmlFor={`candidate-${index}`}>
                Candidate #{index + 1} Name{index === 0 ? '*' : ''}
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  id={`candidate-${index}`}
                  value={entry.name}
                  onChange={(e) => updateCandidateEntry(index, e.target.value)}
                  className={styles.input}
                  placeholder="Enter candidate name"
                  required={index === 0}
                />
                {candidateEntries.length > 1 && (
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => removeCandidateEntry(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={addCandidateEntry}
            >
              Add Another Candidate
            </button>
            
            <button
              type="submit"
              className={styles.button}
              disabled={isSubmitting || !candidateEntries.some(entry => entry.name.trim() !== '')}
            >
              {isSubmitting ? 'Adding...' : 'Add Candidates'}
            </button>
          </div>
          
          {estimatedGas && web3 && candidateEntries.some(entry => entry.name.trim() !== '') && (
            <div className={styles.gasEstimation}>
              <p>Note: Multiple candidates will be added in separate transactions.</p>
              <GasEstimation estimatedGas={estimatedGas} web3={web3} />
            </div>
          )}
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