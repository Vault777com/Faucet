// Simplified script to run a relayer service for meta-transactions

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Configuration
const PORT = process.env.PORT || 3001;

async function main() {
  console.log("Starting simplified relayer service...");

  // Get the contract addresses
  let contractAddresses;
  try {
    const addressesPath = path.join(__dirname, "../src/contract-addresses.json");
    contractAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  } catch (error) {
    console.error("Error reading contract addresses:", error);
    process.exit(1);
  }

  const relayerAddress = contractAddresses.relayer;
  if (!relayerAddress || relayerAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Relayer address not found or invalid. Deploy the FaucetRelayer contract first.");
    process.exit(1);
  }

  // Get the signer (relayer account)
  const [relayer] = await hre.ethers.getSigners();
  const relayerAddr = await relayer.getAddress();
  console.log(`Relayer signer address: ${relayerAddr}`);
  console.log(`Relayer contract address: ${relayerAddress}`);

  // Get the relayer's balance
  const balance = await hre.ethers.provider.getBalance(relayerAddr);
  console.log(`Relayer balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Get the FaucetRelayer contract
  const FaucetRelayer = await hre.ethers.getContractFactory("FaucetRelayer");
  const relayerContract = await FaucetRelayer.attach(relayerAddress);

  // Create an Express app
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // Endpoint to execute a meta-transaction
  app.post("/execute", async (req, res) => {
    try {
      const { userAddress, nonce, signature } = req.body;

      if (!userAddress || !nonce || !signature) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      console.log(`Received meta-transaction request from ${userAddress} with nonce ${nonce}`);

      try {
        // Convert nonce to BigNumber safely
        let nonceBN;
        try {
          // Try ethers v6 approach
          nonceBN = hre.ethers.getBigInt(nonce.toString());
          console.log(`Using ethers v6 BigInt: ${nonceBN.toString()}`);
        } catch (e) {
          // Fallback to ethers v5 approach
          nonceBN = hre.ethers.BigNumber.from(nonce.toString());
          console.log(`Using ethers v5 BigNumber: ${nonceBN.toString()}`);
        }

        // Execute the transaction directly
        console.log("Executing meta-transaction...");
        console.log(`Parameters: userAddress=${userAddress}, nonce=${nonceBN.toString()}, signature=${signature}`);
        
        // Call the contract method
        const tx = await relayerContract.executeMetaTransaction(userAddress, nonceBN, signature);
        console.log(`Transaction hash: ${tx.hash}`);
        
        // Send success response
        res.json({ success: true, txHash: tx.hash });
        
        // Wait for confirmation
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.error("Error executing meta-transaction:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: `Transaction execution failed: ${error.message}` });
        }
      }
    } catch (error) {
      console.error("Error processing request:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Relayer service running on http://localhost:${PORT}`);
    console.log("Ready to process meta-transactions");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
