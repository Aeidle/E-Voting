FROM trufflesuite/ganache-cli:latest

WORKDIR /app

# Expose the default Ganache port
EXPOSE 8545

# Run Ganache with predefined accounts and settings
CMD ["--host", "0.0.0.0", "--port", "8545", "--networkId", "1337", "--deterministic", "--mnemonic", "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"]

# Use --db /tmp/ganache to clear between restarts ERROR
# Add the --db.force flag to always start with a new blockchain
# CMD ["--host", "0.0.0.0", "--port", "8545", "--networkId", "1337", "--deterministic", "--db", "/tmp/ganache", "--db.force", "--mnemonic", "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"]


# Use --time option to set a specific timestamp (e.g., current time)
# and ensure consistent behavior
# CMD ["--host", "0.0.0.0", "--port", "8545", "--networkId", "1337", "--deterministic", "--mnemonic", "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat", "--blockTime", "1"]