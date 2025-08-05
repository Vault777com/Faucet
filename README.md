# Sepolia Testnet Faucet

A decentralized application (dApp) that allows users to request test ETH + specific ERC20 tokens on the Sepolia Ethereum testnet.

## Features

- Request 0.1 ETH and 100 ERC20 tokens
- 24-hour cooldown period between requests
- MetaMask integration for wallet connection
- Responsive UI for desktop and mobile devices
- Meta-transaction support for users without ETH (gasless transactions)
- Automatic page refresh (30 seconds after successful transactions)
- Contract verification status with direct Etherscan links

## Project Structure

```
faucet/
├── contracts/                # Smart contracts
│   ├── Faucet.sol            # Faucet contract that dispenses ETH and ERC20 tokens
│   └── FaucetRelayer.sol     # Relayer contract for meta-transactions
├── scripts/                  # Deployment scripts
│   ├── deploy_faucet.js      # Script to deploy faucet contract
│   ├── deploy_relayer.js     # Script to deploy relayer contract
│   ├── run_relayer.js        # Script to run the relayer service
│   ├── save-addresses.js     # Script to save contract addresses for frontend
│   └── serve-frontend.js     # Simple HTTP server for the frontend
├── src/                      # Frontend files
│   ├── index.html            # Main HTML file
│   ├── styles.css            # CSS styles
│   └── app.js                # JavaScript for frontend
├── .env                      # Environment variables (not committed)
├── hardhat.config.js         # Hardhat configuration
└── README.md                 # Project documentation
```

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- MetaMask browser extension
- Sepolia testnet ETH for deployment (get from a public faucet)
- Your own ERC20 token on Sepolia for the faucet

## Setup and Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd faucet
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   TOKEN_ADDRESS=your_erc20_token_address_here
   ```
   Replace `YOUR_INFURA_KEY` with your Infura project ID, `your_private_key_here` with your Ethereum private key (without the 0x prefix), `your_etherscan_api_key_here` with your Etherscan API key for contract verification, and `your_erc20_token_address_here` with the address of your deployed ERC20 token on Sepolia.

## Deployment

### Deploy to Sepolia Testnet

1. Make sure you have Sepolia ETH in your deployment account.

2. Compile the contracts:
   ```
   npm run compile
   ```

3. Deploy the contracts to Sepolia:
   ```
   npm run deploy:faucet
   ```
   This will:
   - Deploy the Faucet contract using your specified ERC20 token on Sepolia
   - Fund the faucet with 1 ETH
   - Save the contract addresses to `src/contract-addresses.json` for the frontend
   - Verify the contract on Etherscan (if possible)

4. **Important**: After deployment, you need to deposit ERC20 tokens to the faucet contract:
   - Make sure you have some of your ERC20 tokens on Sepolia
   - Approve the faucet contract to spend your tokens
   - Call the `depositTokens` function on the faucet contract

### Local Development

1. Start a local Hardhat node:
   ```
   npm run node
   ```

2. In a new terminal, deploy the contracts to the local network:
   ```
   npm run deploy:local
   ```

3. Start the frontend server:
   ```
   npm run serve
   ```

4. Open your browser and navigate to `http://localhost:3000`.

### Additional Scripts

- `npm test` - Run the test suite
- `npm run deploy:relayer` - Deploy the relayer contract to Sepolia
- `npm run relayer` - Run the relayer service on Sepolia
- `npm run relayer:local` - Run the relayer service on the local network

## Contract Verification

The project is configured to automatically verify contracts on Etherscan after deployment to the Sepolia testnet. This makes the contract source code publicly viewable and verifiable on Etherscan.

### Prerequisites for Verification

1. Get an Etherscan API key:
   - Create an account on [Etherscan](https://etherscan.io/) if you don't have one
   - Go to [My API Keys](https://etherscan.io/myapikey) section
   - Create a new API key
   - Add the API key to your `.env` file as `ETHERSCAN_API_KEY`

### Automatic Verification

The deployment scripts (`deploy_faucet.js` and `deploy_relayer.js`) include code to automatically verify the contracts on Etherscan after deployment. This happens when:
- You're deploying to a public network (not localhost or hardhat)
- You have provided a valid Etherscan API key in your `.env` file

### Manual Verification

If automatic verification fails or you need to verify a contract manually, you can use the following command:

```
npx hardhat verify --network sepolia CONTRACT_ADDRESS CONSTRUCTOR_ARG1 CONSTRUCTOR_ARG2
```

For example, to verify the Faucet contract:
```
npx hardhat verify --network sepolia FAUCET_ADDRESS TOKEN_ADDRESS
```

To verify the FaucetRelayer contract:
```
npx hardhat verify --network sepolia RELAYER_ADDRESS FAUCET_ADDRESS
```

## Usage

1. Open the dApp in your browser.
2. Connect your MetaMask wallet by clicking the "Connect Wallet" button.
3. Make sure you're connected to the Sepolia testnet in MetaMask.
4. Request funds using one of the following methods:
   - **Standard Method**: Click the "Request Funds" button to receive 0.1 ETH and 100 ERC20 tokens. This requires you to have some ETH in your wallet to pay for gas.
   - **Gasless Method**: If you don't have any ETH for gas, click the "Request via Relayer" button. This will create a meta-transaction that is processed by a relayer service, which pays for the gas on your behalf.
5. Wait for the transaction to be confirmed.
6. The page will automatically refresh 30 seconds after a successful transaction to update all UI elements.
7. You can request funds again after the 24-hour cooldown period.

## UI Features

### Contract Verification Status

The application displays verification status for each contract in the "Contract Information" section:

- A green checkmark (✓) indicates that the contract is verified on Etherscan
- A warning symbol (⚠) indicates that the contract is not verified
- Each contract address has a "View on Etherscan" link that takes users directly to the contract code on Etherscan

This feature helps users verify the authenticity of the contracts they're interacting with.

### Automatic Page Refresh

After a successful transaction (either through the standard method or via the relayer):

1. The transaction status overlay disappears after 3 seconds
2. The page automatically refreshes after 30 seconds

This ensures that all UI elements (balances, cooldown status, etc.) are properly updated after a transaction is processed, while still giving users time to see that their transaction was successful.

## Meta-Transactions

This faucet supports meta-transactions, which allow users without any ETH to request funds. Here's how it works:

1. The user signs a message with their private key (this doesn't require any ETH)
2. The signed message is sent to a relayer service
3. The relayer service verifies the signature and submits the transaction to the blockchain, paying for the gas
4. The faucet contract verifies that the relayer is authorized and dispenses funds to the user

To use this feature:
1. Deploy the relayer contract: `npm run deploy:relayer`
2. Run the relayer service: `npm run relayer`
3. Users can then click the "Request via Relayer" button in the UI

Note: The relayer service needs to be funded with ETH to pay for gas fees.

## Smart Contracts

### Faucet.sol

The main faucet contract that:
- Dispenses 0.1 ETH and 100 ERC20 tokens to users
- Enforces a 24-hour cooldown period between requests
- Allows the owner to fund the contract with ETH
- Allows anyone to deposit ERC20 tokens to the faucet
- Allows the owner to update the dispensed amounts and cooldown period
- Supports meta-transactions through authorized relayers

### FaucetRelayer.sol

The relayer contract that:
- Verifies signatures from users
- Executes meta-transactions on behalf of users
- Prevents replay attacks using nonces
- Calls the faucet contract to dispense funds to users

## License

This project is licensed under the MIT License.
