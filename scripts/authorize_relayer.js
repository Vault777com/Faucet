// Script to authorize the relayer in the Faucet contract

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Authorizing relayer in the Faucet contract...");

  // Get the contract addresses
  let contractAddresses;
  try {
    const addressesPath = path.join(__dirname, "../src/contract-addresses.json");
    contractAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  } catch (error) {
    console.error("Error reading contract addresses:", error);
    process.exit(1);
  }

  const faucetAddress = contractAddresses.faucet;
  const relayerAddress = contractAddresses.relayer;

  if (!faucetAddress || faucetAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Faucet address not found or invalid.");
    process.exit(1);
  }

  if (!relayerAddress || relayerAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Relayer address not found or invalid.");
    process.exit(1);
  }

  console.log(`Faucet address: ${faucetAddress}`);
  console.log(`Relayer address: ${relayerAddress}`);

  // Get the Faucet contract
  const Faucet = await hre.ethers.getContractFactory("Faucet");
  const faucet = await Faucet.attach(faucetAddress);

  // Check if the relayer is already authorized
  const isAuthorized = await faucet.authorizedRelayers(relayerAddress);
  
  if (isAuthorized) {
    console.log("The relayer is already authorized in the Faucet contract.");
    return;
  }

  // Authorize the relayer
  console.log("Authorizing the relayer...");
  const tx = await faucet.setRelayerStatus(relayerAddress, true);
  console.log(`Transaction hash: ${tx.hash}`);
  
  console.log("Waiting for transaction confirmation...");
  await tx.wait();
  
  // Verify the authorization was successful
  const isAuthorizedNow = await faucet.authorizedRelayers(relayerAddress);
  if (isAuthorizedNow) {
    console.log("Relayer successfully authorized in the Faucet contract.");
  } else {
    console.error("Failed to authorize the relayer. Please check the transaction.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
