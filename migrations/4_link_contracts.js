const Voting = artifacts.require("Voting");
const CredentialManager = artifacts.require("CredentialManager");

module.exports = function(deployer, network, accounts) {
  // Link the credential manager to the voting contract
  deployer.then(async () => {
    try {
      const votingInstance = await Voting.deployed();
      const credentialManagerInstance = await CredentialManager.deployed();
      
      // Set the credential manager address in the voting contract
      await votingInstance.setCredentialManager(credentialManagerInstance.address);
      console.log('Voting contract linked to Credential Manager at address:', credentialManagerInstance.address);
    } catch (error) {
      console.error('Error linking contracts:', error);
    }
  });
};