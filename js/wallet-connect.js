// Configuration pour Arbitrum (testnet Goerli)
const ARBITRUM_TESTNET_PARAMS = {
    chainId: '0x66EED', // 421613 en hexadécimal
    chainName: 'Arbitrum Goerli',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://goerli.arbiscan.io/']
};

// Configuration pour Arbitrum One (mainnet)
const ARBITRUM_MAINNET_PARAMS = {
    chainId: '0xA4B1', // 42161 en hexadécimal
    chainName: 'Arbitrum One',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io/']
};

// Paramètres du réseau actuel (testnet par défaut)
const NETWORK_PARAMS = ARBITRUM_TESTNET_PARAMS;

// Class pour gérer la connexion Wallet
class WalletConnector {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.accounts = [];
        this.chainId = null;
        this.isConnected = false;
        this.onConnectCallbacks = [];
        this.onDisconnectCallbacks = [];
        this.onAccountsChangedCallbacks = [];
        this.onChainChangedCallbacks = [];
        
        // Check si le wallet est déjà connecté
        this.checkConnection();
        
        // Setup des event listeners
        this.setupEventListeners();
    }
    
    // Détection de wallets disponibles
    detectProvider() {
        // Ordre de priorité pour les différents fournisseurs
        if (window.ethereum) {
            console.log("Detected window.ethereum provider");
            return window.ethereum;
        } else if (window.rabby) {
            console.log("Detected Rabby wallet");
            return window.rabby;
        } else if (window.solana && window.phantom) {
            console.log("Detected Phantom wallet");
            // Note: Phantom est pour Solana, pas pour Ethereum/Arbitrum
            // Cette partie nécessiterait une logique spécifique à Solana
            return null;
        } else {
            console.log("No Ethereum wallet detected");
            return null;
        }
    }
    
    // Vérifier si un wallet est déjà connecté
    async checkConnection() {
        const provider = this.detectProvider();
        
        if (provider) {
            try {
                // Vérifier si des comptes sont déjà connectés
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.accounts = accounts;
                    this.chainId = await provider.request({ method: 'eth_chainId' });
                    this.setupProvider(provider);
                    this.isConnected = true;
                    
                    // Vérifier si nous sommes sur le bon réseau
                    await this.checkAndSwitchNetwork();
                    
                    // Trigger les callbacks de connexion
                    this.triggerConnectCallbacks();
                }
            } catch (error) {
                console.error('Error checking connection:', error);
            }
        }
    }
    
    // Configurer les event listeners pour le wallet
    setupEventListeners() {
        const provider = this.detectProvider();
        
        if (provider) {
            provider.on('accountsChanged', (accounts) => {
                this.accounts = accounts;
                
                if (accounts.length === 0) {
                    // L'utilisateur s'est déconnecté
                    this.disconnect();
                } else {
                    // L'utilisateur a changé de compte
                    this.triggerAccountsChangedCallbacks(accounts);
                }
            });
            
            provider.on('chainChanged', (chainId) => {
                // Reload la page si le réseau change
                this.chainId = chainId;
                this.triggerChainChangedCallbacks(chainId);
                
                // Vérifier si nous sommes sur le bon réseau
                this.checkAndSwitchNetwork();
            });
            
            provider.on('disconnect', (error) => {
                this.disconnect();
            });
        }
    }
    
    // Configurer le provider et le signer
    setupProvider(provider) {
        if (provider) {
            // Utiliser ethers.js si disponible
            if (window.ethers) {
                this.provider = new ethers.providers.Web3Provider(provider);
                this.signer = this.provider.getSigner();
            } else {
                // Fallback vers une autre méthode si nécessaire
                this.provider = provider;
                this.signer = null;
            }
        }
    }
    
    // Se connecter au wallet
    async connect() {
        const provider = this.detectProvider();
        
        if (provider) {
            try {
                // Demander l'autorisation de connexion
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                
                this.accounts = accounts;
                this.chainId = await provider.request({ method: 'eth_chainId' });
                this.setupProvider(provider);
                this.isConnected = true;
                
                // Vérifier si nous sommes sur le bon réseau
                await this.checkAndSwitchNetwork();
                
                // Trigger les callbacks de connexion
                this.triggerConnectCallbacks();
                
                return accounts;
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                throw error;
            }
        } else {
            alert('Veuillez installer MetaMask, Rabby ou un autre portefeuille Web3 pour vous connecter.');
            throw new Error('No Ethereum provider detected');
        }
    }
    
    // Se déconnecter du wallet
    disconnect() {
        this.accounts = [];
        this.isConnected = false;
        this.triggerDisconnectCallbacks();
    }
    
    // Vérifier si le réseau est correct et changer si nécessaire
    async checkAndSwitchNetwork() {
        const provider = this.detectProvider();
        
        if (!provider || !this.isConnected) return false;
        
        const currentChainId = await provider.request({ method: 'eth_chainId' });
        
        // Si nous sommes déjà sur le bon réseau
        if (currentChainId === NETWORK_PARAMS.chainId) {
            return true;
        }
        
        // Essayer de changer de réseau
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK_PARAMS.chainId }],
            });
            return true;
        } catch (switchError) {
            // Si le réseau n'existe pas dans le wallet, on essaie de l'ajouter
            if (switchError.code === 4902) {
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [NETWORK_PARAMS],
                    });
                    return true;
                } catch (addError) {
                    console.error('Error adding chain:', addError);
                    return false;
                }
            }
            console.error('Error switching chain:', switchError);
            return false;
        }
    }
    
    // Obtenir l'adresse du wallet connecté
    getAddress() {
        return this.accounts.length > 0 ? this.accounts[0] : null;
    }
    
    // Formater une adresse pour l'affichage (0x1234...5678)
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    // Ajouter des callbacks pour les événements
    onConnect(callback) {
        this.onConnectCallbacks.push(callback);
        // Si déjà connecté, trigger le callback immédiatement
        if (this.isConnected) {
            callback(this.accounts);
        }
    }
    
    onDisconnect(callback) {
        this.onDisconnectCallbacks.push(callback);
    }
    
    onAccountsChanged(callback) {
        this.onAccountsChangedCallbacks.push(callback);
    }
    
    onChainChanged(callback) {
        this.onChainChangedCallbacks.push(callback);
    }
    
    // Trigger les callbacks
    triggerConnectCallbacks() {
        this.onConnectCallbacks.forEach(callback => callback(this.accounts));
    }
    
    triggerDisconnectCallbacks() {
        this.onDisconnectCallbacks.forEach(callback => callback());
    }
    
    triggerAccountsChangedCallbacks(accounts) {
        this.onAccountsChangedCallbacks.forEach(callback => callback(accounts));
    }
    
    triggerChainChangedCallbacks(chainId) {
        this.onChainChangedCallbacks.forEach(callback => callback(chainId));
    }
}

