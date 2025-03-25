import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Admin.module.css';
import ConnectWallet from '../../components/ConnectWallet';
import GasEstimation from '../../components/GasEstimation';
import initWeb3, { formatElectionStatus } from '../../utils/web3';

export default function CreateElection({ contract, account, isAdmin, loading, onConnect }) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [web3, setWeb3] = useState(null);
  
  useEffect(() => {
    const setupWeb3 = async () => {
      const { web3: web3Instance } = await initWeb3();
      setWeb3(web3Instance);
    };
    
    setupWeb3();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // Update gas estimation whenever form values change
  useEffect(() => {
    const updateGasEstimate = async () => {
      if (!contract || !account || !formState.name || !formState.description) {
        setEstimatedGas(null);
        return;
      }
      
      try {
        const { name, description, startTime, endTime } = formState;
        
        // Convert datetime inputs to timestamps (if provided)
        const startTimeStamp = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0;
        const endTimeStamp = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : 0;
        
        const gas = await contract.methods
          .createElection(name, description, startTimeStamp, endTimeStamp)
          .estimateGas({ from: account });
          
        setEstimatedGas(gas);
      } catch (error) {
        console.error("Error estimating gas:", error);
        setEstimatedGas(null);
      }
    };
    
    updateGasEstimate();
  }, [contract, account, formState]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      const { name, description, startTime, endTime } = formState;
      
      // Validate inputs
      if (!name || !description) {
        throw new Error('Name and description are required');
      }
      
      // Convert datetime inputs to timestamps (if provided)
      const startTimeStamp = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0;
      const endTimeStamp = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : 0;
      
      // Validate time inputs
      if (startTimeStamp > 0 && endTimeStamp > 0 && endTimeStamp <= startTimeStamp) {
        throw new Error('End time must be after start time');
      }
      
      // Get gas estimate one more time
      let gasToUse;
      try {
        const estimatedGas = await contract.methods
          .createElection(name, description, startTimeStamp, endTimeStamp)
          .estimateGas({ from: account });
          
        // Add 10% buffer
        gasToUse = Math.floor(estimatedGas * 1.1);
      } catch (error) {
        console.error("Error estimating gas, using default:", error);
        gasToUse = 500000; // Fallback to default if estimation fails
      }
      
      // Call contract to create election with dynamically estimated gas
      await contract.methods
        .createElection(name, description, startTimeStamp, endTimeStamp)
        .send({ 
          from: account,
          gas: gasToUse
        });
      
      // Redirect to manage elections page
      router.push('/admin/manage-elections');
    } catch (error) {
      console.error("Error creating election:", error);
      let errorMsg = "Error creating election. Please try again.";
      
      // Extract error message from blockchain
      if (error.message) {
        if (error.message.includes("JsonRpcEngine")) {
          errorMsg = "Transaction failed. This could be due to network issues or insufficient gas. Please try again.";
        } else if (error.message.includes("revert")) {
          // Try to extract the reason from the error message
          const match = error.message.match(/reason string: '(.+?)'/);
          if (match && match[1]) {
            errorMsg = match[1];
          }
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
    }
  };
  
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
        <title>Create Election | E-Voting System</title>
      </Head>
      
      <div className={styles.backLink}>
        <Link href="/admin/manage-elections">
          &larr; Back to Manage Elections
        </Link>
      </div>
      
      <h1 className={styles.title}>Create New Election</h1>
      
      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Election Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.name}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description*</label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleChange}
            className={styles.textarea}
            rows="4"
            required
          ></textarea>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="startTime">Start Time (optional)</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formState.startTime}
            onChange={handleChange}
            className={styles.input}
          />
          <small>Leave blank for manual start</small>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="endTime">End Time (optional)</label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={formState.endTime}
            onChange={handleChange}
            className={styles.input}
          />
          <small>Leave blank for manual end</small>
        </div>
        
        {estimatedGas && web3 && (
          <GasEstimation estimatedGas={estimatedGas} web3={web3} />
        )}
        
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Election'}
          </button>
          <Link href="/admin/manage-elections">
            <button type="button" className={styles.buttonSecondary}>
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}