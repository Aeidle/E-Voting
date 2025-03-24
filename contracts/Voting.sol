// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Define an interface for the credential manager
interface CredentialManagerInterface {
    function isActiveCredential(address wallet) external view returns (bool);
    function isWalletRegistered(address wallet) external view returns (bool);
}

contract Voting {
    // Admin address
    address public admin;
    
    // Address of the credential manager contract
    address public credentialManagerAddress;
    
    // Election status enum
    enum ElectionStatus { Created, Active, Closed }
    
    // Model a Vote
    struct Vote {
        address voter;
        uint candidateId;
        uint timestamp;
    }
    
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        // Array of vote timestamps for this candidate
        uint[] voteTimes;
    }
    
    // Model an Election
    struct Election {
        uint id;
        string name;
        string description;
        uint startTime;
        uint endTime;
        ElectionStatus status;
        uint candidatesCount;
        mapping(uint => Candidate) candidates;
        mapping(address => bool) voters;
        uint totalVotes;
        // Array to store all votes with timestamps
        Vote[] votes;
    }
    
    // Store elections count
    uint public electionsCount;
    
    // Store all elections
    mapping(uint => Election) public elections;
    
    // List of active elections for easy access
    uint[] public activeElections;
    
    // Events
    event ElectionCreated(uint indexed electionId, string name);
    event CandidateAdded(uint indexed electionId, uint candidateId, string name);
    event ElectionStatusChanged(uint indexed electionId, ElectionStatus status);
    event Voted(uint indexed electionId, uint indexed candidateId, address voter, uint timestamp);
    
    // Constructor - set the admin
    constructor() {
        admin = msg.sender;
    }
    
    // Set the credential manager address - only admin can do this
    function setCredentialManager(address _manager) public onlyAdmin {
        credentialManagerAddress = _manager;
    }
    
    // Check if a credential is active and registered through the credential manager
    function isCredentialValid(address _wallet) public view returns (bool) {
        // If no credential manager is set, only admin can vote (for testing)
        if (credentialManagerAddress == address(0)) {
            return _wallet == admin;
        }
        
        // Interface for calling the credential manager
        CredentialManagerInterface cm = CredentialManagerInterface(credentialManagerAddress);
        
        // Check if wallet is registered AND active
        return cm.isWalletRegistered(_wallet) && cm.isActiveCredential(_wallet);
    }
    
    // Modifier to check if caller is admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    // Modifier to check if election exists
    modifier electionExists(uint _electionId) {
        require(_electionId > 0 && _electionId <= electionsCount, "Election does not exist");
        _;
    }
    
    // Modifier to check if election is active and within time constraints
    modifier electionIsActive(uint _electionId) {
        Election storage e = elections[_electionId];
        
        // Check election status
        require(e.status == ElectionStatus.Active, "Election is not active");
        
        // Check if election has started
        if (e.startTime > 0) {
            require(block.timestamp >= e.startTime, "Election has not started yet");
        }
        
        // Check if election has ended - but don't auto-close based on time
        // This prevents automatic status changes which can cause issues
        if (e.endTime > 0 && block.timestamp > e.endTime) {
            // Instead of changing status here, just revert with a message
            revert("Election voting period has ended");
        }
        
        _;
    }
    
    // Create a new election
    function createElection(
        string memory _name,
        string memory _description,
        uint _startTime,
        uint _endTime
    ) public onlyAdmin {
        // Input validation
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // If end time is provided, it should be after start time
        if (_endTime > 0 && _startTime > 0) {
            require(_endTime > _startTime, "End time must be after start time");
        }
        
        electionsCount++;
        
        // Create new election storage reference
        Election storage e = elections[electionsCount];
        e.id = electionsCount;
        e.name = _name;
        e.description = _description;
        e.startTime = _startTime;
        e.endTime = _endTime;
        e.status = ElectionStatus.Created;
        e.candidatesCount = 0;
        e.totalVotes = 0;
        
        emit ElectionCreated(electionsCount, _name);
    }
    
    // Add a candidate to an election
    function addCandidate(uint _electionId, string memory _name) 
        public 
        onlyAdmin 
        electionExists(_electionId) 
    {
        // Only add candidates to elections that are not closed
        require(elections[_electionId].status != ElectionStatus.Closed, "Cannot add candidates to closed election");
        
        Election storage e = elections[_electionId];
        e.candidatesCount++;
        
        // Create new candidate
        e.candidates[e.candidatesCount] = Candidate(e.candidatesCount, _name, 0, new uint[](0));
        
        emit CandidateAdded(_electionId, e.candidatesCount, _name);
    }
    
    // Start an election
    function startElection(uint _electionId) 
        public 
        onlyAdmin 
        electionExists(_electionId) 
    {
        Election storage e = elections[_electionId];
        
        require(e.status == ElectionStatus.Created, "Election must be in Created status");
        require(e.candidatesCount > 0, "Election must have at least one candidate");
        
        // If no start time was set, set it to now
        if (e.startTime == 0) {
            e.startTime = block.timestamp;
        }
        // If start time is in the future, don't change it
        // If start time is in the past, don't change it either
        
        e.status = ElectionStatus.Active;
        
        // Add to active elections
        activeElections.push(_electionId);
        
        emit ElectionStatusChanged(_electionId, ElectionStatus.Active);
    }
    
    // End an election
    function endElection(uint _electionId) 
        public 
        onlyAdmin 
        electionExists(_electionId) 
    {
        Election storage e = elections[_electionId];
        
        require(e.status == ElectionStatus.Active, "Election must be active to end");
        
        // Set status first to minimize the risk of out-of-gas errors
        e.status = ElectionStatus.Closed;
        
        // If end time is not set or is in the future, set it to now
        if (e.endTime == 0 || e.endTime > block.timestamp) {
            e.endTime = block.timestamp;
        }
        
        // Remove from active elections - this operation could fail if array is large
        // so we do it last
        removeFromActiveElections(_electionId);
        
        emit ElectionStatusChanged(_electionId, ElectionStatus.Closed);
    }
    
    // Helper function to remove election from active list
    function removeFromActiveElections(uint _electionId) private {
        for (uint i = 0; i < activeElections.length; i++) {
            if (activeElections[i] == _electionId) {
                // Move the last element to the position of the removed element
                activeElections[i] = activeElections[activeElections.length - 1];
                // Remove the last element
                activeElections.pop();
                break;
            }
        }
    }
    
    // Cast a vote in an election
    function vote(uint _electionId, uint _candidateId) 
        public 
        electionExists(_electionId)
        electionIsActive(_electionId)
    {
        // Check if credential is valid (registered and active)
        require(isCredentialValid(msg.sender), "Unauthorized: Wallet is not registered or not active");
        
        Election storage e = elections[_electionId];
        
        // Require that voter hasn't voted before in this election
        require(!e.voters[msg.sender], "Voter has already voted in this election");
        
        // Require a valid candidate
        require(_candidateId > 0 && _candidateId <= e.candidatesCount, "Invalid candidate ID");
        
        // Manual time checks to prevent automatic status changes
        if (e.startTime > 0) {
            require(block.timestamp >= e.startTime, "Election has not started yet");
        }
        
        if (e.endTime > 0 && block.timestamp > e.endTime) {
            revert("Election voting period has ended");
        }
        
        // Record that voter has voted
        e.voters[msg.sender] = true;
        
        // Update candidate vote count
        e.candidates[_candidateId].voteCount++;
        
        // Record the vote timestamp
        uint timestamp = block.timestamp;
        
        // Add timestamp to candidate's voteTimes array
        e.candidates[_candidateId].voteTimes.push(timestamp);
        
        // Add vote to election's votes array
        e.votes.push(Vote(msg.sender, _candidateId, timestamp));
        
        // Update total votes
        e.totalVotes++;
        
        // Trigger voted event
        emit Voted(_electionId, _candidateId, msg.sender, timestamp);
    }
    
    // Get candidate information from an election
    function getCandidate(uint _electionId, uint _candidateId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint id, string memory name, uint voteCount) 
    {
        require(_candidateId > 0 && _candidateId <= elections[_electionId].candidatesCount, "Invalid candidate ID");
        
        Candidate memory candidate = elections[_electionId].candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    
    // Get all candidates from an election
    function getAllCandidates(uint _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint[] memory ids, string[] memory names, uint[] memory voteCounts) 
    {
        Election storage e = elections[_electionId];
        uint count = e.candidatesCount;
        
        ids = new uint[](count);
        names = new string[](count);
        voteCounts = new uint[](count);
        
        for (uint i = 1; i <= count; i++) {
            Candidate memory candidate = e.candidates[i];
            ids[i-1] = candidate.id;
            names[i-1] = candidate.name;
            voteCounts[i-1] = candidate.voteCount;
        }
        
        return (ids, names, voteCounts);
    }
    
    // Get vote timestamps for a specific candidate
    function getCandidateVoteTimestamps(uint _electionId, uint _candidateId)
        public
        view
        electionExists(_electionId)
        returns (uint[] memory)
    {
        require(_candidateId > 0 && _candidateId <= elections[_electionId].candidatesCount, "Invalid candidate ID");
        
        return elections[_electionId].candidates[_candidateId].voteTimes;
    }
    
    // Get vote timestamps for all candidates
    function getAllVoteTimestamps(uint _electionId)
        public
        view
        electionExists(_electionId)
        returns (uint[] memory candidateIds, uint[] memory timestamps)
    {
        Election storage e = elections[_electionId];
        uint voteCount = e.totalVotes;
        
        candidateIds = new uint[](voteCount);
        timestamps = new uint[](voteCount);
        
        for (uint i = 0; i < voteCount; i++) {
            Vote memory v = e.votes[i];
            candidateIds[i] = v.candidateId;
            timestamps[i] = v.timestamp;
        }
        
        return (candidateIds, timestamps);
    }
    
    // Get election details
    function getElectionDetails(uint _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (
            string memory name,
            string memory description, 
            uint startTime,
            uint endTime,
            ElectionStatus status,
            uint candidatesCount,
            uint totalVotes
        ) 
    {
        Election storage e = elections[_electionId];
        return (
            e.name,
            e.description,
            e.startTime,
            e.endTime,
            e.status,
            e.candidatesCount,
            e.totalVotes
        );
    }
    
    // Check if a voter has voted in an election
    function hasVoted(uint _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId)
        returns (bool) 
    {
        return elections[_electionId].voters[_voter];
    }
    
    // Get all active elections
    function getActiveElections() public view returns (uint[] memory) {
        return activeElections;
    }
    
    // Get total number of elections
    function getElectionsCount() public view returns (uint) {
        return electionsCount;
    }
    
    // Check if caller is admin
    function isAdmin() public view returns (bool) {
        return msg.sender == admin;
    }
    
    // Get current blockchain timestamp
    function getCurrentTime() public view returns (uint) {
        return block.timestamp;
    }
}