// Créer une instance de WalletConnector
const walletConnector = new WalletConnector();

// Exporter l'instance pour utilisation dans d'autres fichiers
window.walletConnector = walletConnector;

// Ajouter des event listeners aux boutons de connexion wallet
document.addEventListener('DOMContentLoaded', function() {
    const connectButtons = document.querySelectorAll('.connect-wallet');
    
    connectButtons.forEach(button => {
        button.addEventListener('click', async function() {
            try {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
                
                await walletConnector.connect();
                
                // Mise à jour de tous les boutons de connexion
                updateAllConnectButtons();
            } catch (error) {
                console.error('Failed to connect:', error);
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-wallet"></i> Connecter Wallet';
            }
        });
    });
    
    // Gérer les événements de connexion/déconnexion
    walletConnector.onConnect((accounts) => {
        console.log('Connected with accounts:', accounts);
        updateAllConnectButtons();
        updateNetworkDisplay();
        
        // Si on est sur la page d'application, afficher la collection
        const walletNotConnected = document.querySelector('.wallet-not-connected');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.add('hidden');
            walletConnected.classList.remove('hidden');
            
            // Charger les cartes de l'utilisateur ici
            // loadUserCards();
        }
    });
    
    walletConnector.onDisconnect(() => {
        console.log('Disconnected');
        updateAllConnectButtons();
        
        // Si on est sur la page d'application, masquer la collection
        const walletNotConnected = document.querySelector('.wallet-not-connected');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.remove('hidden');
            walletConnected.classList.add('hidden');
        }
    });
    
    // Mettre à jour l'affichage si déjà connecté
    if (walletConnector.isConnected) {
        updateAllConnectButtons();
        updateNetworkDisplay();
        
        // Si on est sur la page d'application, afficher la collection
        const walletNotConnected = document.querySelector('.wallet-not-connected');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.add('hidden');
            walletConnected.classList.remove('hidden');
            
            // Charger les cartes de l'utilisateur ici
            // loadUserCards();
        }
    }
});

// Mettre à jour tous les boutons de connexion
function updateAllConnectButtons() {
    const connectButtons = document.querySelectorAll('.connect-wallet');
    
    connectButtons.forEach(button => {
        if (walletConnector.isConnected) {
            const formattedAddress = walletConnector.formatAddress(walletConnector.getAddress());
            button.innerHTML = `<i class="fas fa-wallet"></i> ${formattedAddress}`;
            button.classList.add('connected');
        } else {
            button.innerHTML = '<i class="fas fa-wallet"></i> Connecter Wallet';
            button.classList.remove('connected');
        }
        button.disabled = false;
    });
}

// Mettre à jour l'affichage du réseau
function updateNetworkDisplay() {
    const networkIndicator = document.querySelector('.network-indicator');
    if (networkIndicator) {
        const networkStatus = networkIndicator.querySelector('.network-status');
        const networkName = networkIndicator.querySelector('.network-name');
        
        if (walletConnector.isConnected) {
            // Vérifier si le réseau est correct
            if (walletConnector.chainId === NETWORK_PARAMS.chainId) {
                networkStatus.classList.add('connected');
                networkName.textContent = NETWORK_PARAMS.chainName;
            } else {
                networkStatus.classList.remove('connected');
                networkName.textContent = 'Réseau incorrect';
            }
        } else {
            networkStatus.classList.remove('connected');
            networkName.textContent = 'Non connecté';
        }
    }
}
