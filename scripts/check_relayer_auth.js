// Script to check if the relayer is properly authorized in the Faucet contract

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking relayer authorization status...");

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

  // Check if the relayer is authorized
  const isAuthorized = await faucet.authorizedRelayers(relayerAddress);
  console.log(`Relayer authorization status: ${isAuthorized ? "Authorized" : "Not authorized"}`);

  if (!isAuthorized) {
    console.log("The relayer is not authorized. Would you like to authorize it? (y/n)");
    // This is just a check script, so we don't actually authorize here
    console.log("To authorize the relayer, run the following command:");
    console.log(`npx hardhat run --network sepolia scripts/authorize_relayer.js`);
  } else {
    console.log("The relayer is properly authorized in the Faucet contract.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
