import styles from '../styles/Home.module.css';

export default function CandidateList({ candidates, loading }) {
  if (loading) {
    return <div>Loading candidates...</div>;
  }

  return (
    <div className={styles.candidateList}>
      <h2>Candidates</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Votes</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.id}</td>
              <td>{candidate.name}</td>
              <td>{candidate.voteCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}