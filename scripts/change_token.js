const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    // Read the faucet address from the saved file
    let addresses;
    try {
        addresses = JSON.parse(fs.readFileSync('faucet-addresses.json', 'utf8'));
    } catch (error) {
        console.error("Could not read faucet-addresses.json. Make sure you've deployed the faucet first.");
        process.exit(1);
    }
    
    const faucetAddress = addresses.faucet;
    console.log("Connecting to Faucet at:", faucetAddress);
    
    // Get the deployer account (should be the owner)
    const [owner] = await ethers.getSigners();
    console.log("Using account:", owner.address);
    
    // Connect to the deployed faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetAddress);
    
    // Get current token address
    const currentToken = await faucet.getTokenAddress();
    console.log("Current token address:", currentToken);
    
    // Example: Change to a new token address
    // Replace this with your actual new token address
    const newTokenAddress = process.argv[2];
    
    if (!newTokenAddress) {
        console.log("Usage: npx hardhat run scripts/change_token.js --network <network> <new_token_address>");
        console.log("Example: npx hardhat run scripts/change_token.js --network localhost 0x1234567890123456789012345678901234567890");
        process.exit(1);
    }
    
    console.log("Changing token address to:", newTokenAddress);
    
    // Change the token address
    const tx = await faucet.setTokenAddress(newTokenAddress);
    await tx.wait();
    
    console.log("Token address changed successfully!");
    console.log("Transaction hash:", tx.hash);
    
    // Verify the change
    const updatedToken = await faucet.getTokenAddress();
    console.log("New token address:", updatedToken);
    
    // Update the saved addresses file
    addresses.currentToken = newTokenAddress;
    addresses.previousToken = currentToken;
    fs.writeFileSync('faucet-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("Updated addresses saved to faucet-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
