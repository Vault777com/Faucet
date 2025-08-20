// Contract addresses - these will be updated after deployment
let FAUCET_ADDRESS = "0x0000000000000000000000000000000000000000";
let TOKEN_ADDRESS = "0x816955F1c7a4aA4fc0eD3aF6E0521B2cf52B8E31";
let RELAYER_ADDRESS = "0x0000000000000000000000000000000000000000";

// Contract ABIs - these will be loaded from the artifacts directory
let faucetAbi;
let tokenAbi;
let relayerAbi;

// Network configuration
const NETWORK_ID = 421614; // Arbitrum Sepolia network ID
const NETWORK_NAME = "Arbitrum Sepolia";

// Global variables
let provider;
let signer;
let faucetContract;
let tokenContract;
let relayerContract;
let userAddress;
let cooldownEndTime = 0;
let cooldownInterval;
let currentNonce = 0;

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet');
const requestFundsBtn = document.getElementById('request-funds');
const requestViaRelayerBtn = document.getElementById('request-via-relayer');
const walletStatus = document.getElementById('wallet-status');
const walletAddressDisplay = document.getElementById('wallet-address');
const ethBalanceDisplay = document.getElementById('eth-balance');
const tokenBalanceDisplay = document.getElementById('token-balance');
const faucetAddressDisplay = document.getElementById('faucet-address');
const tokenAddressDisplay = document.getElementById('token-address');
const relayerAddressDisplay = document.getElementById('relayer-address');
const faucetVerifiedDisplay = document.getElementById('faucet-verified');
const tokenVerifiedDisplay = document.getElementById('token-verified');
const relayerVerifiedDisplay = document.getElementById('relayer-verified');
const transactionStatus = document.getElementById('transaction-status');
const statusMessage = document.getElementById('status-message');
const cooldownInfo = document.getElementById('cooldown-info');
const cooldownTimeDisplay = document.getElementById('cooldown-time');

