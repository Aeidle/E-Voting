module.exports = {
    networks: {
      development: {
        host: "ganache",
        port: 8545,
        network_id: "*", // Match any network id
        gas: 5000000
      }
    },
    compilers: {
      solc: {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  };