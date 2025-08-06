const hre = require("hardhat");
const saveAddresses = require("./save-addresses");

// Get the token address from environment variable or use the specified address
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "0x15aa4Ec104760f0ce061FbA4d92e231a06ace5d";

async function main() {
  console.log("Starting deployment process...");

  console.log(`Using ERC20 token at: ${TOKEN_ADDRESS}`);

  // Deploy the Faucet contract with the token address
  console.log("Deploying Faucet contract...");
  const Faucet = await hre.ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(TOKEN_ADDRESS);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log(`Faucet deployed to: ${faucetAddress}`);

  // Wait for a few block confirmations
  console.log("Waiting for faucet contract confirmations...");
  await faucet.deploymentTransaction().wait(3);
  console.log("Faucet contract confirmed!");

  // Fund the faucet with some ETH
  console.log("Funding faucet with ETH...");
  const fundAmount = hre.ethers.parseEther("1.0"); // Fund with 1 ETH
  const signer = await hre.ethers.provider.getSigner();
  const fundTx = await signer.sendTransaction({
    to: faucetAddress,
    value: fundAmount
  });
  await fundTx.wait();
  console.log(`Faucet funded with ${hre.ethers.formatEther(fundAmount)} ETH`);

  // Save contract addresses for the frontend
  console.log("Saving contract addresses for frontend...");
  await saveAddresses(faucetAddress, TOKEN_ADDRESS);

  // Save the address for later use
  const fs = require('fs');
  const addresses = {
    faucet: faucetAddress,
    token: TOKEN_ADDRESS,
    deployer: (await hre.ethers.provider.getSigner()).address
  };
  
  fs.writeFileSync('faucet-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to faucet-addresses.json");

  // Verify contract on Etherscan if not on a local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: faucetAddress,
        constructorArguments: [TOKEN_ADDRESS],
      });
      console.log("Faucet contract verified on Etherscan!");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }

  console.log("Deployment completed successfully!");
  console.log("------------------------------------");
  console.log(`ERC20 Token: ${TOKEN_ADDRESS}`);
  console.log(`Faucet: ${faucetAddress}`);
  console.log("------------------------------------");
  console.log("NOTE: You can now change the token address using setTokenAddress() function");
  console.log("or deposit tokens using the depositTokens function.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