// Display contract verification status
async function displayContractVerification(address, element) {
    if (address === "0x0000000000000000000000000000000000000000") {
        element.innerHTML = "";
        return;
    }
    
    const etherscanUrl = `https://sepolia.arbiscan.io/address/${address}#code`;
    
    try {
        // Note: This API call exposes the API key in the frontend. In production, 
        // you should use a backend proxy to keep your API key secure.
        // For now, we'll skip the API key requirement or use a public endpoint
        const apiUrl = `https://api.etherscan.io/v2/api?chainid=421614&module=contract&action=getabi&address=${address}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // If the API returns a valid ABI, the contract is verified
        const isVerified = data.status === "1" && data.result !== "Contract source code not verified";
        
        if (isVerified) {
            element.innerHTML = `<span class="verified">✓ Atherscan Verified</span> <a href="${etherscanUrl}" target="_blank">Review the contract on Arbiscan</a>`;
        } else {
            element.innerHTML = `<span class="unverified">⚠ Atherscan Unverified</span> <a href="${etherscanUrl}" target="_blank">Review the code on Arbiscan</a>`;
        }
    } catch (error) {
        console.error("Error checking contract verification:", error);
        element.innerHTML = `<span class="unverified">⚠ Verification status unknown</span> <a href="${etherscanUrl}" target="_blank">View on Etherscan</a>`;
    }
}

// Initialize the application
async function init() {
    try {
        // Load contract ABIs
        await loadContractAbis();
        
        // Display contract addresses
        faucetAddressDisplay.textContent = FAUCET_ADDRESS;
        tokenAddressDisplay.textContent = TOKEN_ADDRESS;
        relayerAddressDisplay.textContent = RELAYER_ADDRESS;
        
        // Display contract verification status
        displayContractVerification(FAUCET_ADDRESS, faucetVerifiedDisplay);
        displayContractVerification(TOKEN_ADDRESS, tokenVerifiedDisplay);
        displayContractVerification(RELAYER_ADDRESS, relayerVerifiedDisplay);
        
        // Check if MetaMask is installed
        if (window.ethereum) {
            // Create a new ethers provider
            provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if already connected
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                await connectWallet();
            }
            
            // Setup event listeners
            connectWalletBtn.addEventListener('click', connectWallet);
            requestFundsBtn.addEventListener('click', requestFunds);
            requestViaRelayerBtn.addEventListener('click', requestViaRelayer);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        } else {
            alert('MetaMask is not installed. Please install it to use this application: https://metamask.io/download.html');
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Load contract ABIs and addresses from the artifacts directory
async function loadContractAbis() {
    try {
        // Use standard ERC20 ABI for 777 token
        tokenAbi = [
            // ERC20 Standard Interface
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)",
            "function transfer(address to, uint amount) returns (bool)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            // Events
            "event Transfer(address indexed from, address indexed to, uint amount)",
            "event Approval(address indexed owner, address indexed spender, uint256 value)"
        ];
        
        // Define minimal Faucet ABI if we can't load the full one
        let minimalFaucetAbi = [
            "function requestFunds() external",
            "function requestFundsFor(address recipient) external",
            "function lastRequestTime(address user) external view returns (uint256)",
            "function cooldownPeriod() external view returns (uint256)",
            "function depositTokens(uint256 amount) external"
        ];
        
        // Define minimal FaucetRelayer ABI
        let minimalRelayerAbi = [
            "function executeMetaTransaction(address userAddress, uint256 nonce, bytes memory signature) external",
            "function getMessageHash(address userAddress, uint256 nonce) public view returns (bytes32)"
        ];
        
        // Try to fetch the Faucet contract artifact if available
        try {
            const faucetResponse = await fetch('./artifacts/contracts/Faucet.sol/Faucet.json');
            if (faucetResponse.ok) {
                const faucetData = await faucetResponse.json();
                faucetAbi = faucetData.abi;
            } else {
                console.warn('Could not load Faucet ABI from artifacts, using minimal ABI');
                faucetAbi = minimalFaucetAbi;
            }
        } catch (error) {
            console.warn('Error loading Faucet ABI from artifacts, using minimal ABI:', error);
            faucetAbi = minimalFaucetAbi;
        }
        
        // Try to fetch the FaucetRelayer contract artifact if available
        try {
            const relayerResponse = await fetch('./artifacts/contracts/FaucetRelayer.sol/FaucetRelayer.json');
            if (relayerResponse.ok) {
                const relayerData = await relayerResponse.json();
                relayerAbi = relayerData.abi;
            } else {
                console.warn('Could not load FaucetRelayer ABI from artifacts, using minimal ABI');
                relayerAbi = minimalRelayerAbi;
            }
        } catch (error) {
            console.warn('Error loading FaucetRelayer ABI from artifacts, using minimal ABI:', error);
            relayerAbi = minimalRelayerAbi;
        }
        
        // Try to load deployed addresses if available
        try {
            const addressesResponse = await fetch('./contract-addresses.json');
            if (addressesResponse.ok) {
                const addresses = await addressesResponse.json();
                if (addresses.faucet) FAUCET_ADDRESS = addresses.faucet;
                if (addresses.token) TOKEN_ADDRESS = addresses.token;
                if (addresses.relayer) RELAYER_ADDRESS = addresses.relayer;
                
                // Update verification status if elements are available
                if (faucetVerifiedDisplay) displayContractVerification(FAUCET_ADDRESS, faucetVerifiedDisplay);
                if (tokenVerifiedDisplay) displayContractVerification(TOKEN_ADDRESS, tokenVerifiedDisplay);
                if (relayerVerifiedDisplay) displayContractVerification(RELAYER_ADDRESS, relayerVerifiedDisplay);
            }
        } catch (error) {
            console.warn('Could not load deployed addresses:', error);
        }
        
        // If no token address is set, use the Arbitrum Sepolia token address
        if (TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
            TOKEN_ADDRESS = "0x816955F1c7a4aA4fc0eD3aF6E0521B2cf52B8E31"; // Arbitrum Sepolia token address
        }
    } catch (error) {
        console.error('Error loading contract ABIs:', error);
        alert('Failed to load contract information. Please make sure the contracts are deployed and the ABIs are available.');
        throw error;
    }
}

// Connect to the user's wallet
async function connectWallet() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        
        // Check if connected to the correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== NETWORK_ID) {
            alert(`Please connect to the ${NETWORK_NAME} network in your wallet.`);
            try {
                // Try to switch to the correct network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${NETWORK_ID.toString(16)}` }],
                });
            } catch (switchError) {
                console.error('Failed to switch network:', switchError);
                return;
            }
        }
        
        // Update UI
        walletStatus.textContent = 'Connected';
        walletStatus.classList.remove('not-connected');
        walletStatus.classList.add('connected');
        walletAddressDisplay.textContent = userAddress;
        connectWalletBtn.textContent = 'Wallet Connected';
        
        // Get signer and create contract instances
        signer = provider.getSigner();
        faucetContract = new ethers.Contract(FAUCET_ADDRESS, faucetAbi, signer);
        tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);
        
        // Create relayer contract instance if address is available
        if (RELAYER_ADDRESS !== "0x0000000000000000000000000000000000000000") {
            relayerContract = new ethers.Contract(RELAYER_ADDRESS, relayerAbi, signer);
            requestViaRelayerBtn.disabled = false;
        } else {
            requestViaRelayerBtn.disabled = true;
        }
        
        // Enable request funds button
        requestFundsBtn.disabled = false;
        
        // Update balances
        await updateBalances();
        
        // Check cooldown
        await checkCooldown();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        resetUI();
    } else if (accounts[0] !== userAddress) {
        // User switched accounts
        userAddress = accounts[0];
        walletAddressDisplay.textContent = userAddress;
        updateBalances();
        checkCooldown();
    }
}

