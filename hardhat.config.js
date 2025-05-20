// SPDX-License-Identifier: MIT
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      chainId: 31337,
    },
    // Configuration pour Base Sepolia (testnet)
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000
    },
    // Configuration pour Base Goerli (testnet) - gardée pour compatibilité
    baseGoerli: {
      url: process.env.BASE_GOERLI_URL || "https://goerli.base.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 84531,
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000
    },
    // Configuration pour Base Mainnet
    baseMainnet: {
      url: process.env.BASE_MAINNET_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: "auto", 
      gas: "auto",
      timeout: 60000
    },
    // Configurations d'origine pour Arbitrum
    arbitrumGoerli: {
      url: process.env.ARBITRUM_GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      // Pour vérifier les contrats sur Basescan
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      baseGoerli: process.env.BASESCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      // Configurations d'origine pour Arbitrum
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "baseGoerli",
        chainId: 84531,
        urls: {
          apiURL: "https://api-goerli.basescan.org/api",
          browserURL: "https://goerli.basescan.org"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};