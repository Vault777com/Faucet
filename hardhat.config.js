require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    arbitrumSepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: 
        process.env.PRIVATE_KEY !== undefined && process.env.PRIVATE_KEY.length >= 64
          ? [process.env.PRIVATE_KEY]
          : [],
      chainId: 421614
    },
  },
  paths: {
    artifacts: "./src/artifacts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=421614",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  },
};