// Reset UI when wallet is disconnected
function resetUI() {
    userAddress = null;
    walletStatus.textContent = 'Not Connected';
    walletStatus.classList.remove('connected');
    walletStatus.classList.add('not-connected');
    walletAddressDisplay.textContent = '';
    connectWalletBtn.textContent = 'Connect Wallet';
    requestFundsBtn.disabled = true;
    requestViaRelayerBtn.disabled = true;
    ethBalanceDisplay.textContent = '-';
    tokenBalanceDisplay.textContent = '-';
    cooldownInfo.classList.add('hidden');
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
}

// Update ETH and token balances
async function updateBalances() {
    if (!userAddress) return;
    
    try {
        // Get ETH balance
        const ethBalance = await provider.getBalance(userAddress);
        ethBalanceDisplay.textContent = `${ethers.utils.formatEther(ethBalance)} ETH`;
        
        // Get token balance if token contract is available
        if (tokenContract) {
            const decimals = await tokenContract.decimals();
            const tokenBalance = await tokenContract.balanceOf(userAddress);
            tokenBalanceDisplay.textContent = `${ethers.utils.formatUnits(tokenBalance, decimals)} 777`;
        }
    } catch (error) {
        console.error('Error updating balances:', error);
    }
}

// Check cooldown period
async function checkCooldown() {
    if (!userAddress || !faucetContract) return;
    
    try {
        const lastRequestTime = await faucetContract.lastRequestTime(userAddress);
        const cooldownPeriod = await faucetContract.cooldownPeriod();
        
        if (lastRequestTime.gt(0)) {
            const cooldownEnd = lastRequestTime.add(cooldownPeriod).toNumber() * 1000; // Convert to milliseconds
            cooldownEndTime = cooldownEnd;
            
            if (Date.now() < cooldownEnd) {
                // User is in cooldown period
                requestFundsBtn.disabled = true;
                requestViaRelayerBtn.disabled = true;
                cooldownInfo.classList.remove('hidden');
                updateCooldownTimer();
                
                // Set interval to update the cooldown timer
                if (cooldownInterval) {
                    clearInterval(cooldownInterval);
                }
                cooldownInterval = setInterval(updateCooldownTimer, 1000);
            } else {
                // Cooldown period is over
                requestFundsBtn.disabled = false;
                if (relayerContract) {
                    requestViaRelayerBtn.disabled = false;
                }
                cooldownInfo.classList.add('hidden');
                if (cooldownInterval) {
                    clearInterval(cooldownInterval);
                }
            }
        } else {
            // User has never requested funds
            requestFundsBtn.disabled = false;
            if (relayerContract) {
                requestViaRelayerBtn.disabled = false;
            }
            cooldownInfo.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking cooldown:', error);
    }
}

// Update the cooldown timer display
function updateCooldownTimer() {
    const now = Date.now();
    if (now >= cooldownEndTime) {
        // Cooldown period is over
        requestFundsBtn.disabled = false;
        if (relayerContract) {
            requestViaRelayerBtn.disabled = false;
        }
        cooldownInfo.classList.add('hidden');
        if (cooldownInterval) {
            clearInterval(cooldownInterval);
        }
        return;
    }
    
    // Calculate remaining time
    const remainingTime = cooldownEndTime - now;
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    
    // Update display
    cooldownTimeDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
}

// Request funds from the faucet
async function requestFunds() {
    if (!userAddress || !faucetContract) return;
    
    try {
        // Show transaction status
        transactionStatus.classList.remove('hidden');
        statusMessage.textContent = 'Processing transaction...';
        
        // Request funds from the faucet
        const tx = await faucetContract.requestFunds();
        
        // Update status message
        statusMessage.textContent = 'Transaction submitted. Waiting for confirmation...';
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Update status message
        statusMessage.textContent = 'Transaction confirmed! Refreshing page...';
        
        // Update balances
        await updateBalances();
        
        // Check cooldown
        await checkCooldown();
        
        // Hide transaction status after a delay and refresh the page
        setTimeout(() => {
            transactionStatus.classList.add('hidden');
        }, 3000);
        
        // Refresh the page 30 seconds after successful minting
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    } catch (error) {
        console.error('Error requesting funds:', error);
        
        // Update status message with error
        statusMessage.textContent = `Transaction failed: ${error.message}`;
        
        // Hide transaction status after a delay
        setTimeout(() => {
            transactionStatus.classList.add('hidden');
        }, 5000);
    }
}

// Relayer service URL - this should match the value in .env
const RELAYER_SERVICE_URL = "https://relayer.vault777.io";

// Request funds via the relayer (meta-transaction)
async function requestViaRelayer() {
    if (!userAddress || !relayerContract) return;
    
    try {
        // Show transaction status
        transactionStatus.classList.remove('hidden');
        statusMessage.textContent = 'Preparing meta-transaction...';
        
        // Generate a nonce using current timestamp
        const nonce = Date.now();
        console.log(`Using nonce: ${nonce}`);
        
        // Get the message hash from the relayer contract
        statusMessage.textContent = 'Getting message hash...';
        
        // Convert nonce to BigNumber for contract interaction
        const nonceBN = ethers.BigNumber.from(nonce.toString());
        const messageHash = await relayerContract.getMessageHash(userAddress, nonceBN);
        console.log(`Message hash: ${messageHash}`);
        
        // Sign the message hash
        statusMessage.textContent = 'Please sign the message in your wallet...';
        console.log(`About to sign message hash: ${messageHash}`);
        
        let signature;
        try {
            // Sign the message hash
            signature = await signer.signMessage(ethers.utils.arrayify(messageHash));
            console.log(`Signature generated: ${signature}`);
        } catch (error) {
            console.error("Error signing message:", error);
            throw new Error(`Failed to sign message: ${error.message}`);
        }
        
        // Send the meta-transaction to the relayer API
        statusMessage.textContent = 'Sending meta-transaction to relayer service...';
        console.log(`Sending to relayer: ${RELAYER_SERVICE_URL}/execute`);
        
        // Send the request to the relayer service
        console.log(`Parameters for relayer request:`);
        console.log(`- userAddress: ${userAddress}`);
        console.log(`- nonce: ${nonce}`);
        console.log(`- signature: ${signature}`);
        
        const response = await fetch(`${RELAYER_SERVICE_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userAddress: userAddress,
                nonce: nonce,
                signature: signature
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send meta-transaction to relayer');
        }
        
        const data = await response.json();
        
        // Update status message
        statusMessage.textContent = `Meta-transaction submitted. Transaction hash: ${data.txHash}`;
        
        // Wait a few seconds to allow the transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Update balances
        await updateBalances();
        
        // Check cooldown
        await checkCooldown();
        
        // Update status message
        statusMessage.textContent = 'Transaction processed! Refreshing page...';
        
        // Hide transaction status after a delay
        setTimeout(() => {
            transactionStatus.classList.add('hidden');
        }, 3000);
        
        // Refresh the page 30 seconds after successful minting
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    } catch (error) {
        console.error('Error requesting funds via relayer:', error);
        
        // Update status message with error
        statusMessage.textContent = `Meta-transaction failed: ${error.message}`;
        
        // Hide transaction status after a delay
        setTimeout(() => {
            transactionStatus.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
