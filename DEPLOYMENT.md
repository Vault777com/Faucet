# Collify Deployment Guide

This guide explains how to deploy the Vault777 Faucet relayer and Telegram bot services using Docker Compose on Collify.

## Prerequisites

1. **Docker and Docker Compose** installed on your server
2. **External PostgreSQL database** (already configured)
3. **Environment variables** configured
4. **Contract addresses** deployed and available in `src/contract-addresses.json`

## Services

The deployment includes two main services:

### 1. Relayer Service (Port 3000)
- Handles meta-transaction execution
- Provides REST API endpoint at `/execute`
- Validates user balances on Arbitrum Mainnet
- Executes transactions on Arbitrum Sepolia

### 2. Telegram Bot Service (Port 3001)
- Provides faucet functionality via Telegram
- Distributes 0.01 ETH per claim
- Enforces 24-hour cooldown period
- Connects to external PostgreSQL database

## Quick Start

### 1. Configure Environment Variables

Copy the Docker environment template and configure your values:

```bash
cp .env.docker .env
```

Edit `.env` with your actual values:
- `SEPOLIA_URL`: Your Arbitrum Sepolia RPC URL
- `PRIVATE_KEY`: Your relayer account private key
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `DATABASE_URL`: Your external PostgreSQL connection string
- `ETHERSCAN_API_KEY`: Your Etherscan API key

### 2. Prepare Contract Addresses

Ensure `src/contract-addresses.json` contains the deployed contract addresses:

```json
{
  "faucet": "0x...",
  "relayer": "0x..."
}
```

### 3. Deploy Services

Build and start both services:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Verify Deployment

Test the relayer service:
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x...","nonce":1,"signature":"0x..."}'
```

Test the Telegram bot by sending `/start` to your bot.

## Service Management

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f relayer
docker-compose logs -f telegram-bot
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart relayer
docker-compose restart telegram-bot
```

### Update Services
```bash
# Pull latest code and rebuild
git pull
docker-compose build --no-cache
docker-compose up -d
```

## Health Checks

Both services include health checks:

- **Relayer**: Checks `/execute` endpoint availability
- **Telegram Bot**: Basic process health check

Health status can be viewed with:
```bash
docker-compose ps
```

## Environment Variables

### Required Variables
- `SEPOLIA_URL`: Arbitrum Sepolia RPC URL
- `PRIVATE_KEY`: Relayer account private key
- `TELEGRAM_BOT_TOKEN`: Telegram bot API token
- `DATABASE_URL`: PostgreSQL connection string

### Optional Variables
- `ARBITRUM_MAINNET_RPC`: Mainnet RPC for balance validation (default: https://arb1.arbitrum.io/rpc)
- `ETHERSCAN_API_KEY`: For contract verification
- `ARBISCAN_API_KEY`: For Arbitrum contract verification

## Ports

- **3000**: Relayer service API
- **3001**: Telegram bot service (health check port)

## Networking

Services communicate through a shared Docker network (`faucet-network`) for secure inter-service communication.

## Troubleshooting

### Common Issues

1. **Contract addresses not found**
   - Ensure `src/contract-addresses.json` exists and contains valid addresses
   - Deploy contracts first using the deployment scripts

2. **Database connection failed**
   - Verify `DATABASE_URL` is correct and accessible
   - Ensure your external PostgreSQL allows connections from the Docker container

3. **Insufficient funds**
   - Ensure the relayer account has sufficient ETH for gas fees
   - Check balance on Arbitrum Sepolia

4. **Telegram bot not responding**
   - Verify `TELEGRAM_BOT_TOKEN` is valid
   - Check bot is properly configured in Telegram

### Debug Commands

```bash
# Enter container shell
docker-compose exec relayer sh
docker-compose exec telegram-bot sh

# View real-time logs
docker-compose logs -f --tail=100

# Check container resources
docker stats
```

## Security Considerations

1. **Private Key Security**: Never commit `.env` files to version control
2. **Database Security**: Use SSL connections for PostgreSQL
3. **Network Security**: Consider using reverse proxy with SSL termination
4. **Access Control**: Implement proper firewall rules

## Monitoring

Monitor the following metrics:
- Service health status
- API response times
- Database connection health
- Transaction success rates
- Error rates in logs

## Backup

Regularly backup:
- Environment configuration (`.env`)
- Contract addresses
- Database schema and data
- Application logs
