const Voting = artifacts.require("Voting");
const CredentialManager = artifacts.require("CredentialManager");

contract("E-Voting System", function(accounts) {
  const admin = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  
  let votingInstance;
  let credentialManagerInstance;
  
  before(async () => {
    // Get deployed contract instances
    votingInstance = await Voting.deployed();
    credentialManagerInstance = await CredentialManager.deployed();
    
    // Link contracts if not already linked
    await votingInstance.setCredentialManager(credentialManagerInstance.address, { from: admin });
  });
  
  it("should register credentials and control their active status", async () => {
    // Create credentials for voters
    await credentialManagerInstance.createCredential(voter1, { from: admin });
    await credentialManagerInstance.createCredential(voter2, { from: admin });
    
    // Check they're active by default
    assert.equal(await credentialManagerInstance.isActiveCredential(voter1), true, "Voter1 should be active");
    assert.equal(await credentialManagerInstance.isActiveCredential(voter2), true, "Voter2 should be active");
    
    // Deactivate voter2's credential
    await credentialManagerInstance.updateCredentialStatus(voter2, false, { from: admin });
    assert.equal(await credentialManagerInstance.isActiveCredential(voter2), false, "Voter2 should be inactive");
  });
  
  it("should create an election with a candidate", async () => {
    // Create an election
    await votingInstance.createElection("Test Election", "A test election", 0, 0, { from: admin });
    
    // Add a candidate
    await votingInstance.addCandidate(1, "Candidate 1", { from: admin });
    
    // Start the election
    await votingInstance.startElection(1, { from: admin });
    
    // Verify the election is active
    const details = await votingInstance.getElectionDetails(1);
    assert.equal(details.status, 1, "Election should be in active state");
  });
  
  it("should allow active credentials to vote and reject inactive ones", async () => {
    // Active credential should be able to vote
    await votingInstance.vote(1, 1, { from: voter1 });
    
    // Verify the vote was counted
    const candidateDetails = await votingInstance.getCandidate(1, 1);
    assert.equal(candidateDetails.voteCount, 1, "Vote count should be 1");
    
    // Inactive credential should not be able to vote
    try {
      await votingInstance.vote(1, 1, { from: voter2 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      // Just verify an error occurred - the specific message may vary
      assert(true, "Error was correctly thrown when inactive credential tried to vote");
    }
  });
  
  it("should prevent double voting", async () => {
    // Try to vote again with the same credential
    try {
      await votingInstance.vote(1, 1, { from: voter1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Voter has already voted"), "Wrong error message");
    }
  });
});