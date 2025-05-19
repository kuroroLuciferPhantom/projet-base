// Exemple de dApp simple pour interagir avec les contrats EFC sur Base Sepolia
// Placez ce fichier dans public/js/

// Configuration des réseaux
const networkConfigs = {
  baseSepolia: {
    chainId: '0x14A34', // 84532 en hexadécimal
    chainName: 'Base Sepolia',
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  baseGoerli: {
    chainId: '0x14A33', // 84531 en hexadécimal
    chainName: 'Base Goerli',
    rpcUrls: ['https://goerli.base.org'],
    blockExplorerUrls: ['https://goerli.basescan.org'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

// Adresses des contrats (à remplacer par les adresses réelles après déploiement)
const contractAddresses = {
  baseSepolia: {
    EFCToken: '0x123...', // Remplacer par l'adresse réelle
    EFCCard: '0x456...', // Remplacer par l'adresse réelle
    EFCBooster: '0x789...' // Remplacer par l'adresse réelle
  },
  baseGoerli: {
    EFCToken: '0xabc...', // Remplacer par l'adresse réelle
    EFCCard: '0xdef...', // Remplacer par l'adresse réelle
    EFCBooster: '0xghi...' // Remplacer par l'adresse réelle
  }
};

// ABIs des contrats (versions simplifiées pour l'exemple)
const EFCTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const EFCCardABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getCardAttributes(uint256 tokenId) view returns (tuple(string rarity, uint8 attack, uint8 defense, uint8 magic, uint8 speed))"
];

const EFCBoosterABI = [
  "function getBoosterPrice(string memory boosterType) view returns (uint256)",
  "function getBoosterCardCount(string memory boosterType) view returns (uint8)",
  "function purchaseBooster(string memory boosterType) returns (uint256[])",
  "function getLastPurchasedCards() view returns (uint256[])"
];

// Classe principale de la dApp
class EFCDApp {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {
      token: null,
      card: null,
      booster: null
    };
    this.currentNetwork = 'baseSepolia'; // Par défaut, utiliser Base Sepolia
    
    this.init();
  }
  
  // Initialisation de la dApp
  async init() {
    // Vérifier si MetaMask est installé
    if (typeof window.ethereum === 'undefined') {
      this.updateStatus('Veuillez installer MetaMask pour utiliser cette dApp.');
      return;
    }
    
    // Configurer les écouteurs d'événements pour les boutons
    document.getElementById('connectWalletBtn').addEventListener('click', () => this.connectWallet());
    document.getElementById('switchNetworkBtn').addEventListener('click', () => this.switchNetwork());
    document.getElementById('buyBoosterBtn').addEventListener('click', () => this.buyBooster());
    document.getElementById('refreshCardsBtn').addEventListener('click', () => this.displayCards());
    
    // Écouteur d'événements pour le changement de réseau dans MetaMask
    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
    });
    
    // Écouteur d'événements pour le changement de compte dans MetaMask
    window.ethereum.on('accountsChanged', (accounts) => {
      this.connectWallet();
    });
    
    // Tenter de se connecter automatiquement
    if (window.ethereum.isConnected()) {
      this.connectWallet();
    }
  }
  
  // Mettre à jour le statut affiché
  updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
  }
  
  // Se connecter au wallet
  async connectWallet() {
    try {
      this.updateStatus('Connexion au wallet...');
      
      // Demander l'accès au wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        this.updateStatus('Veuillez vous connecter à MetaMask.');
        return;
      }
      
      // Configurer le provider et le signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Vérifier le réseau
      const network = await this.provider.getNetwork();
      
      if (network.chainId === 84532) {
        this.currentNetwork = 'baseSepolia';
        this.updateStatus(`Connecté à Base Sepolia: ${address}`);
      } else if (network.chainId === 84531) {
        this.currentNetwork = 'baseGoerli';
        this.updateStatus(`Connecté à Base Goerli: ${address}`);
      } else {
        this.updateStatus(`Réseau non supporté. Veuillez passer à Base Sepolia.`);
        return;
      }
      
      // Initialiser les contrats
      this.initContracts();
      
      // Afficher le solde et les cartes
      this.displayBalance();
      this.displayCards();
      
    } catch (error) {
      console.error(error);
      this.updateStatus(`Erreur de connexion: ${error.message}`);
    }
  }
  
  // Initialiser les contrats
  initContracts() {
    const addresses = contractAddresses[this.currentNetwork];
    
    this.contracts.token = new ethers.Contract(
      addresses.EFCToken,
      EFCTokenABI,
      this.signer
    );
    
    this.contracts.card = new ethers.Contract(
      addresses.EFCCard,
      EFCCardABI,
      this.signer
    );
    
    this.contracts.booster = new ethers.Contract(
      addresses.EFCBooster,
      EFCBoosterABI,
      this.signer
    );
  }
  
  // Changer de réseau
  async switchNetwork() {
    const targetNetwork = this.currentNetwork === 'baseSepolia' ? 'baseGoerli' : 'baseSepolia';
    const networkConfig = networkConfigs[targetNetwork];
    
    try {
      // Tenter de changer de réseau
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (switchError) {
      // Si le réseau n'est pas configuré dans MetaMask, tenter de l'ajouter
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError) {
          this.updateStatus(`Erreur lors de l'ajout du réseau: ${addError.message}`);
        }
      } else {
        this.updateStatus(`Erreur lors du changement de réseau: ${switchError.message}`);
      }
    }
  }
  
  // Afficher le solde de tokens
  async displayBalance() {
    if (!this.contracts.token) return;
    
    try {
      const address = await this.signer.getAddress();
      const balance = await this.contracts.token.balanceOf(address);
      
      document.getElementById('tokenBalance').textContent = 
        `${ethers.utils.formatEther(balance)} EFC`;
    } catch (error) {
      console.error(error);
      document.getElementById('tokenBalance').textContent = 'Erreur';
    }
  }
  
  // Afficher les cartes NFT
  async displayCards() {
    if (!this.contracts.card) return;
    
    try {
      const cardsContainer = document.getElementById('cardsContainer');
      cardsContainer.innerHTML = '';
      
      const address = await this.signer.getAddress();
      const balance = await this.contracts.card.balanceOf(address);
      
      if (balance.toNumber() === 0) {
        cardsContainer.innerHTML = '<p>Aucune carte trouvée.</p>';
        return;
      }
      
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await this.contracts.card.tokenOfOwnerByIndex(address, i);
        const attributes = await this.contracts.card.getCardAttributes(tokenId);
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
          <h3>Carte #${tokenId}</h3>
          <p>Rareté: ${attributes.rarity}</p>
          <p>Attaque: ${attributes.attack}</p>
          <p>Défense: ${attributes.defense}</p>
          <p>Magie: ${attributes.magic}</p>
          <p>Vitesse: ${attributes.speed}</p>
        `;
        
        cardsContainer.appendChild(cardElement);
      }
    } catch (error) {
      console.error(error);
      document.getElementById('cardsContainer').innerHTML = 
        `<p>Erreur lors du chargement des cartes: ${error.message}</p>`;
    }
  }
  
  // Acheter un booster
  async buyBooster() {
    if (!this.contracts.booster) return;
    
    try {
      this.updateStatus('Achat de booster en cours...');
      
      // Obtenir le prix du booster
      const boosterType = document.getElementById('boosterType').value;
      const price = await this.contracts.booster.getBoosterPrice(boosterType);
      
      // Approuver les tokens
      const tx1 = await this.contracts.token.approve(
        this.contracts.booster.address,
        price
      );
      await tx1.wait();
      
      // Acheter le booster
      const tx2 = await this.contracts.booster.purchaseBooster(boosterType);
      await tx2.wait();
      
      // Afficher les cartes obtenues
      const cardIds = await this.contracts.booster.getLastPurchasedCards();
      this.updateStatus(`Booster acheté avec succès! Cartes obtenues: ${cardIds.join(', ')}`);
      
      // Rafraîchir l'affichage
      this.displayBalance();
      this.displayCards();
      
    } catch (error) {
      console.error(error);
      this.updateStatus(`Erreur lors de l'achat du booster: ${error.message}`);
    }
  }
}

// Initialiser la dApp quand la page est chargée
window.addEventListener('DOMContentLoaded', () => {
  // Attendre que ethers.js soit chargé
  if (typeof ethers !== 'undefined') {
    window.dapp = new EFCDApp();
  } else {
    document.getElementById('status').textContent = 
      'Erreur: ethers.js non trouvé. Veuillez vérifier les dépendances.';
  }
});
