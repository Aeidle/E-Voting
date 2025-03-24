# E-Voting System User Guide

## Introduction

This blockchain-based e-voting system provides a secure, transparent, and tamper-proof platform for conducting elections. The system uses Ethereum blockchain technology to ensure vote integrity and transparency while maintaining voter privacy.

## User Roles

The system supports two primary user roles:

1. **Administrator**: Creates and manages elections, manages voter credentials
2. **Voter**: Participates in elections by casting votes using their assigned credentials

## Getting Started

### System Requirements

- A modern web browser (Chrome, Firefox, Edge)
- MetaMask wallet extension installed in your browser

### Accessing the System

1. Open your browser and navigate to the application URL (typically http://localhost:3000 in development)
2. Connect your MetaMask wallet when prompted
3. The system will automatically detect if you have administrator privileges

## Administrator Guide

As an administrator, you can create and manage elections, as well as voter credentials.

### Managing Elections

#### Creating a New Election

1. Navigate to the "Admin" section in the top navigation bar
2. Click "Create New Election"
3. Fill in the election details:
   - **Name**: A descriptive name for the election
   - **Description**: Detailed information about the election
   - **Start Time**: When voting will begin (optional, can be started manually)
   - **End Time**: When voting will end (optional, can be ended manually)
4. Click "Create Election"

#### Adding Candidates

1. From the "Manage Elections" page, locate your election
2. Click "Add Candidates"
3. Enter the candidate's name
4. Click "Add Candidate"
5. Repeat for all candidates

#### Starting an Election

1. From the "Manage Elections" page, locate your election with status "Created"
2. Click "Start Election"
3. The election status will change to "Active" or "Starts Soon" if a future start time was set

#### Ending an Election

1. From the "Manage Elections" page, locate your active election
2. Click "End Election" or "Finalize" for expired elections
3. The election status will change to "Closed"

#### Viewing Results

1. Navigate to an election with status "Closed"
2. Scroll down to see the "Final Results" section
3. Results are displayed as a ranked list with vote counts and percentages

### Managing Voter Credentials

#### Accessing Credential Manager

1. From the "Manage Elections" page, click "Manage Credentials"
2. The Credential Manager will open, showing all existing credentials

#### Creating Individual Credentials

1. In the Credential Manager, click "Generate New Wallet"
2. A new credential (wallet) will be created with an active status
3. **IMPORTANT**: Copy and securely store the private key shown. This is the ONLY time it will be displayed.

#### Creating Multiple Credentials in Batch

1. Enter the number of credentials to generate (1-100)
2. Click "Generate Batch"
3. A CSV file containing all generated credentials (including private keys) will be automatically downloaded
4. **IMPORTANT**: Store this file securely as it contains private keys that cannot be recovered

#### Managing Credential Status

1. To activate or deactivate a credential, click the corresponding button in the "Actions" column
2. Deactivated credentials cannot be used for voting

#### Adding Funds to Credentials

1. Click "Fund" next to a credential
2. Enter the amount of ETH to send
3. Click "Send Funds"
4. The funds will be transferred from your admin account to the voter's wallet

#### Batch Operations

1. Select multiple credentials using the checkboxes
2. Use the buttons in the "Batch Operations" panel to:
   - Activate all selected credentials
   - Deactivate all selected credentials
   - Fund all selected credentials (funds will be distributed equally)
   - Export visible credentials to a CSV file

## Voter Guide

As a voter, you can participate in active elections using your assigned credentials.

### Setting Up Your Wallet

1. Receive your credential information (wallet address and private key) from the administrator
2. Install MetaMask browser extension if you haven't already
3. Import your private key into MetaMask:
   - Click the account icon in MetaMask
   - Select "Import Account"
   - Paste your private key and click "Import"

### Connecting to the Voting System

1. Open the e-voting application in your browser
2. Click "Connect Wallet"
3. Select the imported account in MetaMask
4. The system will authenticate your credential

### Viewing Available Elections

1. The home page displays all available elections
2. Active elections are highlighted and available for voting
3. You can also see elections that will start soon or have ended

### Casting a Vote

1. Click on an active election to view details
2. Review the candidates and their information
3. Select your preferred candidate from the dropdown menu
4. Click "Vote"
5. Confirm the transaction in MetaMask
6. Wait for the transaction to be processed
7. Once confirmed, your vote is recorded on the blockchain

### Viewing Results

1. After voting, you can see the current vote count and distribution
2. When an election ends, you can see the final results showing:
   - Ranking of candidates
   - Vote counts
   - Percentage of votes for each candidate
   - Visual representation of results

## Important Security Notes

1. **Private Key Security**: Your private key provides complete control over your voting credential. Never share it with anyone.
2. **One Vote Per Election**: Each credential can only vote once in each election.
3. **Credential Status**: Your credential must be active to participate in voting.
4. **Transaction Confirmation**: Always wait for transaction confirmation before closing your browser.

## Troubleshooting

### Common Issues

1. **"Credential is not active" Error**: Your credential has been deactivated by an administrator. Contact them for assistance.
2. **"Voter has already voted" Error**: This credential has already been used to cast a vote in this election.
3. **"Election has not started yet" Error**: The election is scheduled to start at a future time. Check the start time on the election page.
4. **"Election voting period has ended" Error**: The election has closed and is no longer accepting votes.
5. **MetaMask Transaction Errors**: Ensure you have enough ETH in your wallet to cover the transaction gas fees.

For additional help, contact your system administrator.