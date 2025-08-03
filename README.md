# Blockchain E-Voting System

A secure, transparent, and tamper-proof e-voting platform built on Ethereum blockchain technology. This system leverages the immutability and transparency of blockchain to ensure election integrity while maintaining voter privacy.

![E-Voting System Architecture](/docs/system-architecture.svg)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
  - [Administrator Guide](#administrator-guide)
  - [Voter Guide](#voter-guide)
- [Development](#development)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project implements a blockchain-based e-voting system designed to address key challenges in electronic voting:
- **Security**: Utilizing blockchain's immutability to prevent tampering
- **Transparency**: All votes are recorded on a public ledger for verification
- **Privacy**: Vote contents are linked only to blockchain wallets, not personal identities
- **Accessibility**: Web-based interface accessible from any modern browser

The system supports multiple simultaneous elections, real-time result visualization, and comprehensive credential management.

## Features

### For Administrators
- **Election Management**: Create, configure, start, and end elections
- **Candidate Registration**: Add multiple candidates to each election
- **Credential Management**:
  - Generate voter wallets (individually or in batch)
  - Activate/deactivate voter credentials
  - Fund voter wallets for gas fees
  - Export credential data for distribution
- **Real-time Analytics**: Monitor voting progress and results
- **Multi-election Support**: Run multiple elections simultaneously

### For Voters
- **Secure Authentication**: Access voting through blockchain wallet credentials
- **Simple Voting Interface**: Intuitive process for casting votes
- **Vote Verification**: Confirm vote recording on the blockchain
- **Real-time Results**: View current and final election results
- **Multiple Election Participation**: Vote in all eligible elections

### Technical Features
- **Immutable Vote Records**: All votes permanently recorded on blockchain
- **Smart Contract Security**: Business logic secured by Ethereum contracts
- **Containerized Deployment**: Docker-based setup for consistent environments
- **Responsive UI**: Mobile-friendly interface built with Next.js
- **Zero-knowledge Authentication**: Privacy-preserving credential validation

## System Architecture

The system consists of three main layers:

1. **Blockchain Layer** (Ethereum/Ganache)
   - Provides immutable storage for all election data
   - Secures the voting process using consensus mechanisms
   - Maintains a public ledger of all transactions

2. **Smart Contract Layer** (Solidity)
   - `Voting.sol`: Manages elections, candidates, and vote recording
   - `CredentialManager.sol`: Handles voter wallet creation and authentication
   - Deployed and managed via Truffle framework

3. **Frontend Layer** (Next.js/Web3.js)
   - User interfaces for both administrators and voters
   - Web3.js integration for blockchain interaction
   - Real-time data visualization with Recharts

## Technology Stack

- **Blockchain**: Ethereum (Ganache for development)
- **Smart Contracts**: Solidity 0.8.x
- **Contract Framework**: Truffle
- **Frontend**: 
  - Next.js (React framework)
  - Web3.js (Ethereum interaction)
  - Recharts (Data visualization)
- **Authentication**: MetaMask wallet
- **Containerization**: Docker & Docker Compose
- **Development Tools**: 
  - Truffle Suite
  - Solidity compiler
  - Node.js

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [MetaMask](https://metamask.io/) browser extension
- [Node.js](https://nodejs.org/) (v14+ for local development outside Docker)
- Modern web browser (Chrome, Firefox, Edge)

## Installation & Setup

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/StilinskiAnas/E-Voting.git
   cd E-Voting
   ```

2. Make the reset script executable:
   ```bash
   chmod +x reset-blockchain.sh
   ```

3. Start the system:
   ```bash
   ./reset-blockchain.sh
   ```
   This script stops any running containers, removes volumes for a clean state, and rebuilds/starts all containers.

4. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)

### MetaMask Configuration

1. Install the MetaMask browser extension
2. Import the admin wallet using this private key:
   ```
   0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
   ```
3. Add a custom network with these settings:
   - Network Name: Local Blockchain
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

**Note:** Keep the admin wallet's private key secure. This wallet has administrative privileges in the e-voting system.

## Usage

### Administrator Guide

#### Managing Elections

1. **Creating an Election**:
   - Navigate to the Admin section
   - Click "Create New Election"
   - Fill in name, description, and optional start/end times
   - Click "Create Election"

2. **Adding Candidates**:
   - From "Manage Elections," find your election
   - Click "Add Candidates"
   - Enter candidate details and submit

3. **Starting/Ending Elections**:
   - Locate your election in the management dashboard
   - Click "Start Election" or "End Election" as needed

#### Managing Voter Credentials

1. **Creating Voter Wallets**:
   - Individual: Click "Generate New Wallet" in Credential Manager
   - Batch: Enter quantity and click "Generate Batch"
   
2. **Controlling Access**:
   - Activate/deactivate credentials as needed
   - Fund credentials with ETH for gas fees

3. **Distribution**:
   - Export credentials as CSV for secure distribution to voters

### Voter Guide

1. **Setting Up**:
   - Import your provided private key into MetaMask
   - Connect to the application with your wallet

2. **Voting**:
   - View available elections on the home page
   - Select an active election
   - Choose your preferred candidate
   - Confirm your vote through MetaMask

3. **Verification**:
   - Wait for transaction confirmation
   - View your vote on the blockchain explorer
   - Check real-time results in the election page

## Development

### Project Structure

```
e-voting-system/
├── blockchain/               # Ganache configuration
├── contracts/                # Solidity smart contracts
├── migrations/               # Truffle migration scripts
├── frontend/                 # Next.js application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── styles/           # CSS modules
│   │   └── utils/            # Helper functions
├── test/                     # Contract test files
├── docker-compose.yml        # Container orchestration
├── reset-blockchain.sh       # Utility script
└── truffle-config.js         # Truffle settings
```

### Local Development

1. Start the containers:
   ```bash
   docker compose up
   ```

2. For frontend development outside Docker:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. For smart contract development:
   ```bash
   # Run tests
   docker exec -it evoting-truffle truffle test
   
   # Deploy contracts after changes
   docker exec -it evoting-truffle truffle migrate --reset
   ```

## Security Considerations

- **Private Keys**: Never share private keys or commit them to version control
- **Wallet Security**: Use hardware wallets for production deployments
- **Smart Contract Audits**: Consider formal audits before production use
- **Gas Management**: Ensure sufficient funds for voter transactions

## Troubleshooting

### Common Issues

1. **Connection Problems**:
   - Verify MetaMask is connected to the correct network
   - Check that Docker containers are running properly

2. **Transaction Failures**:
   - Ensure wallet has sufficient ETH for gas
   - Verify credential is active and hasn't already voted

3. **System Reset**:
   - If experiencing persistent issues, run `./reset-blockchain.sh`
   - Note: This will reset all blockchain state

For more detailed troubleshooting, refer to the [Developer Guide](/docs/developer-guide.md).

## Contributing

We welcome contributions to improve the E-Voting system! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit pull requests, report issues, and suggest enhancements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

For more detailed documentation, please refer to:
- [Developer Guide](/docs/developer-guide.md)
- [User Guide](/docs/user-guide.md)
- [Technical Article](/docs/Article.md)
