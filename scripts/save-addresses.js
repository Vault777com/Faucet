const fs = require('fs');
const path = require('path');

// Function to save contract addresses to a JSON file
async function saveAddresses(faucetAddress, tokenAddress) {
  try {
    const addresses = {
      faucet: faucetAddress,
      token: tokenAddress
    };

    // Create the JSON content
    const jsonContent = JSON.stringify(addresses, null, 2);

    // Define the output path (in the src directory for frontend access)
    const outputPath = path.join(__dirname, '..', 'src', 'contract-addresses.json');

    // Write the file
    fs.writeFileSync(outputPath, jsonContent);
    console.log(`Contract addresses saved to ${outputPath}`);
  } catch (error) {
    console.error('Error saving contract addresses:', error);
  }
}

// If this script is run directly
if (require.main === module) {
  // Check if addresses were provided as command line arguments
  if (process.argv.length >= 4) {
    const faucetAddress = process.argv[2];
    const tokenAddress = process.argv[3];
    saveAddresses(faucetAddress, tokenAddress);
  } else {
    console.error('Usage: node save-addresses.js <faucet-address> <token-address>');
    process.exit(1);
  }
}

module.exports = saveAddresses;
