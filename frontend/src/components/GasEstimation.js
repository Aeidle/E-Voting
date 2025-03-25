import { useState, useEffect } from 'react';
import styles from '../styles/GasEstimation.module.css';

export default function GasEstimation({ estimatedGas, web3, onCustomGasSet }) {
  const [gasPrice, setGasPrice] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [customGas, setCustomGas] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  useEffect(() => {
    const getGasPrice = async () => {
      if (web3 && estimatedGas) {
        try {
          const price = await web3.eth.getGasPrice();
          setGasPrice(price);
          
          // Calculate estimated cost (gas * gasPrice)
          const cost = web3.utils.fromWei((BigInt(estimatedGas) * BigInt(price)).toString(), 'ether');
          setEstimatedCost(parseFloat(cost).toFixed(8));
        } catch (error) {
          console.error("Error fetching gas price:", error);
        }
      }
    };
    
    getGasPrice();
  }, [web3, estimatedGas]);
  
  const handleCustomGasChange = (e) => {
    const value = e.target.value;
    setCustomGas(value);
  };
  
  const applyCustomGas = () => {
    if (customGas && !isNaN(customGas) && parseInt(customGas) > 0) {
      onCustomGasSet(parseInt(customGas));
    }
  };
  
  if (!estimatedGas || !gasPrice) return null;
  
  return (
    <div className={styles.gasEstimation}>
      <div className={styles.gasInfo}>
        <span className={styles.gasLabel}>Estimated Gas:</span>
        <span className={styles.gasValue}>{estimatedGas}</span>
      </div>
      <div className={styles.gasInfo}>
        <span className={styles.gasLabel}>Estimated Cost:</span>
        <span className={styles.gasValue}>{estimatedCost} ETH</span>
      </div>
      
      {onCustomGasSet && (
        <div className={styles.advancedOptions}>
          <p className={styles.helpText}>
            If you're experiencing "Internal JSON-RPC error" or gas estimation problems, 
            try setting a custom gas limit below:
          </p>
          <div className={styles.customGasInput}>
            <input
              type="number"
              value={customGas}
              onChange={handleCustomGasChange}
              placeholder="Custom gas limit (e.g. 300000)"
              className={styles.gasInput}
            />
            <button 
              className={styles.applyButton}
              onClick={applyCustomGas}
              disabled={!customGas || isNaN(customGas) || parseInt(customGas) <= 0}
            >
              Apply
            </button>
          </div>
          <div className={styles.manualInstructions}>
            <details>
              <summary>Manual MetaMask Instructions</summary>
              <ol>
                <li>When MetaMask opens, click "Edit" in the gas fees section</li>
                <li>Manually set the "Gas Limit" to a higher value (try 300000)</li>
                <li>Click "Save" and then "Confirm" to process the transaction</li>
              </ol>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}