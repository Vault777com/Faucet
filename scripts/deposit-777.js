const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Load contract addresses
    const addressesPath = path.join(__dirname, '..', 'src', 'contract-addresses.json');
    if (!fs.existsSync(addressesPath)) {
      console.error('Contract addresses file not found. Please deploy the contracts first.');
      process.exit(1);
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    const faucetAddress = addresses.faucet;
    const daiAddress = addresses.token;

    if (faucetAddress === "0x45356Bd4749DdBB8cBcc7D4E0dDE94B30E94115f") {
      console.error('Faucet contract not deployed yet. Please deploy the contracts first.');
      process.exit(1);
    }

    console.log(`Faucet address: ${faucetAddress}`);
    console.log(`777 address: ${daiAddress}`);

    // Get the amount of 777 to deposit from command line arguments
    const amount = process.argv[2];
    if (!amount) {
      console.error('Please provide the amount of 777 to deposit as a command line argument.');
      console.error('Usage: npx hardhat run scripts/deposit-777.js --network sepolia <amount>');
      process.exit(1);
    }

    // Convert amount to wei (777 has 18 decimals)
    const amountInWei = hre.ethers.parseUnits(amount, 18);
    console.log(`Depositing ${amount} 777 (${amountInWei.toString()} wei) to the faucet...`);

    // Get the signer
    const [signer] = await hre.ethers.getSigners();
    console.log(`Using account: ${signer.address}`);

    // Get the 777 contract
    const dai = await hre.ethers.getContractAt("IERC20", daiAddress, signer);

    // Check 777 balance
    const balance = await dai.balanceOf(signer.address);
    console.log(`Your 777 balance: ${hre.ethers.formatUnits(balance, 18)} 777`);

    if (balance.lt(amountInWei)) {
      console.error(`Insufficient 777 balance. You need at least ${amount} 777.`);
      process.exit(1);
    }

    // Approve the faucet to spend 777
    console.log(`Approving the faucet to spend ${amount} 777...`);
    const approveTx = await dai.approve(faucetAddress, amountInWei);
    await approveTx.wait();
    console.log(`Approval transaction confirmed: ${approveTx.hash}`);

    // Get the faucet contract
    const faucet = await hre.ethers.getContractAt("Faucet", faucetAddress, signer);

    // Deposit 777 to the faucet
    console.log(`Depositing ${amount} 777 to the faucet...`);
    const depositTx = await faucet.depositTokens(amountInWei);
    await depositTx.wait();
    console.log(`Deposit transaction confirmed: ${depositTx.hash}`);

    // Check the faucet's 777 balance
    const faucetBalance = await dai.balanceOf(faucetAddress);
    console.log(`Faucet 777 balance: ${hre.ethers.formatUnits(faucetBalance, 18)} 777`);

    console.log('777 deposit completed successfully!');
  } catch (error) {
    console.error('Error depositing 777:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
