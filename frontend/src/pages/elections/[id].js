import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Election.module.css';
import ConnectWallet from '../../components/ConnectWallet';
import { 
  formatDate, 
  formatElectionStatus, 
  isElectionInWaitingPeriod,
  formatVoteTimeData
} from '../../utils/web3';
import VoteTimelineChart from '../../components/VoteTimelineChart';
import CountdownTimer from '../../components/CountdownTimer';

export default function ElectionDetail({ contract, account, isAdmin, loading, onConnect }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [blockchainTime, setBlockchainTime] = useState(null);
  const [voteTimelineData, setVoteTimelineData] = useState([]);
  const [showVoteTimeline, setShowVoteTimeline] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Countdown timer interval
  const timerRef = useRef(null);
  
  // Function to handle timer expiration
  const handleTimerExpire = () => {
    // Force re-evaluation of election state
    setRefreshTrigger(prev => prev + 1);
  };
  
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
  };
  
  // Fetch election details and candidates
  useEffect(() => {
    const fetchElectionData = async () => {
      if (!contract || !account || !id) return;
      
      try {
        setLoadingData(true);
        setErrorMessage('');
        
        // Get current blockchain time
        const currentTime = await contract.methods.getCurrentTime().call();
        setBlockchainTime(currentTime);
        
        // Get election details
        const details = await contract.methods.getElectionDetails(id).call();
        
        setElection({
          id: parseInt(id),
          name: details.name,
          description: details.description,
          startTime: details.startTime,
          endTime: details.endTime,
          status: parseInt(details.status),
          candidatesCount: parseInt(details.candidatesCount),
          totalVotes: parseInt(details.totalVotes)
        });
        
        // Get candidates
        const candidateData = await contract.methods.getAllCandidates(id).call();
        
        const formattedCandidates = candidateData.ids.map((candidateId, index) => ({
          id: parseInt(candidateId),
          name: candidateData.names[index],
          voteCount: parseInt(candidateData.voteCounts[index])
        }));
        
        setCandidates(formattedCandidates);
        
        // Check if user has voted
        const votedStatus = await contract.methods.hasVoted(id, account).call();
        setHasVoted(votedStatus);
        
        // Fetch vote timeline data if election has votes
        if (parseInt(details.totalVotes) > 0) {
          const voteData = await contract.methods.getAllVoteTimestamps(id).call();
          const timelineData = formatVoteTimeData(
            voteData.candidateIds, 
            voteData.timestamps, 
            formattedCandidates
          );
          setVoteTimelineData(timelineData);
          setShowVoteTimeline(timelineData.length > 0);
        }
        
        setLoadingData(false);
      } catch (error) {
        console.error("Error fetching election data:", error);
        setErrorMessage("Error loading election data. Please try again.");
        setLoadingData(false);
      }
    };
    
    fetchElectionData();
    
    // Clear timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [contract, account, id, refreshTrigger]);
  
  // Handle voting
  const handleVote = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setErrorMessage("Please select a candidate");
      return;
    }
    
    try {
      setIsVoting(true);
      setErrorMessage('');
      
      await contract.methods.vote(id, selectedCandidate).send({ from: account });
      
      // Update candidate vote counts and user voted status
      const candidateData = await contract.methods.getAllCandidates(id).call();
      const details = await contract.methods.getElectionDetails(id).call();
      const voteData = await contract.methods.getAllVoteTimestamps(id).call();
      
      const formattedCandidates = candidateData.ids.map((candidateId, index) => ({
        id: parseInt(candidateId),
        name: candidateData.names[index],
        voteCount: parseInt(candidateData.voteCounts[index])
      }));
      
      setCandidates(formattedCandidates);
      setHasVoted(true);
      setElection(prev => ({
        ...prev,
        totalVotes: parseInt(details.totalVotes)
      }));
      
      // Update timeline data
      const timelineData = formatVoteTimeData(
        voteData.candidateIds, 
        voteData.timestamps, 
        formattedCandidates
      );
      setVoteTimelineData(timelineData);
      setShowVoteTimeline(timelineData.length > 0);
      
      setIsVoting(false);
    } catch (error) {
      console.error("Error voting:", error);
      let errorMsg = "Error casting vote. Please try again.";
      
      // Extract error message from blockchain
      if (error.message) {
        if (error.message.includes("Election has not started yet")) {
          errorMsg = "This election has not started yet. Please wait for the start time.";
        } else if (error.message.includes("Election voting period has ended")) {
          errorMsg = "This election has ended. Voting is no longer possible.";
        } else if (error.message.includes("revert")) {
          // Try to extract the reason from the error message
          const match = error.message.match(/reason string: '(.+?)'/);
          if (match && match[1]) {
            errorMsg = match[1];
          }
        }
      }
      
      setErrorMessage(errorMsg);
      setIsVoting(false);
    }
  };
  
  // Admin functions
  const handleStartElection = async () => {
    try {
      setErrorMessage('');
      
      // Set a higher gas limit to prevent JSON-RPC errors
      await contract.methods.startElection(id).send({ 
        from: account,
        gas: 500000 // Set a higher gas limit
      });
      
      // Refresh election data
      const details = await contract.methods.getElectionDetails(id).call();
      setElection(prev => ({
        ...prev,
        status: parseInt(details.status),
        startTime: details.startTime
      }));
    } catch (error) {
      console.error("Error starting election:", error);
      let errorMsg = "Error starting election. Please try again.";
      
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
        }
      }
      
      setErrorMessage(errorMsg);
    }
  };
  
  const handleEndElection = async () => {
    try {
      setErrorMessage('');
      
      // Set a higher gas limit to prevent JSON-RPC errors
      await contract.methods.endElection(id).send({ 
        from: account,
        gas: 500000 // Set a higher gas limit
      });
      
      // Refresh election data
      const details = await contract.methods.getElectionDetails(id).call();
      setElection(prev => ({
        ...prev,
        status: parseInt(details.status),
        endTime: details.endTime
      }));
    } catch (error) {
      console.error("Error ending election:", error);
      let errorMsg = "Error ending election. Please try again.";
      
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
        }
      }
      
      setErrorMessage(errorMsg);
    }
  };
  
  // Determine if election is waiting to start
  const isWaitingForStart = election && 
    election.status === 1 && 
    election.startTime && 
    isElectionInWaitingPeriod(election.startTime);
  
  // Determine if election has ended
  const hasEnded = election && 
    ((election.status === 2) || 
     (election.endTime && parseInt(election.endTime) < Math.floor(Date.now() / 1000)));
  
  if (loading || !router.isReady) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  if (!account) {
    return <ConnectWallet onConnect={onConnect} />;
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
        <title>{election.name} | E-Voting System</title>
      </Head>
      
      <div className={styles.backLink}>
        <Link href="/">
          &larr; Back to Elections
        </Link>
      </div>
      
      <div className={styles.electionHeader}>
        <h1>{election.name}</h1>
        <span className={`${styles.badge} ${getStatusClassName(election)}`}>
          {formatElectionStatus(election.status, election.startTime, election.endTime)}
        </span>
      </div>
      
      <p className={styles.description}>{election.description}</p>
      
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3>Start Time</h3>
          <p>{formatDate(election.startTime)}</p>
          {isWaitingForStart && (
            <CountdownTimer 
              targetTime={election.startTime} 
              label="Election starts in" 
              expiredMessage="Ready to vote!" 
              onExpire={handleTimerExpire}
            />
          )}
        </div>
        <div className={styles.infoCard}>
          <h3>End Time</h3>
          <p>{formatDate(election.endTime)}</p>
          {election.status === 1 && !isWaitingForStart && election.endTime && parseInt(election.endTime) > Math.floor(Date.now() / 1000) && (
            <CountdownTimer 
              targetTime={election.endTime} 
              label="Election ends in" 
              expiredMessage="Election ended" 
              onExpire={handleTimerExpire}
            />
          )}
        </div>
        <div className={styles.infoCard}>
          <h3>Candidates</h3>
          <p>{election.candidatesCount}</p>
        </div>
        <div className={styles.infoCard}>
          <h3>Total Votes</h3>
          <p>{election.totalVotes}</p>
        </div>
      </div>
      
      {isAdmin && election.status === 0 && (
        <div className={styles.adminControls}>
          <Link href={`/admin/add-candidate/${id}`}>
            <button className={styles.button}>Add Candidate</button>
          </Link>
          <button 
            className={styles.button}
            onClick={handleStartElection}
            disabled={election.candidatesCount === 0}
          >
            Start Election
          </button>
          {election.candidatesCount === 0 && (
            <p className={styles.warning}>Add at least one candidate before starting the election</p>
          )}
        </div>
      )}
      
      {isAdmin && election.status === 1 && (
        <div className={styles.adminControls}>
          <button 
            className={`${styles.button} ${styles.dangerButton}`}
            onClick={handleEndElection}
          >
            {hasEnded ? 'Officially End Election' : 'End Election'}
          </button>
          {hasEnded && (
            <p className={styles.adminNote}>
              The election time has expired, but you need to officially end it to record the transaction on the blockchain.
            </p>
          )}
        </div>
      )}
      
      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
        </div>
      )}
      
      {isWaitingForStart && (
        <div className={styles.waitingMessage}>
          <h2>Election Starts Soon</h2>
          <p>This election is scheduled to start at {formatDate(election.startTime)}.</p>
          <CountdownTimer 
            targetTime={election.startTime} 
            label="Time remaining" 
            size="large" 
            expiredMessage="Ready to vote!" 
            onExpire={handleTimerExpire}
          />
        </div>
      )}
      
      {hasEnded && (
        <div className={styles.endedMessage}>
          <h2>Election Has Ended</h2>
          <p>This election closed at {formatDate(election.endTime)}.</p>
          <p>No more votes can be cast.</p>
        </div>
      )}
      
      <div className={styles.candidatesSection}>
        <h2>Candidates</h2>
        
        {candidates.length === 0 ? (
          <p>No candidates have been added to this election.</p>
        ) : (
          <div className={styles.candidatesList}>
            {candidates.map((candidate) => (
              <div key={candidate.id} className={styles.candidateCard}>
                <div className={styles.candidateInfo}>
                  <h3>{candidate.name}</h3>
                  <p>Votes: {candidate.voteCount}</p>
                  {election.totalVotes > 0 && (
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${(candidate.voteCount / election.totalVotes) * 100}%` }}
                      ></div>
                      <span className={styles.progressText}>
                        {((candidate.voteCount / election.totalVotes) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {election.status === 1 && !hasEnded && !isWaitingForStart && !hasVoted && (
        <div className={styles.votingSection}>
          <h2>Cast Your Vote</h2>
          <form onSubmit={handleVote}>
            <div className={styles.formGroup}>
              <label htmlFor="candidateSelect">Select a candidate:</label>
              <select
                id="candidateSelect"
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                disabled={isVoting}
                required
              >
                <option value="">-- Select Candidate --</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className={styles.button}
              disabled={!selectedCandidate || isVoting}
            >
              {isVoting ? 'Processing...' : 'Vote'}
            </button>
          </form>
        </div>
      )}
      
      {election.status === 1 && !hasEnded && !isWaitingForStart && hasVoted && (
        <div className={styles.votedMessage}>
          <p>Thank you for voting in this election!</p>
        </div>
      )}
      
      {showVoteTimeline && (
        <div className={styles.timelineSection}>
          <h2>Vote Timeline</h2>
          <div className={styles.timelineChart}>
            <VoteTimelineChart data={voteTimelineData} candidates={candidates} />
          </div>
        </div>
      )}
      
      {(election.status === 2 || hasEnded) && (
        <div className={styles.resultsSection}>
          <h2>Final Results</h2>
          {candidates.length > 0 && (
            <div className={styles.resultsChart}>
              {candidates
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((candidate, index) => (
                  <div key={candidate.id} className={styles.resultItem}>
                    <div className={styles.resultRank}>{index + 1}</div>
                    <div className={styles.resultName}>{candidate.name}</div>
                    <div className={styles.resultVotes}>{candidate.voteCount} votes</div>
                    <div className={styles.resultBar}>
                      <div 
                        className={styles.resultFill} 
                        style={{ 
                          width: election.totalVotes > 0 
                            ? `${(candidate.voteCount / election.totalVotes) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                      <span className={styles.resultPercent}>
                        {election.totalVotes > 0 
                          ? ((candidate.voteCount / election.totalVotes) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}