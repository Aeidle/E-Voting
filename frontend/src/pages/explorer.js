import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Explorer.module.css';
import initWeb3 from '../utils/web3';

export default function BlockchainExplorer({ web3: initialWeb3, account }) {
  const [web3, setWeb3] = useState(initialWeb3);
  const [accounts, setAccounts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({});
  const [latestBlock, setLatestBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        // Use provided web3 or initialize a new one specifically for the explorer
        let w3 = web3;
        if (!w3) {
          try {
            // Connect directly to Ganache without MetaMask for read-only operations
            w3 = new window.Web3('http://localhost:8545');
            setWeb3(w3);
          } catch (error) {
            console.error("Failed to initialize Web3:", error);
            setErrorMessage("Failed to connect to blockchain. Make sure Ganache is running.");
            setLoading(false);
            return;
          }
        }

        // Fetch accounts
        const accts = await w3.eth.getAccounts();
        setAccounts(accts);

        // Fetch account balances
        const balances = {};
        for (const acct of accts) {
          balances[acct] = w3.utils.fromWei(await w3.eth.getBalance(acct), 'ether');
        }
        setAccountBalances(balances);

        // Get latest block number
        const blockNumber = await w3.eth.getBlockNumber();
        setLatestBlock(blockNumber);

        // Get last 10 blocks (or fewer if there aren't 10 blocks yet)
        const blockPromises = [];
        const startBlock = Math.max(0, blockNumber - 9);
        for (let i = blockNumber; i >= startBlock; i--) {
          blockPromises.push(w3.eth.getBlock(i));
        }

        const fetchedBlocks = await Promise.all(blockPromises);
        setBlocks(fetchedBlocks);
        
        // If blocks exist, get details for the latest one
        if (fetchedBlocks.length > 0) {
          await fetchBlockDetails(fetchedBlocks[0].number, w3);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error initializing explorer:", error);
        setErrorMessage("Error loading blockchain data: " + error.message);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const fetchBlockDetails = async (blockNumber, w3Instance = web3) => {
    try {
      setSelectedBlock(null);
      setTransactions([]);
      
      const block = await w3Instance.eth.getBlock(blockNumber, true);
      setSelectedBlock(block);

      // If the block has transactions, get their details
      if (block.transactions && block.transactions.length > 0) {
        const txPromises = block.transactions.map(async (tx) => {
          // If transaction is already detailed object (getBlock with true param)
          if (typeof tx === 'object') {
            const receipt = await w3Instance.eth.getTransactionReceipt(tx.hash);
            return { ...tx, receipt };
          } 
          // If transaction is just a hash
          else {
            const txObj = await w3Instance.eth.getTransaction(tx);
            const receipt = await w3Instance.eth.getTransactionReceipt(tx);
            return { ...txObj, receipt };
          }
        });

        const txDetails = await Promise.all(txPromises);
        setTransactions(txDetails);
      }
    } catch (error) {
      console.error("Error fetching block details:", error);
      setErrorMessage("Error loading block details: " + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Blockchain Explorer | E-Voting System</title>
        <meta name="description" content="Explore the blockchain data of the e-voting system" />
      </Head>

      <div className={styles.header}>
        <h1>Blockchain Explorer</h1>
        <Link href="/">
          <button className={styles.backButton}>Back to Application</button>
        </Link>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading blockchain data...</div>
      ) : (
        <>
          <div className={styles.grid}>
            <div className={styles.accountsSection}>
              <h2>Accounts ({accounts.length})</h2>
              <div className={styles.accountList}>
                {accounts.map((acct, index) => (
                  <div key={acct} className={styles.accountCard}>
                    <div className={styles.accountIndex}>{index}</div>
                    <div className={styles.accountDetails}>
                      <div className={styles.accountAddress}>{acct}</div>
                      <div className={styles.accountBalance}>
                        {accountBalances[acct]} ETH
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.blocksSection}>
              <h2>Latest Blocks</h2>
              <div className={styles.blockList}>
                {blocks.map((block) => (
                  <div
                    key={block.number}
                    className={`${styles.blockCard} ${selectedBlock && selectedBlock.number === block.number ? styles.selectedBlock : ''}`}
                    onClick={() => fetchBlockDetails(block.number)}
                  >
                    <div className={styles.blockNumber}>Block #{block.number}</div>
                    <div className={styles.blockInfo}>
                      <div className={styles.blockHash}>{block.hash.substring(0, 12)}...</div>
                      <div className={styles.blockTimestamp}>
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </div>
                      <div className={styles.transactionCount}>
                        {block.transactions.length} transactions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedBlock && (
            <div className={styles.blockDetails}>
              <h2>Block #{selectedBlock.number} Details</h2>
              <div className={styles.blockPropertiesGrid}>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Hash:</div>
                  <div className={styles.propertyValue}>{selectedBlock.hash}</div>
                </div>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Parent Hash:</div>
                  <div className={styles.propertyValue}>{selectedBlock.parentHash}</div>
                </div>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Timestamp:</div>
                  <div className={styles.propertyValue}>
                    {new Date(selectedBlock.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Miner:</div>
                  <div className={styles.propertyValue}>{selectedBlock.miner}</div>
                </div>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Gas Used:</div>
                  <div className={styles.propertyValue}>{selectedBlock.gasUsed}</div>
                </div>
                <div className={styles.blockProperty}>
                  <div className={styles.propertyLabel}>Gas Limit:</div>
                  <div className={styles.propertyValue}>{selectedBlock.gasLimit}</div>
                </div>
              </div>

              <h3>Transactions ({transactions.length})</h3>
              {transactions.length === 0 ? (
                <div className={styles.noTransactions}>No transactions in this block</div>
              ) : (
                <div className={styles.transactionList}>
                  {transactions.map((tx, index) => (
                    <div key={tx.hash} className={styles.transactionCard}>
                      <div className={styles.transactionHeader}>
                        <span className={styles.transactionIndex}>#{index + 1}</span>
                        <span className={styles.transactionHash}>{tx.hash}</span>
                      </div>
                      <div className={styles.transactionDetails}>
                        <div className={styles.transactionProperty}>
                          <div className={styles.propertyLabel}>From:</div>
                          <div className={styles.propertyValue}>{tx.from}</div>
                        </div>
                        <div className={styles.transactionProperty}>
                          <div className={styles.propertyLabel}>To:</div>
                          <div className={styles.propertyValue}>{tx.to || 'Contract Creation'}</div>
                        </div>
                        <div className={styles.transactionProperty}>
                          <div className={styles.propertyLabel}>Value:</div>
                          <div className={styles.propertyValue}>
                            {web3.utils.fromWei(tx.value, 'ether')} ETH
                          </div>
                        </div>
                        <div className={styles.transactionProperty}>
                          <div className={styles.propertyLabel}>Gas:</div>
                          <div className={styles.propertyValue}>{tx.gas}</div>
                        </div>
                      </div>
                      
                      {tx.receipt && tx.receipt.logs && tx.receipt.logs.length > 0 && (
                        <div className={styles.eventLogs}>
                          <h4>Event Logs</h4>
                          {tx.receipt.logs.map((log, logIndex) => (
                            <div key={logIndex} className={styles.eventLog}>
                              <div className={styles.logAddress}>Contract: {log.address}</div>
                              <div className={styles.logTopics}>
                                <div className={styles.propertyLabel}>Topics:</div>
                                {log.topics.map((topic, i) => (
                                  <div key={i} className={styles.logTopic}>{topic}</div>
                                ))}
                              </div>
                              <div className={styles.logData}>
                                <div className={styles.propertyLabel}>Data:</div>
                                <div className={styles.propertyValue}>{log.data}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}