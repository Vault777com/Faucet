// Script to deploy the FaucetRelayer contract

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying FaucetRelayer contract...");

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
  if (!faucetAddress || faucetAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Faucet address not found or invalid. Deploy the Faucet contract first.");
    process.exit(1);
  }

  // Deploy the FaucetRelayer contract
  const FaucetRelayer = await hre.ethers.getContractFactory("FaucetRelayer");
  const relayer = await FaucetRelayer.deploy(faucetAddress);
  await relayer.waitForDeployment();
  const relayerAddress = await relayer.getAddress();

  console.log(`FaucetRelayer deployed to: ${relayerAddress}`);

  // Get the Faucet contract
  const Faucet = await hre.ethers.getContractFactory("Faucet");
  const faucet = await Faucet.attach(faucetAddress);

  // Authorize the relayer in the Faucet contract
  console.log("Authorizing relayer in the Faucet contract...");
  const tx = await faucet.setRelayerStatus(relayerAddress, true);
  await tx.wait();
  console.log("Relayer authorized successfully");

  // Update the contract addresses file
  contractAddresses.relayer = relayerAddress;
  fs.writeFileSync(
    path.join(__dirname, "../src/contract-addresses.json"),
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("Contract addresses updated");

  // Verify the contract on Etherscan if not on a local network
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await relayer.deploymentTransaction().wait(5); // Wait for 5 block confirmations

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: relayerAddress,
        constructorArguments: [faucetAddress],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }

  console.log("Deployment completed successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
