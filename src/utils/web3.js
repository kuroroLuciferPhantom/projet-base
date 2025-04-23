// Utilitaires pour interagir avec Web3 et les wallets EVM
const ethers = require('ethers');

// Fonction pour valider une adresse Ethereum
const isValidEthereumAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Fonction pour vérifier une signature
const verifySignature = async (message, signature, address) => {
  try {
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Erreur lors de la vérification de la signature:', error);
    return false;
  }
};

// Génère un nonce aléatoire pour la signature
const generateNonce = () => {
  return Math.floor(Math.random() * 1000000000).toString();
};

// Message à signer
const getSignMessage = (nonce) => {
  return `Bienvenue sur CryptoCards!\n\nCette signature prouve que vous êtes le propriétaire de ce wallet.\n\nNonce: ${nonce}\nDate: ${new Date().toISOString()}`;
};

// Fonction pour obtenir les informations de la chaîne
const getChainInfo = async (chainId) => {
  const chains = {
    1: { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io' },
    42161: { name: 'Arbitrum One', explorer: 'https://arbiscan.io' },
    421613: { name: 'Arbitrum Goerli', explorer: 'https://goerli.arbiscan.io' },
    5: { name: 'Goerli Testnet', explorer: 'https://goerli.etherscan.io' },
  };
  
  return chains[chainId] || { name: 'Réseau inconnu', explorer: '#' };
};

module.exports = {
  isValidEthereumAddress,
  verifySignature,
  generateNonce,
  getSignMessage,
  getChainInfo
};