import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../../styles/Admin.module.css';
import ConnectWallet from '../../components/ConnectWallet';
import initCredentialManager, {
  formatAddress,
  formatBalance,
  generateWallet,
  generateMultipleWallets,
  createCredential,
  createCredentialsBatch,
  updateCredentialStatus,
  updateCredentialsStatusBatch,
  addFunds,
  addFundsBatch,
  getCredentials,
  getCredentialCount,
  exportCredentialsToCSV,
  downloadCSV
} from '../../utils/credentials';

export default function CredentialManager({ web3, contract, account, isAdmin, loading, onConnect }) {
  const router = useRouter();
  const [credentialManager, setCredentialManager] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [totalCredentials, setTotalCredentials] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false);
  
  // Selected credentials for batch operations
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Wallet info modal state
  const [selectedWalletInfo, setSelectedWalletInfo] = useState({
    isOpen: false,
    address: '',
    balance: '',
    status: false,
    createdAt: null
  });
  
  // Wallet info modal state
  const [selectedWalletInfo, setSelectedWalletInfo] = useState({
    isOpen: false,
    address: '',
    balance: '',
    status: false,
    createdAt: null
  });
  
  // Form state for creating a new credential
  const [newSingleCredential, setNewSingleCredential] = useState({
    generating: false
  });
  
  // Form state for batch creation
  const [batchCreation, setBatchCreation] = useState({
    count: 5,
    generating: false,
    generatedWallets: []
  });
  
  // Form state for adding funds
  const [fundForm, setFundForm] = useState({
    walletAddress: '',
    amount: 0.01,
    isOpen: false,
    isBatch: false
  });
  
  // Initialize credential manager
  useEffect(() => {
    const initialize = async () => {
      if (!web3 || !account) return;
      
      try {
        const manager = await initCredentialManager(web3);
        if (manager) {
          setCredentialManager(manager);
        } else {
          setErrorMessage("Failed to initialize credential manager. Please ensure the contract is deployed.");
        }
      } catch (error) {
        console.error("Error initializing credential manager:", error);
        setErrorMessage("Error initializing credential manager: " + error.message);
      }
    };
    
    initialize();
  }, [web3, account]);
  
  // Load credentials
  useEffect(() => {
    const loadCredentials = async () => {
      if (!credentialManager) return;
      
      try {
        setIsLoading(true);
        setErrorMessage('');
        
        // Get total count
        const count = await getCredentialCount(credentialManager);
        setTotalCredentials(parseInt(count));
        
        // Get paginated credentials
        const start = currentPage * pageSize;
        const creds = await getCredentials(credentialManager, start, pageSize);
        
        // Add formatted balance
        const credsWithFormattedBalance = creds.map(cred => ({
          ...cred,
          formattedBalance: formatBalance(cred.balance, web3)
        }));
        
        setCredentials(credsWithFormattedBalance);
        setSelectedCredentials([]); // Reset selections when loading new credentials
        setSelectAll(false);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading credentials:", error);
        setErrorMessage("Error loading credentials: " + error.message);
        setIsLoading(false);
      }
    };
    
    if (credentialManager) {
      loadCredentials();
    }
  }, [credentialManager, currentPage, pageSize, web3]);
  
  // Handle creating a single credential
  const handleCreateCredential = async () => {
    if (!credentialManager || !account || !isAdmin) {
      setErrorMessage("Not authorized or contract not initialized");
      return;
    }
    
    try {
      setNewSingleCredential({ generating: true });
      setErrorMessage('');
      setSuccessMessage('');
      
      // Generate a new wallet
      const wallet = generateWallet();
      
      // Create the credential
      await createCredential(credentialManager, account, wallet.address);
      
      // Show success message with wallet details and QR code for private key
      setSuccessMessage(
        <div>
          <p><strong>New wallet generated and registered!</strong></p>
          <p><strong>Address:</strong> {wallet.address}</p>
          <p><strong>Private Key:</strong> {wallet.privateKey}</p>
          <div className={styles.qrCodeContainer}>
            <h4>Scan to get private key (KEEP SECURE!)</h4>
            <div className={styles.qrCode}>
              <QRCodeSVG 
                value={wallet.privateKey}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={true}
              />
            </div>
            <p className={styles.qrHelp}>Scan this QR code to get the private key (do NOT share this QR code)</p>
          </div>
          <p className={styles.privateKeyWarning}>
            <strong>Warning:</strong> This is the only time you will see this private key. 
            Please save it in a secure location now!
          </p>
        </div>
      );
      
      // Show warning
      setShowPrivateKeyWarning(true);
      
      // Refresh the list
      const count = await getCredentialCount(credentialManager);
      setTotalCredentials(parseInt(count));
      
      // Go to first page to see new credential
      setCurrentPage(0);
      
      const creds = await getCredentials(credentialManager, 0, pageSize);
      const credsWithFormattedBalance = creds.map(cred => ({
        ...cred,
        formattedBalance: formatBalance(cred.balance, web3)
      }));
      
      setCredentials(credsWithFormattedBalance);
      setNewSingleCredential({ generating: false });
    } catch (error) {
      console.error("Error creating credential:", error);
      setErrorMessage("Error creating credential: " + error.message);
      setNewSingleCredential({ generating: false });
    }
  };
  
  // Handle creating batch credentials
  const handleCreateBatchCredentials = async () => {
    if (!credentialManager || !account || !isAdmin) {
      setErrorMessage("Not authorized or contract not initialized");
      return;
    }
    
    try {
      setBatchCreation({ ...batchCreation, generating: true });
      setErrorMessage('');
      setSuccessMessage('');
      
      // Generate wallets
      const count = parseInt(batchCreation.count);
      if (isNaN(count) || count <= 0 || count > 100) {
        throw new Error("Invalid count. Please enter a number between 1 and 100.");
      }
      
      const wallets = generateMultipleWallets(count);
      
      // Create credentials
      await createCredentialsBatch(
        credentialManager, 
        account, 
        wallets.map(w => w.address)
      );
      
      // Format for display and export
      const walletsForExport = wallets.map(w => ({
        walletAddress: w.address,
        privateKey: w.privateKey,
        isActive: true,
        formattedBalance: '0 ETH'
      }));
      
      // Generate CSV
      const csv = exportCredentialsToCSV(walletsForExport, true);
      
      // Download the CSV
      downloadCSV(csv, 'new_credentials.csv');
      
      // Create printable HTML with private key QR codes
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        const printDate = new Date().toLocaleDateString();
        let printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Batch Credentials - ${printDate}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 20px;
              }
              h1, h2 {
                text-align: center;
              }
              .warning {
                background-color: #fff3cd;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                text-align: center;
                font-weight: bold;
              }
              .credentials-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
              }
              .credential-card {
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 15px;
                width: 350px;
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .credential-header {
                text-align: center;
                border-bottom: 2px solid #333;
                margin-bottom: 15px;
                padding-bottom: 10px;
              }
              .qr-section {
                text-align: center;
                margin: 15px 0;
              }
              .wallet-details {
                margin: 15px 0;
              }
              .detail-row {
                display: flex;
                margin-bottom: 8px;
              }
              .detail-label {
                font-weight: bold;
                width: 100px;
                color: #666;
              }
              .detail-value {
                flex: 1;
                font-family: monospace;
                font-size: 0.8rem;
                word-break: break-all;
              }
              .footer {
                text-align: center;
                font-size: 0.8rem;
                color: #666;
                margin-top: 10px;
              }
              @media print {
                .pagebreak {
                  page-break-before: always;
                }
                .no-break {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <h1>E-Voting System - Voter Credentials</h1>
            <p>Generated on ${printDate}</p>
            <div class="warning">
              WARNING: These pages contain private keys that provide full access to the wallets.
              Store securely and distribute to voters individually.
            </div>
            <div class="credentials-container">
        `;
        
        // Add each credential as a card with QR code for private key
        wallets.forEach((wallet, index) => {
          if (index > 0 && index % 4 === 0) {
            printContent += '<div class="pagebreak"></div>';
          }
          
          printContent += `
            <div class="credential-card no-break">
              <div class="credential-header">
                <h3>Voter Credential #${index + 1}</h3>
              </div>
              
              <div class="qr-section">
                <h4>Scan this QR code to get the private key</h4>
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(wallet.privateKey)}&size=200x200" 
                  alt="Private Key QR Code"
                  width="200"
                  height="200"
                />
              </div>
              
              <div class="wallet-details">
                <div class="detail-row">
                  <div class="detail-label">Address:</div>
                  <div class="detail-value">${wallet.address}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">Private Key:</div>
                  <div class="detail-value">${wallet.privateKey}</div>
                </div>
              </div>
              
              <div class="footer">
                E-Voting System - Keep this credential secure and confidential
              </div>
            </div>
          `;
        });
        
        printContent += `
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
          </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
      }
      
      // Show success message
      setSuccessMessage(
        <div>
          <p><strong>{count} new wallets generated and registered!</strong></p>
          <p>The credentials have been downloaded as a CSV file and opened for printing.</p>
          <p className={styles.privateKeyWarning}>
            <strong>Warning:</strong> CSV file and printouts contain private keys. 
            Keep them in a secure location!
          </p>
        </div>
      );
      
      // Store generated wallets for display
      setBatchCreation({
        ...batchCreation,
        generating: false,
        generatedWallets: wallets
      });
      
      // Refresh the list
      const newCount = await getCredentialCount(credentialManager);
      setTotalCredentials(parseInt(newCount));
      
      // Go to first page to see new credentials
      setCurrentPage(0);
      
      const creds = await getCredentials(credentialManager, 0, pageSize);
      const credsWithFormattedBalance = creds.map(cred => ({
        ...cred,
        formattedBalance: formatBalance(cred.balance, web3)
      }));
      
      setCredentials(credsWithFormattedBalance);
    } catch (error) {
      console.error("Error creating batch credentials:", error);
      setErrorMessage("Error creating batch credentials: " + error.message);
      setBatchCreation({ ...batchCreation, generating: false });
    }
  };
  
  // Handle toggling credential active status
  const handleToggleActive = async (walletAddress, isCurrentlyActive) => {
    if (!credentialManager || !account || !isAdmin) {
      setErrorMessage("Not authorized or contract not initialized");
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Update status
      await updateCredentialStatus(
        credentialManager,
        account,
        walletAddress,
        !isCurrentlyActive
      );
      
      setSuccessMessage(`Credential ${formatAddress(walletAddress)} ${isCurrentlyActive ? 'deactivated' : 'activated'}`);
      
      // Refresh the list
      const creds = await getCredentials(credentialManager, currentPage * pageSize, pageSize);
      const credsWithFormattedBalance = creds.map(cred => ({
        ...cred,
        formattedBalance: formatBalance(cred.balance, web3)
      }));
      
      setCredentials(credsWithFormattedBalance);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error toggling credential status:", error);
      setErrorMessage("Error toggling credential status: " + error.message);
      setIsLoading(false);
    }
  };
  
  // Handle batch activation/deactivation
  const handleBatchStatusChange = async (activate) => {
    if (!credentialManager || !account || !isAdmin || selectedCredentials.length === 0) {
      setErrorMessage("Not authorized, contract not initialized, or no credentials selected");
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Update statuses in batch
      await updateCredentialsStatusBatch(
        credentialManager,
        account,
        selectedCredentials,
        activate
      );
      
      setSuccessMessage(`${selectedCredentials.length} credentials ${activate ? 'activated' : 'deactivated'}`);
      
      // Refresh the list
      const creds = await getCredentials(credentialManager, currentPage * pageSize, pageSize);
      const credsWithFormattedBalance = creds.map(cred => ({
        ...cred,
        formattedBalance: formatBalance(cred.balance, web3)
      }));
      
      setCredentials(credsWithFormattedBalance);
      setSelectedCredentials([]);
      setSelectAll(false);
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Error ${activate ? 'activating' : 'deactivating'} credentials:`, error);
      setErrorMessage(`Error ${activate ? 'activating' : 'deactivating'} credentials: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // Handle opening fund form
  const handleOpenFundForm = (walletAddress, isBatch = false) => {
    setFundForm({
      walletAddress: walletAddress || '',
      amount: isBatch ? 0.05 : 0.01,
      isOpen: true,
      isBatch
    });
  };
  
  // Handle fund form changes
  const handleFundFormChange = (e) => {
    const { name, value } = e.target;
    setFundForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle adding funds
  const handleAddFunds = async (e) => {
    e.preventDefault();
    
    if (!credentialManager || !account || !isAdmin) {
      setErrorMessage("Not authorized or contract not initialized");
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      if (fundForm.isBatch) {
        // Add funds to multiple wallets
        if (selectedCredentials.length === 0) {
          throw new Error("No credentials selected");
        }
        
        await addFundsBatch(
          credentialManager,
          account,
          selectedCredentials,
          fundForm.amount
        );
        
        setSuccessMessage(`Added ${fundForm.amount} ETH distributed among ${selectedCredentials.length} wallets`);
      } else {
        // Add funds to a single wallet
        await addFunds(
          credentialManager,
          account,
          fundForm.walletAddress,
          fundForm.amount
        );
        
        setSuccessMessage(`Added ${fundForm.amount} ETH to wallet ${formatAddress(fundForm.walletAddress)}`);
      }
      
      // Close form
      setFundForm({
        walletAddress: '',
        amount: 0.01,
        isOpen: false,
        isBatch: false
      });
      
      // Refresh the list
      const creds = await getCredentials(credentialManager, currentPage * pageSize, pageSize);
      const credsWithFormattedBalance = creds.map(cred => ({
        ...cred,
        formattedBalance: formatBalance(cred.balance, web3)
      }));
      
      setCredentials(credsWithFormattedBalance);
      setSelectedCredentials([]);
      setSelectAll(false);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding funds:", error);
      setErrorMessage("Error adding funds: " + error.message);
      setIsLoading(false);
    }
  };
  
  // Handle selection of a credential
  const handleSelectCredential = (walletAddress) => {
    setSelectedCredentials(prev => {
      if (prev.includes(walletAddress)) {
        return prev.filter(addr => addr !== walletAddress);
      } else {
        return [...prev, walletAddress];
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCredentials([]);
    } else {
      setSelectedCredentials(credentials.map(cred => cred.walletAddress));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle exporting visible credentials
  const handleExportVisible = () => {
    const csv = exportCredentialsToCSV(credentials);
    downloadCSV(csv, 'credentials_export.csv');
    setSuccessMessage('Visible credentials exported successfully!');
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if ((currentPage + 1) * pageSize < totalCredentials) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Handle opening wallet info modal
  const handleOpenWalletInfo = (credential) => {
    setSelectedWalletInfo({
      isOpen: true,
      address: credential.walletAddress,
      balance: credential.formattedBalance,
      status: credential.isActive,
      createdAt: credential.createdAt
    });
  };
  
  // Handle closing wallet info modal
  const handleCloseWalletInfo = () => {
    setSelectedWalletInfo({
      isOpen: false,
      address: '',
      balance: '',
      status: false,
      createdAt: null
    });
  };
  
  // Handle printing wallet info as PDF
  const handlePrintWalletInfo = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert("Please allow popups for this website to print wallet information.");
      return;
    }
    
    // Get current date for the printout
    const printDate = new Date().toLocaleDateString();
    
    // Create print-friendly content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Wallet Credential - ${selectedWalletInfo.address.substring(0, 10)}...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding-bottom: 15px;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .qr-section {
            text-align: center;
            margin: 20px 0;
          }
          .wallet-details {
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            width: 100px;
            color: #666;
          }
          .detail-value {
            flex: 1;
            font-family: monospace;
            word-break: break-all;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.9rem;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
          .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
          }
          .active {
            background-color: #d1e7dd;
            color: #0f5132;
          }
          .inactive {
            background-color: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h2>E-Voting Wallet Credential</h2>
            <p>Generated on ${printDate}</p>
          </div>
          
          <div class="qr-section">
            <h3>Scan to import in MetaMask</h3>
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?data=ethereum:${selectedWalletInfo.address}&size=200x200" 
              alt="Wallet QR Code"
              width="200"
              height="200"
            />
            <p>Scan this QR code with MetaMask mobile app to add this wallet</p>
          </div>
          
          <div class="wallet-details">
            <h3>Wallet Information</h3>
            
            <div class="detail-row">
              <div class="detail-label">Address:</div>
              <div class="detail-value">${selectedWalletInfo.address}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Balance:</div>
              <div class="detail-value">${selectedWalletInfo.balance}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="badge ${selectedWalletInfo.status ? 'active' : 'inactive'}">
                  ${selectedWalletInfo.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Created:</div>
              <div class="detail-value">${formatDate(selectedWalletInfo.createdAt)}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>E-Voting System - Secure Blockchain Voting Platform</p>
            <p>Keep this credential information secure and confidential</p>
          </div>
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Close window after printing (or if print is cancelled)
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
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
        <title>Credential Manager | E-Voting System</title>
      </Head>
      
      <div className={styles.backLink}>
        <Link href="/admin/manage-elections">
          &larr; Back to Admin
        </Link>
      </div>
      
      <h1 className={styles.title}>Credential Manager</h1>
      
      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button 
            className={styles.closeButton} 
            onClick={() => setErrorMessage('')}
          >
            &times;
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className={styles.success}>
          {typeof successMessage === 'string' ? <p>{successMessage}</p> : successMessage}
          <button 
            className={styles.closeButton} 
            onClick={() => {
              setSuccessMessage('');
              setShowPrivateKeyWarning(false);
            }}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Create New Credentials Section */}
      <div className={styles.formCard}>
        <h2>Create Credentials</h2>
        
        <div className={styles.credentialActions}>
          {/* Single Credential Creation */}
          <div className={styles.actionCard}>
            <h3>Create Single Credential</h3>
            <p>Generate a new wallet with a private key</p>
            <button
              className={styles.button}
              onClick={handleCreateCredential}
              disabled={newSingleCredential.generating || isLoading}
            >
              {newSingleCredential.generating ? 'Generating...' : 'Generate New Wallet'}
            </button>
          </div>
          
          {/* Batch Credential Creation */}
          <div className={styles.actionCard}>
            <h3>Batch Create Credentials</h3>
            <div className={styles.formGroup}>
              <label htmlFor="batchCount">Number of Wallets:</label>
              <input
                type="number"
                id="batchCount"
                value={batchCreation.count}
                onChange={(e) => setBatchCreation({ ...batchCreation, count: e.target.value })}
                min="1"
                max="100"
                className={styles.input}
              />
            </div>
            <p>Generate multiple wallets at once</p>
            <button
              className={styles.button}
              onClick={handleCreateBatchCredentials}
              disabled={batchCreation.generating || isLoading}
            >
              {batchCreation.generating ? 'Generating...' : 'Generate Batch'}
            </button>
          </div>
        </div>
        
        {showPrivateKeyWarning && (
          <div className={styles.privateKeyWarningPanel}>
            <h3>⚠️ Important Security Notice</h3>
            <p>You have just created a new credential with its private key. This key will NOT be shown again.</p>
            <p>Please ensure you have saved the private key in a secure location before dismissing this message.</p>
            <ul>
              <li>The private key provides complete control over the associated funds</li>
              <li>Anyone with the private key can vote using this credential</li>
              <li>Lost private keys cannot be recovered</li>
            </ul>
            <button 
              className={styles.warningButton} 
              onClick={() => setShowPrivateKeyWarning(false)}
            >
              I've Securely Saved The Private Key
            </button>
          </div>
        )}
      </div>
      
      {/* Batch Operations Panel */}
      {credentials.length > 0 && (
        <div className={styles.batchOperationsPanel}>
          <h3>Batch Operations</h3>
          <p>{selectedCredentials.length} of {credentials.length} credentials selected</p>
          
          <div className={styles.batchButtons}>
            <button
              className={`${styles.batchButton} ${styles.activateButton}`}
              onClick={() => handleBatchStatusChange(true)}
              disabled={selectedCredentials.length === 0 || isLoading}
            >
              Activate Selected
            </button>
            
            <button
              className={`${styles.batchButton} ${styles.deactivateButton}`}
              onClick={() => handleBatchStatusChange(false)}
              disabled={selectedCredentials.length === 0 || isLoading}
            >
              Deactivate Selected
            </button>
            
            <button
              className={`${styles.batchButton} ${styles.fundButton}`}
              onClick={() => handleOpenFundForm('', true)}
              disabled={selectedCredentials.length === 0 || isLoading}
            >
              Fund Selected
            </button>
            
            <button
              className={`${styles.batchButton} ${styles.exportButton}`}
              onClick={handleExportVisible}
              disabled={isLoading}
            >
              Export Visible
            </button>
          </div>
        </div>
      )}
      
      {/* Credentials List */}
      <div className={styles.credentialsSection}>
        <h2>Voter Credentials</h2>
        {isLoading && !credentials.length ? (
          <div className={styles.loading}>Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No credentials have been created yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.credentialsTable}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className={styles.checkbox}
                      />
                    </th>
                    <th>Wallet Address</th>
                    <th>Status</th>
                    <th>Balance</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((credential) => (
                    <tr key={credential.walletAddress}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCredentials.includes(credential.walletAddress)}
                          onChange={() => handleSelectCredential(credential.walletAddress)}
                          className={styles.checkbox}
                        />
                      </td>
                      <td 
                        className={`${styles.walletAddress} ${styles.clickable}`} 
                        onClick={() => handleOpenWalletInfo(credential)}
                        title="Click for wallet details"
                      >
                        {credential.walletAddress}
                      </td>
                      <td 
                        className={`${styles.walletAddress} ${styles.clickable}`} 
                        onClick={() => handleOpenWalletInfo(credential)}
                        title="Click for wallet details"
                      >
                        {credential.walletAddress}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${credential.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {credential.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{credential.formattedBalance}</td>
                      <td>{formatDate(credential.createdAt)}</td>
                      <td className={styles.actions}>
                        <button
                          className={`${styles.actionButton} ${credential.isActive ? styles.deactivateButton : styles.activateButton}`}
                          onClick={() => handleToggleActive(credential.walletAddress, credential.isActive)}
                          title={credential.isActive ? "Deactivate" : "Activate"}
                        >
                          {credential.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          className={`${styles.actionButton} ${styles.fundButton}`}
                          onClick={() => handleOpenFundForm(credential.walletAddress)}
                          title="Add Funds"
                        >
                          Fund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                &larr; Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage + 1} of {Math.ceil(totalCredentials / pageSize) || 1}
              </span>
              <button
                className={styles.paginationButton}
                onClick={handleNextPage}
                disabled={(currentPage + 1) * pageSize >= totalCredentials}
              >
                Next &rarr;
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Fund Form Modal */}
      {fundForm.isOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{fundForm.isBatch ? 'Add Funds to Selected Credentials' : 'Add Funds'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setFundForm({ ...fundForm, isOpen: false })}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleAddFunds}>
                {!fundForm.isBatch && (
                  <div className={styles.formGroup}>
                    <label>Wallet Address:</label>
                    <input
                      type="text"
                      value={fundForm.walletAddress}
                      className={styles.input}
                      disabled
                    />
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="amount">
                    {fundForm.isBatch 
                      ? `Total Amount (ETH) to distribute among ${selectedCredentials.length} wallets:` 
                      : 'Amount (ETH):'}
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={fundForm.amount}
                    onChange={handleFundFormChange}
                    className={styles.input}
                    min="0.001"
                    step="0.001"
                    required
                  />
                  {fundForm.isBatch && (
                    <small className={styles.helpText}>
                      Each wallet will receive approximately ${(fundForm.amount / selectedCredentials.length).toFixed(6)} ETH
                    </small>
                  )}
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.button}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Send Funds'}
                  </button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => setFundForm({ ...fundForm, isOpen: false })}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info Modal with QR Code */}
      {selectedWalletInfo.isOpen && (
        <div className={styles.modal}>
          <div className={styles.walletInfoModalContent}>
            <div className={styles.modalHeader}>
              <h3>Wallet Information</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseWalletInfo}
              >
                &times;
              </button>
            </div>
            <div className={styles.walletInfoModalBody}>
              <div className={styles.walletInfoGrid}>
                <div className={styles.walletInfoDetails}>
                  <div className={styles.walletInfoItem}>
                    <span className={styles.walletInfoLabel}>Address:</span>
                    <span className={styles.walletInfoValue}>{selectedWalletInfo.address}</span>
                  </div>
                  <div className={styles.walletInfoItem}>
                    <span className={styles.walletInfoLabel}>Balance:</span>
                    <span className={styles.walletInfoValue}>{selectedWalletInfo.balance}</span>
                  </div>
                  <div className={styles.walletInfoItem}>
                    <span className={styles.walletInfoLabel}>Status:</span>
                    <span className={`${styles.badge} ${selectedWalletInfo.status ? styles.statusActive : styles.statusInactive}`}>
                      {selectedWalletInfo.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className={styles.walletInfoItem}>
                    <span className={styles.walletInfoLabel}>Created:</span>
                    <span className={styles.walletInfoValue}>{formatDate(selectedWalletInfo.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.qrCodeContainer}>
                  <h4>Scan to import in MetaMask</h4>
                  <div className={styles.qrCode}>
                    <QRCodeSVG 
                      value={`ethereum:${selectedWalletInfo.address}`}
                      size={200}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"L"}
                      includeMargin={false}
                    />
                  </div>
                  <p className={styles.qrHelp}>Scan this QR code with MetaMask mobile app to add this wallet</p>
                </div>
              </div>
              <div className={styles.walletInfoActions}>
                <button
                  className={styles.button}
                  onClick={() => {
                    handleCloseWalletInfo();
                    handleOpenFundForm(selectedWalletInfo.address);
                  }}
                >
                  Add Funds
                </button>
                <button
                  className={styles.buttonSecondary}
                  onClick={handleCloseWalletInfo}
                >
                  Close
                </button>
                <button
                  className={styles.buttonSecondary}
                  onClick={handlePrintWalletInfo}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}