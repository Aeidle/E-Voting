// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract CredentialManager {
    // Admin address
    address public admin;
    
    // Struct to store voter credentials
    struct VoterCredential {
        address walletAddress;
        bool isActive;         // Whether this credential is active for voting
        uint createdAt;        // When this credential was created
    }
    
    // Array to store all credentials
    VoterCredential[] public credentials;
    
    // Mapping from wallet address to index in the credentials array
    mapping(address => uint) private walletToIndex;
    
    // Mapping to track if a wallet is registered
    mapping(address => bool) private registeredWallets;
    
    // Events
    event CredentialCreated(address indexed wallet);
    event CredentialsCreatedBatch(uint count);
    event CredentialUpdated(address indexed wallet, bool isActive);
    event FundsAdded(address indexed wallet, uint amount);
    event FundsAddedBatch(uint totalAmount, uint walletCount);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier walletExists(address wallet) {
        require(registeredWallets[wallet], "Wallet does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        admin = msg.sender;
    }
    
    // Create a new credential
    function createCredential(address wallet) public onlyAdmin {
        require(!registeredWallets[wallet], "Wallet already registered");
        
        credentials.push(VoterCredential({
            walletAddress: wallet,
            isActive: true,
            createdAt: block.timestamp
        }));
        
        uint index = credentials.length - 1;
        walletToIndex[wallet] = index;
        registeredWallets[wallet] = true;
        
        emit CredentialCreated(wallet);
    }
    
    // Create multiple credentials in batch
    function createCredentialsBatch(address[] memory wallets) public onlyAdmin {
        for (uint i = 0; i < wallets.length; i++) {
            if (!registeredWallets[wallets[i]]) {
                credentials.push(VoterCredential({
                    walletAddress: wallets[i],
                    isActive: true,
                    createdAt: block.timestamp
                }));
                
                uint index = credentials.length - 1;
                walletToIndex[wallets[i]] = index;
                registeredWallets[wallets[i]] = true;
            }
        }
        
        emit CredentialsCreatedBatch(wallets.length);
    }
    
    // Update a credential's active status
    function updateCredentialStatus(address wallet, bool isActive) 
        public 
        onlyAdmin 
        walletExists(wallet) 
    {
        uint index = walletToIndex[wallet];
        credentials[index].isActive = isActive;
        
        emit CredentialUpdated(wallet, isActive);
    }
    
    // Update multiple credentials' statuses in batch
    function updateCredentialsStatusBatch(address[] memory wallets, bool isActive) 
        public 
        onlyAdmin 
    {
        for (uint i = 0; i < wallets.length; i++) {
            if (registeredWallets[wallets[i]]) {
                uint index = walletToIndex[wallets[i]];
                credentials[index].isActive = isActive;
                
                emit CredentialUpdated(wallets[i], isActive);
            }
        }
    }
    
    // Add funds to a wallet
    function addFunds(address wallet) 
        public 
        payable 
        onlyAdmin 
        walletExists(wallet) 
    {
        require(msg.value > 0, "Must send some ETH");
        
        // Transfer ETH to the wallet
        (bool success, ) = wallet.call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit FundsAdded(wallet, msg.value);
    }
    
    // Add funds to multiple wallets in batch
    function addFundsBatch(address[] memory wallets) 
        public 
        payable 
        onlyAdmin 
    {
        require(msg.value > 0, "Must send some ETH");
        require(wallets.length > 0, "Must provide at least one wallet");
        
        uint amountPerWallet = msg.value / wallets.length;
        require(amountPerWallet > 0, "Amount per wallet too small");
        
        uint totalSent = 0;
        uint walletCount = 0;
        
        for (uint i = 0; i < wallets.length; i++) {
            if (registeredWallets[wallets[i]]) {
                (bool success, ) = wallets[i].call{value: amountPerWallet}("");
                if (success) {
                    totalSent += amountPerWallet;
                    walletCount++;
                    emit FundsAdded(wallets[i], amountPerWallet);
                }
            }
        }
        
        // Return any unsent funds to admin
        if (msg.value > totalSent) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalSent}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit FundsAddedBatch(totalSent, walletCount);
    }
    
    // Check if a credential is active for voting
    function isActiveCredential(address wallet) public view returns (bool) {
        if (!registeredWallets[wallet]) {
            return false;
        }
        
        uint index = walletToIndex[wallet];
        return credentials[index].isActive;
    }
    
    // Get the total number of credentials
    function getCredentialCount() public view returns (uint) {
        return credentials.length;
    }
    
    // Get wallet details
    function getCredentialDetails(address wallet) 
        public 
        view 
        walletExists(wallet) 
        returns (
            bool isActive,
            uint createdAt,
            uint balance
        ) 
    {
        uint index = walletToIndex[wallet];
        VoterCredential memory cred = credentials[index];
        
        return (
            cred.isActive,
            cred.createdAt,
            wallet.balance
        );
    }
    
    // Get credential details by index
    function getCredentialByIndex(uint index) 
        public 
        view 
        returns (
            address walletAddress,
            bool isActive,
            uint createdAt,
            uint balance
        ) 
    {
        require(index < credentials.length, "Index out of bounds");
        
        VoterCredential memory cred = credentials[index];
        
        return (
            cred.walletAddress,
            cred.isActive,
            cred.createdAt,
            cred.walletAddress.balance
        );
    }
    
    // Get multiple credentials - paginated
    function getCredentials(uint start, uint count) 
        public 
        view 
        returns (
            address[] memory walletAddresses,
            bool[] memory activeStatuses,
            uint[] memory createdAts,
            uint[] memory balances
        ) 
    {
        // Adjust count if it would exceed array bounds
        if (start >= credentials.length) {
            // Return empty arrays if start is out of bounds
            walletAddresses = new address[](0);
            activeStatuses = new bool[](0);
            createdAts = new uint[](0);
            balances = new uint[](0);
            return (walletAddresses, activeStatuses, createdAts, balances);
        }
        
        uint end = start + count;
        if (end > credentials.length) {
            end = credentials.length;
        }
        
        uint resultCount = end - start;
        
        walletAddresses = new address[](resultCount);
        activeStatuses = new bool[](resultCount);
        createdAts = new uint[](resultCount);
        balances = new uint[](resultCount);
        
        for (uint i = 0; i < resultCount; i++) {
            uint credIndex = start + i;
            VoterCredential memory cred = credentials[credIndex];
            
            walletAddresses[i] = cred.walletAddress;
            activeStatuses[i] = cred.isActive;
            createdAts[i] = cred.createdAt;
            balances[i] = cred.walletAddress.balance;
        }
        
        return (walletAddresses, activeStatuses, createdAts, balances);
    }
    
    // Check if wallet is already registered
    function isWalletRegistered(address wallet) public view returns (bool) {
        return registeredWallets[wallet];
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}