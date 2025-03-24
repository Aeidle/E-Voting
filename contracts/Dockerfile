FROM node:16-alpine

WORKDIR /app

# Install netcat and git for npm dependencies
RUN apk add --no-cache netcat-openbsd git

# Install Truffle globally
RUN npm install -g truffle

# Create a basic package.json if one doesn't exist or is invalid
RUN echo '{"name":"e-voting-blockchain","version":"1.0.0","description":"Blockchain-based e-voting system","main":"truffle-config.js","dependencies":{"@truffle/hdwallet-provider":"^2.0.15"},"devDependencies":{"truffle":"^5.6.3"}}' > /app/package.json

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY ./contracts ./contracts
COPY ./migrations ./migrations
COPY ./truffle-config.js ./truffle-config.js
COPY ./test ./test

# Wait for Ganache and then migrate contracts
CMD ["sh", "-c", "while ! nc -z ganache 8545; do sleep 1; done && truffle migrate --reset && tail -f /dev/null"]