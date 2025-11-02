# Use Node.js 22 LTS as base image
FROM node:22-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create artifacts directory if it doesn't exist
RUN mkdir -p src/artifacts

# Expose ports for both services
EXPOSE 3001 3000

# Set environment variables
ENV NODE_ENV=production
ENV HARDHAT_NETWORK=arbitrumSepolia

# Default command (can be overridden)
CMD ["npm", "run", "relayer"]
