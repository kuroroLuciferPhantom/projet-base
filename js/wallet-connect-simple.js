// Script de connexion wallet simplifié qui utilise directement window.ethereum

document.addEventListener('DOMContentLoaded', function() {
    // Variables pour suivre l'état de connexion
    let isConnected = false;
    let currentAccount = null;
    let chainId = null;
    
    // Boutons de connexion
    const connectButtons = document.querySelectorAll('.connect-wallet');
    
    // Vérifier si le navigateur a Ethereum (MetaMask, Rabby, etc.)
    function checkIfWalletIsConnected() {
        if (window.ethereum) {
            console.log("Found Ethereum provider");
            
            // Écouteur d'événements pour les changements de compte
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            
            // Écouteur d'événements pour les changements de chaîne
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
            return true;
        } else {
            console.log("No Ethereum provider found. Please install MetaMask or Rabby.");
            return false;
        }
    }
    
    // Gérer les changements de compte
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // L'utilisateur est déconnecté
            isConnected = false;
            currentAccount = null;
            
            // Mettre à jour l'interface
            updateConnectButtons();
            hideUserInterface();
        } else if (accounts[0] !== currentAccount) {
            // L'utilisateur a changé de compte
            currentAccount = accounts[0];
            isConnected = true;
            
            // Mettre à jour l'interface
            updateConnectButtons();
            showUserInterface();
        }
    }
    
    // Connecter au wallet
    async function connectWallet() {
        if (window.ethereum) {
            try {
                // Demander la connexion au wallet
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                // Récupérer l'ID de chaîne
                chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                // Mettre à jour l'état
                handleAccountsChanged(accounts);
                
                return true;
            } catch (error) {
                console.error("Error connecting to wallet:", error);
                if (error.code === 4001) {
                    // L'utilisateur a refusé la connexion
                    alert("Connexion refusée par l'utilisateur. Veuillez autoriser la connexion pour utiliser l'application.");
                } else {
                    alert("Une erreur est survenue lors de la connexion au wallet. Veuillez réessayer.");
                }
                return false;
            }
        } else {
            alert("Aucun wallet détecté. Veuillez installer MetaMask ou Rabby et rafraîchir la page.");
            return false;
        }
    }
    
    // Mettre à jour les boutons de connexion
    function updateConnectButtons() {
        connectButtons.forEach(button => {
            if (isConnected && currentAccount) {
                const shortAddress = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
                button.innerHTML = `<i class="fas fa-wallet"></i> ${shortAddress}`;
                button.classList.add('connected');
            } else {
                button.innerHTML = '<i class="fas fa-wallet"></i> Connecter Wallet';
                button.classList.remove('connected');
            }
            button.disabled = false;
        });
    }
    
    // Afficher l'interface utilisateur après connexion
    function showUserInterface() {
        // Si on est sur la page d'application
        const walletNotConnected = document.querySelector('.wallet-not-connected');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.add('hidden');
            walletConnected.classList.remove('hidden');
        }
        
        // Si la page contient un indicateur de réseau, le mettre à jour
        updateNetworkDisplay();
    }
    
    // Masquer l'interface utilisateur après déconnexion
    function hideUserInterface() {
        const walletNotConnected = document.querySelector('.wallet-not-connected');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.remove('hidden');
            walletConnected.classList.add('hidden');
        }
        
        // Si la page contient un indicateur de réseau, le mettre à jour
        updateNetworkDisplay();
    }
    
    // Mettre à jour l'affichage du réseau
    function updateNetworkDisplay() {
        const networkIndicator = document.querySelector('.network-indicator');
        if (networkIndicator) {
            const networkStatus = networkIndicator.querySelector('.network-status');
            const networkName = networkIndicator.querySelector('.network-name');
            
            if (isConnected) {
                // Obtenir le nom du réseau en fonction de chainId
                let networkNameText = 'Réseau inconnu';
                if (chainId === '0x66EED') { // Arbitrum Goerli
                    networkNameText = 'Arbitrum Goerli';
                    networkStatus.classList.add('connected');
                } else if (chainId === '0xA4B1') { // Arbitrum One
                    networkNameText = 'Arbitrum One';
                    networkStatus.classList.add('connected');
                } else {
                    networkStatus.classList.remove('connected');
                    networkNameText = 'Réseau incorrect';
                }
                
                networkName.textContent = networkNameText;
            } else {
                networkStatus.classList.remove('connected');
                networkName.textContent = 'Non connecté';
            }
        }
    }
    
    // Vérifier si un wallet est disponible
    const hasWallet = checkIfWalletIsConnected();
    
    // Si un wallet est disponible, vérifier s'il est déjà connecté
    if (hasWallet) {
        // Vérifier si des comptes sont déjà connectés
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    currentAccount = accounts[0];
                    isConnected = true;
                    
                    // Récupérer l'ID de chaîne
                    return window.ethereum.request({ method: 'eth_chainId' });
                }
            })
            .then(id => {
                if (id) {
                    chainId = id;
                    updateConnectButtons();
                    showUserInterface();
                }
            })
            .catch(error => console.error("Error checking accounts:", error));
    }
    
    // Ajouter des écouteurs d'événements aux boutons de connexion
    connectButtons.forEach(button => {
        button.addEventListener('click', async function() {
            if (!isConnected) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
                
                await connectWallet();
            }
        });
    });
});
