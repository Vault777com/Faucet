// Script to run a relayer service for meta-transactions

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Configuration
const PORT = process.env.PORT || 3001;
const MAX_FEE_PER_GAS = hre.ethers.parseUnits("100", "gwei"); // Maximum fee per gas to use
const MAX_PRIORITY_FEE = hre.ethers.parseUnits("5", "gwei"); // Maximum priority fee to use

async function main() {
  console.log("Starting relayer service...");

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

  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn("Warning: Relayer balance is low. Consider funding the relayer account.");
  }

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

      // Ensure nonce is treated as a string to avoid BigInt conversion issues
      const nonceStr = nonce.toString();
      console.log(`Using nonce as string: ${nonceStr}`);
      
      // Convert to BigInt for contract interaction
      // Use ethers.js BigNumber for consistent handling
      const nonceBigNumber = hre.ethers.BigNumber.from(nonceStr);
      console.log(`Converted to BigNumber: ${nonceBigNumber.toString()}`);
      
      // Skip client-side signature verification for now
      // We'll let the contract handle the verification
      console.log("Skipping client-side signature verification...");
      console.log(`Signature: ${signature}`);
      
      // Just check if the signature is properly formatted
      if (!signature || typeof signature !== 'string' || !signature.startsWith('0x')) {
        return res.status(400).json({ error: "Invalid signature format" });
      }

      // Get current fee data
      const feeData = await hre.ethers.provider.getFeeData();
      
      // Calculate maxFeePerGas with a buffer to ensure it's higher than baseFee
      // Add 20% buffer to the current baseFee
      const baseFeeWithBuffer = feeData.lastBaseFeePerGas * BigInt(120) / BigInt(100);
      
      // Use the priority fee from network or our max, whichever is lower
      const priorityFee = feeData.maxPriorityFeePerGas > MAX_PRIORITY_FEE 
        ? MAX_PRIORITY_FEE 
        : feeData.maxPriorityFeePerGas;
      
      // Calculate maxFeePerGas as baseFee + priorityFee, but cap it at our maximum
      let maxFeePerGas = baseFeeWithBuffer + priorityFee;
      if (maxFeePerGas > MAX_FEE_PER_GAS) {
        maxFeePerGas = MAX_FEE_PER_GAS;
      }
      
      console.log(`Current baseFee: ${hre.ethers.formatUnits(feeData.lastBaseFeePerGas, "gwei")} gwei`);
      console.log(`Using maxFeePerGas: ${hre.ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);
      console.log(`Using maxPriorityFeePerGas: ${hre.ethers.formatUnits(priorityFee, "gwei")} gwei`);

      // Execute the meta-transaction with proper error handling
      console.log("Executing meta-transaction...");
      try {
        // Verify userAddress is a valid Ethereum address
        if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
          throw new Error("Invalid user address format");
        }
        
        // Log all parameters before calling the contract
        console.log(`Parameters for executeMetaTransaction:`);
        console.log(`- userAddress: ${userAddress}`);
        console.log(`- nonceBigNumber: ${nonceBigNumber.toString()}`);
        console.log(`- signature: ${signature}`);
        console.log(`- maxFeePerGas: ${hre.ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);
        console.log(`- maxPriorityFeePerGas: ${hre.ethers.formatUnits(priorityFee, "gwei")} gwei`);
        
        // Get the contract function directly
        const executeMetaTx = relayerContract.interface.getFunction("executeMetaTransaction");
        console.log(`Function signature: ${executeMetaTx.format()}`);
        
        // Encode the function call data
        const data = relayerContract.interface.encodeFunctionData(
          "executeMetaTransaction",
          [userAddress, nonceBigNumber, signature]
        );
        console.log(`Encoded function data: ${data}`);
        
        // Create and send the transaction manually
        const txRequest = {
          to: relayerAddress,
          data: data,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: priorityFee
        };
        
        console.log("Sending transaction with request:", JSON.stringify(txRequest, null, 2));
        const tx = await relayer.sendTransaction(txRequest);
        
        if (!tx) {
          throw new Error("Transaction returned undefined");
        }
        
        const txHash = tx.hash;
        console.log(`Transaction hash: ${txHash}`);
        res.json({ success: true, txHash: txHash });
        
        // Wait for the transaction to be mined
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.error("Error executing meta-transaction:", error);
        // Send error response if not already sent
        if (!res.headersSent) {
          res.status(500).json({ error: `Transaction execution failed: ${error.message}` });
        }
      }
    } catch (error) {
      console.error("Error executing meta-transaction:", error);
      res.status(500).json({ error: error.message });
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
