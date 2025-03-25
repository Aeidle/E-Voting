FROM node:16-alpine

WORKDIR /app

# Create package.json if it doesn't exist
RUN echo '{"name":"e-voting-frontend","version":"0.1.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start","lint":"next lint"},"dependencies":{"next":"12.3.1","react":"18.2.0","react-dom":"18.2.0","recharts":"2.5.0","web3":"1.8.0","papaparse":"5.4.1","qrcode.react":"3.1.0"},"devDependencies":{"eslint":"8.25.0","eslint-config-next":"12.3.1"}}' > /app/package.json

# Install dependencies
RUN npm install

# Create basic Next.js directory structure
RUN mkdir -p public src/components src/pages src/styles src/utils

# Expose the Next.js port
EXPOSE 3000

# Start the Next.js app in dev mode to enable hot reloading
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]