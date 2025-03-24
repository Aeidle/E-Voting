import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function VotingForm({ candidates, onVote, loading }) {
  const [selectedCandidate, setSelectedCandidate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    onVote(parseInt(selectedCandidate));
  };

  return (
    <div className={styles.votingForm}>
      <h2>Cast Your Vote</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="candidateSelect">Select a candidate:</label>
          <select
            id="candidateSelect"
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            disabled={loading}
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
          disabled={!selectedCandidate || loading}
        >
          {loading ? 'Processing...' : 'Vote'}
        </button>
      </form>
    </div>
  );
}