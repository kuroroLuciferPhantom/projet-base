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
        
        // Vérifier si la page est complètement chargée avant de tenter une connexion
        if (document.readyState === 'complete') {
            this.initialize();
        } else {
            window.addEventListener('load', () => {
                this.initialize();
            });
        }
    }
    
    // Initialiser le connecteur de wallet
    initialize() {
        console.log("Initializing wallet connector...");
        // Vérifier s'il y a déjà une connexion
        setTimeout(() => {
            this.checkConnection();
            // Configurer les écouteurs d'événements
            this.setupEventListeners();
        }, 500); // Petit délai pour s'assurer que les fournisseurs sont injectés
    }
    
    // Détection de wallets disponibles
    detectProvider() {
        console.log("Detecting wallet provider...");
        
        // Fonction pour vérifier la présence d'un fournisseur
        const checkProvider = () => {
            // Vérifier toutes les possibilités
            if (window.ethereum) {
                console.log("Detected window.ethereum provider");
                return window.ethereum;
            }
            // Vérifier spécifiquement pour Rabby
            if (window.ethereum && window.ethereum.isRabby) {
                console.log("Detected Rabby wallet");
                return window.ethereum;
            }
            // Vérifier pour Phantom (pour Solana - non compatible avec ce projet)
            if (window.solana && window.phantom) {
                console.log("Detected Phantom wallet (Solana)");
                return null;
            }
            
            // Parcourir toutes les propriétés de la fenêtre pour trouver un fournisseur potentiel
            for (const key in window) {
                const value = window[key];
                if (
                    value && 
                    typeof value === 'object' && 
                    (
                        value.isMetaMask || 
                        value.isRabby || 
                        value.isBraveWallet || 
                        value.isTrust || 
                        value.isFrame
                    )
                ) {
                    console.log(`Detected provider: ${key}`, value);
                    return value;
                }
            }
            
            // Certains wallets injectent leur fournisseur ailleurs
            if (window.web3 && window.web3.currentProvider) {
                console.log("Detected legacy web3 provider");
                return window.web3.currentProvider;
            }
            
            // Aucun fournisseur détecté
            console.log("No Ethereum provider detected");
            return null;
        };
        
        // Essayer de détecter le fournisseur
        const provider = checkProvider();
        
        // Afficher plus d'infos pour le débogage
        if (provider) {
            console.log("Provider found:", provider);
            console.log("Provider properties:", Object.keys(provider));
            
            // Vérifier si le provider a les méthodes nécessaires
            if (typeof provider.request === 'function') {
                console.log("Provider has request method");
            } else {
                console.warn("Provider missing request method!");
            }
        }
        
        return provider;
    }
    
    // Vérifier si un wallet est déjà connecté
    async checkConnection() {
        console.log("Checking existing connection...");
        const provider = this.detectProvider();
        
        if (provider) {
            try {
                // Vérifier si des comptes sont déjà connectés
                const accounts = await provider.request({ method: 'eth_accounts' })
                    .catch(err => {
                        console.error("Error in eth_accounts:", err);
                        return [];
                    });
                
                console.log("Existing accounts:", accounts);
                
                if (accounts && accounts.length > 0) {
                    this.accounts = accounts;
                    this.chainId = await provider.request({ method: 'eth_chainId' })
                        .catch(err => {
                            console.error("Error getting chainId:", err);
                            return null;
                        });
                    
                    console.log("Chain ID:", this.chainId);
                    
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
        } else {
            console.log("No provider detected during connection check");
        }
    }
    
    // Configurer les event listeners pour le wallet
    setupEventListeners() {
        const provider = this.detectProvider();
        
        if (provider) {
            console.log("Setting up wallet event listeners");
            
            // Certains fournisseurs utilisent des méthodes différentes pour les événements
            if (provider.on) {
                provider.on('accountsChanged', (accounts) => {
                    console.log("Accounts changed:", accounts);
                    this.accounts = accounts;
                    
                    if (!accounts || accounts.length === 0) {
                        // L'utilisateur s'est déconnecté
                        this.disconnect();
                    } else {
                        // L'utilisateur a changé de compte
                        this.triggerAccountsChangedCallbacks(accounts);
                    }
                });
                
                provider.on('chainChanged', (chainId) => {
                    console.log("Chain changed:", chainId);
                    // Reload la page si le réseau change
                    this.chainId = chainId;
                    this.triggerChainChangedCallbacks(chainId);
                    
                    // Vérifier si nous sommes sur le bon réseau
                    this.checkAndSwitchNetwork();
                });
                
                provider.on('disconnect', (error) => {
                    console.log("Disconnect event received:", error);
                    this.disconnect();
                });
            } else {
                console.warn("Provider does not support events, some features may not work");
            }
        }
    }
    
    // Configurer le provider et le signer
    setupProvider(provider) {
        if (provider) {
            console.log("Setting up provider and signer");
            this.provider = provider;
            
            // Utiliser ethers.js si disponible
            if (window.ethers) {
                try {
                    this.provider = new ethers.providers.Web3Provider(provider);
                    this.signer = this.provider.getSigner();
                    console.log("Ethers.js Web3Provider initialized");
                } catch (error) {
                    console.error("Error initializing ethers provider:", error);
                    this.provider = provider;
                    this.signer = null;
                }
            } else {
                console.warn("Ethers.js not available, using raw provider");
                this.signer = null;
            }
        }
    }
    
    // Se connecter au wallet
    async connect() {
        console.log("Attempting to connect wallet...");
        const provider = this.detectProvider();
        
        if (provider) {
            try {
                console.log("Requesting accounts...");
                
                // Demander l'autorisation de connexion
                let accounts;
                try {
                    accounts = await provider.request({ method: 'eth_requestAccounts' });
                } catch (requestError) {
                    console.error("Error requesting accounts:", requestError);
                    
                    // Fallback pour certains wallets qui n'implémentent pas eth_requestAccounts
                    if (provider.enable) {
                        console.log("Trying legacy enable method...");
                        accounts = await provider.enable();
                    } else {
                        throw requestError;
                    }
                }
                
                console.log("Connected accounts:", accounts);
                
                if (!accounts || accounts.length === 0) {
                    throw new Error("No accounts returned from wallet");
                }
                
                this.accounts = accounts;
                
                try {
                    this.chainId = await provider.request({ method: 'eth_chainId' });
                    console.log("Chain ID:", this.chainId);
                } catch (chainError) {
                    console.error("Error getting chain ID:", chainError);
                    // Continuer même si on ne peut pas obtenir l'ID de chaîne
                }
                
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
            console.error("No Ethereum provider found");
            // Afficher des instructions spécifiques pour installer un wallet
            const message = 
                "Aucun wallet Ethereum détecté. Veuillez installer l'un des wallets suivants:\n\n" +
                "- MetaMask: https://metamask.io/\n" +
                "- Rabby: https://rabby.io/\n" +
                "- Autre portefeuille compatible EIP-1193";
            
            alert(message);
            throw new Error('No Ethereum provider detected');
        }
    }
    
    // Se déconnecter du wallet
    disconnect() {
        console.log("Disconnecting wallet");
        this.accounts = [];
        this.isConnected = false;
        this.triggerDisconnectCallbacks();
    }
    
    // Vérifier si le réseau est correct et changer si nécessaire
    async checkAndSwitchNetwork() {
        const provider = this.detectProvider();
        
        if (!provider || !this.isConnected) return false;
        
        try {
            const currentChainId = await provider.request({ method: 'eth_chainId' });
            console.log(`Current chain ID: ${currentChainId}, Target chain ID: ${NETWORK_PARAMS.chainId}`);
            
            // Si nous sommes déjà sur le bon réseau
            if (currentChainId === NETWORK_PARAMS.chainId) {
                console.log("Already on the correct network");
                return true;
            }
            
            // Essayer de changer de réseau
            try {
                console.log("Attempting to switch network...");
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: NETWORK_PARAMS.chainId }],
                });
                console.log("Network switched successfully");
                return true;
            } catch (switchError) {
                console.error("Error switching chain:", switchError);
                
                // Si le réseau n'existe pas dans le wallet, on essaie de l'ajouter
                if (switchError.code === 4902) {
                    try {
                        console.log("Network not found, attempting to add network...");
                        await provider.request({
                            method: 'wallet_addEthereumChain',
                            params: [NETWORK_PARAMS],
                        });
                        console.log("Network added successfully");
                        return true;
                    } catch (addError) {
                        console.error('Error adding chain:', addError);
                        return false;
                    }
                }
                return false;
            }
        } catch (error) {
            console.error("Error in checkAndSwitchNetwork:", error);
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
    console.log("DOM loaded, setting up connect wallet buttons");
    const connectButtons = document.querySelectorAll('.connect-wallet');
    
    connectButtons.forEach(button => {
        button.addEventListener('click', async function() {
            console.log("Connect wallet button clicked");
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
