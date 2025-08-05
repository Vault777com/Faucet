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
    console.log(`DAI address: ${daiAddress}`);

    // Get the amount of DAI to deposit from command line arguments
    const amount = process.argv[2];
    if (!amount) {
      console.error('Please provide the amount of DAI to deposit as a command line argument.');
      console.error('Usage: npx hardhat run scripts/deposit-dai.js --network sepolia <amount>');
      process.exit(1);
    }

    // Convert amount to wei (DAI has 18 decimals)
    const amountInWei = hre.ethers.parseUnits(amount, 18);
    console.log(`Depositing ${amount} DAI (${amountInWei.toString()} wei) to the faucet...`);

    // Get the signer
    const [signer] = await hre.ethers.getSigners();
    console.log(`Using account: ${signer.address}`);

    // Get the DAI contract
    const dai = await hre.ethers.getContractAt("IERC20", daiAddress, signer);

    // Check DAI balance
    const balance = await dai.balanceOf(signer.address);
    console.log(`Your DAI balance: ${hre.ethers.formatUnits(balance, 18)} DAI`);

    if (balance.lt(amountInWei)) {
      console.error(`Insufficient DAI balance. You need at least ${amount} DAI.`);
      process.exit(1);
    }

    // Approve the faucet to spend DAI
    console.log(`Approving the faucet to spend ${amount} DAI...`);
    const approveTx = await dai.approve(faucetAddress, amountInWei);
    await approveTx.wait();
    console.log(`Approval transaction confirmed: ${approveTx.hash}`);

    // Get the faucet contract
    const faucet = await hre.ethers.getContractAt("Faucet", faucetAddress, signer);

    // Deposit DAI to the faucet
    console.log(`Depositing ${amount} DAI to the faucet...`);
    const depositTx = await faucet.depositTokens(amountInWei);
    await depositTx.wait();
    console.log(`Deposit transaction confirmed: ${depositTx.hash}`);

    // Check the faucet's DAI balance
    const faucetBalance = await dai.balanceOf(faucetAddress);
    console.log(`Faucet DAI balance: ${hre.ethers.formatUnits(faucetBalance, 18)} DAI`);

    console.log('DAI deposit completed successfully!');
  } catch (error) {
    console.error('Error depositing DAI:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
