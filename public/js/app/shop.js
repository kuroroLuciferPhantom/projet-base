// Configuration des types de boosters et leurs caractéristiques
const BOOSTER_TYPES = {
    'standard': {
        name: 'Booster Standard',
        price: 500,
        cardCount: 5,
        image: '/img/booster/booster-commun.png',
        apiType: 'common',
        rarities: {
            common: 0.70,
            rare: 0.20,
            epic: 0.08,
            legendary: 0.02
        }
    },
    'premium': {
        name: 'Booster Premium',
        price: 1200,
        cardCount: 5,
        image: '/img/booster/booster-rare.png',
        apiType: 'rare',
        rarities: {
            common: 0.55,
            rare: 0.25,
            epic: 0.15,
            legendary: 0.05
        }
    },
    'ultimate': {
        name: 'Booster Ultimate',
        price: 2500,
        cardCount: 7,
        image: '/img/booster/booster-epic.png',
        apiType: 'epic',
        rarities: {
            common: 0.40,
            rare: 0.25,
            epic: 0.25,
            legendary: 0.10
        }
    },
    'ultimate-pack': {
        name: 'Pack Ultimate (3 boosters)',
        price: 6375,
        isBundle: true,
        apiType: 'epic',
        contains: ['ultimate', 'ultimate', 'ultimate']
    },
    'random': {
        name: 'Booster Aléatoire',
        price: 800,
        isRandom: true,
        apiType: 'random',
        possibleTypes: ['standard', 'premium', 'ultimate'],
        apiPossibleTypes: ['common', 'rare', 'epic'],
        weights: [0.7, 0.25, 0.05]
    }
};

// Initialisation des variables globales
let userBalance = 0; // Solde récupéré depuis le serveur
let distributeurAnimating = false; // Pour éviter les clics multiples
let userWalletAddress = null; // Adresse du wallet de l'utilisateur

// Au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les gestionnaires d'événements pour les boutons d'achat
    initShopEvents();
    
    // Récupérer le solde de l'utilisateur depuis le serveur
    fetchUserBalance();

    // Initialiser les événements pour la modal "Vous êtes pauvre"
    initBrokeModalEvents();
    
    // Initialiser les événements pour la connection du wallet
    initWalletEvents();
});

/**
 * Récupère le solde de l'utilisateur depuis le serveur
 */
async function fetchUserBalance() {
    try {
        const response = await apiService.getUserProfile();
        
        if (response.success) {
            userBalance = response.user.tokenBalance;
            userWalletAddress = response.user.walletAddress || null;
            updateUserBalance();
            updateWalletInfo();
        } else {
            console.error('Erreur lors de la récupération du solde:', response.message);
            showErrorNotification('Impossible de récupérer votre solde. Veuillez réessayer.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        showErrorNotification('Erreur de connexion au serveur.');
    }
}

/**
 * Initialise les événements de la boutique
 */
function initShopEvents() {
    // Boutons d'achat de boosters
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo');
    buyButtons.forEach(button => {
        button.addEventListener('click', handleBoosterPurchase);
    });
    
    // Bouton du distributeur automatique
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        distributeurBtn.addEventListener('click', handleDistributeurClick);
    }
    
    // Masquer les notifications lorsqu'on clique dessus
    const notifications = document.querySelectorAll('.purchase-notification');
    notifications.forEach(notification => {
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    });
}

/**
 * Initialise les événements pour la modal "Vous êtes pauvre"
 */
function initBrokeModalEvents() {
    // Éléments de la modal
    const brokeModal = document.getElementById('broke-modal');
    const closeModal = document.querySelector('.close-modal');
    const brokeCloseBtn = document.getElementById('broke-close-btn');
    const buyTokensBtn = document.getElementById('buy-tokens-btn');
    
    // Mettre à jour le montant requis dans la modal
    const requiredAmount = document.querySelector('.required-amount');
    if (requiredAmount) {
        requiredAmount.textContent = BOOSTER_TYPES['random'].price;
    }

    // Fermer la modal quand on clique sur X
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            brokeModal.classList.remove('show');
        });
    }

    // Fermer la modal avec le bouton "Je reviendrai plus riche"
    if (brokeCloseBtn) {
        brokeCloseBtn.addEventListener('click', () => {
            brokeModal.classList.remove('show');
        });
    }

    // Bouton "Acheter des tokens" (connecté à l'API et préparé pour blockchain)
    if (buyTokensBtn) {
        buyTokensBtn.addEventListener('click', async () => {
            try {
                // Si la blockchain est activée et le wallet est connecté, on utilise la blockchain
                if (checkWeb3Availability() && userWalletAddress) {
                    const tokensToAdd = 1000;
                    const success = await buyTokensViaBlockchain(tokensToAdd);
                    
                    if (success) {
                        brokeModal.classList.remove('show');
                    }
                } else {
                    // Simuler l'achat de tokens via l'API
                    const tokensToAdd = 1000;
                    const response = await apiService.updateUserProfile({
                        tokenBalanceAdd: tokensToAdd
                    });
                    
                    if (response.success) {
                        userBalance = response.user.tokenBalance;
                        updateUserBalance();
                        showSuccessNotification(`Vous avez acheté ${tokensToAdd} $EFC !`);
                        brokeModal.classList.remove('show');
                    } else {
                        showErrorNotification('Erreur lors de l\'achat de tokens: ' + response.message);
                    }
                }
            } catch (error) {
                console.error('Erreur lors de l\'achat de tokens:', error);
                showErrorNotification('Erreur de connexion au serveur.');
            }
        });
    }

    // Fermer la modal quand on clique en dehors
    window.addEventListener('click', (event) => {
        if (event.target === brokeModal) {
            brokeModal.classList.remove('show');
        }
    });
}

/**
 * Initialise les événements pour la connexion du wallet
 */
function initWalletEvents() {
    // Bouton de connexion du wallet
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            try {
                // Vérifier si Web3 est disponible
                if (!checkWeb3Availability()) {
                    showErrorNotification('Veuillez installer MetaMask ou un autre wallet compatible Web3.');
                    return;
                }
                
                // Connecter le wallet
                const walletAddress = await connectWallet();
                
                if (walletAddress) {
                    // Mettre à jour l'affichage
                    userWalletAddress = walletAddress;
                    updateWalletInfo();
                    
                    // Synchroniser avec le serveur si nécessaire
                    if (hasBackendWalletIntegration()) {
                        await syncWalletWithBackend(walletAddress);
                    }
                    
                    showSuccessNotification('Wallet connecté avec succès !');
                }
            } catch (error) {
                console.error('Erreur lors de la connexion du wallet:', error);
                showErrorNotification('Erreur lors de la connexion du wallet.');
            }
        });
    }
}

/**
 * Gestionnaire pour l'achat de booster
 */
async function handleBoosterPurchase() {
    const boosterType = this.getAttribute('data-booster-type');
    const boosterPrice = parseInt(this.getAttribute('data-booster-price'));
    const booster = BOOSTER_TYPES[boosterType];
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        showErrorNotification("Vous n'avez pas assez de tokens pour cet achat.");
        return;
    }
    
    try {
        // Vérifier si on doit utiliser la blockchain pour l'achat
        if (hasBlockchainBoosterIntegration() && userWalletAddress) {
            // Méthode pour acheter via blockchain qui sera implémentée plus tard
            const blockchainSuccess = await purchaseBoosterViaBlockchain(boosterType, boosterPrice);
            if (!blockchainSuccess) return;
        }
        
        // Différencier les bundles des boosters simples
        if (booster.isBundle) {
            // Pour les bundles, on effectue plusieurs achats de boosters
            const bundleResponse = [];
            
            // Montrer l'animation de chargement
            // Ici, on pourrait ajouter un indicateur de chargement visuel
            
            // Acheter chaque booster dans le bundle séquentiellement
            for (const bundleBoosterType of booster.contains) {
                const bundleBooster = BOOSTER_TYPES[bundleBoosterType];
                const response = await apiService.buyBooster(bundleBooster.apiType);
                bundleResponse.push(response);
                
                // Si une des requêtes échoue, on arrête
                if (!response.success) {
                    showErrorNotification(`Erreur lors de l'achat du bundle: ${response.message}`);
                    return;
                }
            }
            
            // Mettre à jour le solde
            const lastResponse = bundleResponse[bundleResponse.length - 1];
            userBalance = lastResponse.tokenBalance;
            updateUserBalance();
            
            // Afficher la notification d'achat réussi
            showSuccessNotification(booster.name);
            
            // Ouvrir le premier booster du pack après un délai
            setTimeout(() => {
                openBoosterModal(booster.contains[0]);
            }, 1500);
            
        } else {
            // Pour un booster simple, appeler l'API d'achat
            const response = await apiService.buyBooster(booster.apiType);
            
            if (response.success) {
                // Mettre à jour le solde
                userBalance = response.tokenBalance;
                updateUserBalance();
                
                // Afficher la notification d'achat réussi
                showSuccessNotification(booster.name);
                
                // Ouvrir la modale après un délai
                setTimeout(() => {
                    openBoosterModal(boosterType);
                }, 1500);
            } else {
                showErrorNotification(`Erreur lors de l'achat: ${response.message}`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'achat:', error);
        showErrorNotification('Erreur de connexion au serveur.');
    }
}

/**
 * Gestionnaire pour le clic sur le distributeur automatique
 */
async function handleDistributeurClick() {
    // Éviter les clics multiples pendant l'animation
    if (distributeurAnimating) return;
    
    // Prix du distributeur aléatoire
    const boosterPrice = BOOSTER_TYPES['random'].price;
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        // Afficher la modal "Vous êtes pauvre"
        const brokeModal = document.getElementById('broke-modal');
        if (brokeModal) {
            brokeModal.classList.add('show');
        } else {
            // Fallback si la modal n'existe pas
            showErrorNotification("Vous n'avez pas assez de tokens pour utiliser le distributeur.");
        }
        return;
    }
    
    // Marquer le début de l'animation
    distributeurAnimating = true;
    
    // Animation du distributeur
    const distributeur = document.querySelector('.distributeur');
    const bouton = document.querySelector('.bouton');
    const fente = document.querySelector('.fente-light');
    
    // Ajouter des classes d'animation
    distributeur.classList.add('active');
    bouton.classList.add('pressed');
    
    try {
        // Vérifier si on doit utiliser la blockchain pour l'achat
        if (hasBlockchainBoosterIntegration() && userWalletAddress) {
            // Méthode pour acheter via blockchain qui sera implémentée plus tard
            const blockchainSuccess = await purchaseBoosterViaBlockchain('random', boosterPrice);
            if (!blockchainSuccess) {
                // Réinitialiser l'animation en cas d'échec
                distributeur.classList.remove('active');
                bouton.classList.remove('pressed');
                distributeurAnimating = false;
                return;
            }
        }
        
        // Déterminer quel type de booster l'utilisateur obtient
        const randomIndex = Math.floor(Math.random() * BOOSTER_TYPES['random'].possibleTypes.length);
        const randomBoosterUIType = BOOSTER_TYPES['random'].possibleTypes[randomIndex];
        const randomBoosterAPIType = BOOSTER_TYPES['random'].apiPossibleTypes[randomIndex];
        const randomBooster = BOOSTER_TYPES[randomBoosterUIType];
        
        // Appeler l'API d'achat
        const response = await apiService.buyBooster(randomBoosterAPIType);
        
        if (response.success) {
            // Mettre à jour le solde
            userBalance = response.tokenBalance;
            updateUserBalance();
            
            // Simuler le processus aléatoire avec animation
            setTimeout(() => {
                // Activer la lumière de la fente
                fente.classList.add('active');
                
                // Après un délai, faire apparaître le booster
                setTimeout(() => {
                    // Préparer l'animation du booster
                    const boosterContainer = document.getElementById('booster-animation-container');
                    boosterContainer.innerHTML = `<img src="${randomBooster.image || '/img/booster-' + randomBoosterUIType + '.svg'}" alt="${randomBooster.name}">`;
                    boosterContainer.className = 'booster-animating active ' + randomBoosterUIType;
                    
                    // Afficher à l'utilisateur ce qu'il a obtenu
                    showSuccessNotification(`Vous avez obtenu un ${randomBooster.name} !`);
                    
                    // Une fois l'animation terminée
                    setTimeout(() => {
                        // Réinitialiser l'animation
                        fente.classList.remove('active');
                        distributeur.classList.remove('active');
                        bouton.classList.remove('pressed');
                        
                        // Ouvrir la modale du booster
                        setTimeout(() => {
                            boosterContainer.className = 'booster-animating';
                            distributeurAnimating = false;
                            openBoosterModal(randomBoosterUIType);
                        }, 500);
                    }, 2000);
                }, 1000);
            }, 1000);
        } else {
            // En cas d'erreur, réinitialiser l'animation
            distributeur.classList.remove('active');
            bouton.classList.remove('pressed');
            distributeurAnimating = false;
            
            showErrorNotification(`Erreur lors de l'achat: ${response.message}`);
        }
    } catch (error) {
        // En cas d'erreur, réinitialiser l'animation
        distributeur.classList.remove('active');
        bouton.classList.remove('pressed');
        distributeurAnimating = false;
        
        console.error('Erreur lors de l\'achat:', error);
        showErrorNotification('Erreur de connexion au serveur.');
    }
}

/**
 * Ouvre la modale d'ouverture de booster
 */
function openBoosterModal(boosterType) {
    // Récupérer les détails du booster
    const booster = BOOSTER_TYPES[boosterType];
    
    // Mettre à jour l'image du booster dans la modale
    const boosterImg = document.getElementById('booster-pack-img');
    boosterImg.src = booster.image || `/img/booster-${boosterType}.svg`;
    boosterImg.alt = booster.name;
    boosterImg.classList.remove('hidden', 'opening');
    
    // Réinitialiser l'état de la modale
    document.querySelector('.cards-reveal').classList.add('hidden');
    document.getElementById('continue-btn').classList.add('hidden');
    document.getElementById('open-booster-btn').classList.remove('hidden');
    
    // Afficher la modale
    const modal = document.getElementById('booster-opening-modal');
    modal.style.display = 'flex';
    
    // Ajouter des données spécifiques au booster à la modale
    document.getElementById('open-booster-btn').setAttribute('data-booster-type', boosterType);
    document.getElementById('open-booster-btn').setAttribute('data-api-type', booster.apiType);
    
    // Ajout de l'event listener pour le bouton d'ouverture
    const openBoosterBtn = document.getElementById('open-booster-btn');
    
    // Supprimer tous les listeners précédents
    const newOpenBtn = openBoosterBtn.cloneNode(true);
    openBoosterBtn.parentNode.replaceChild(newOpenBtn, openBoosterBtn);
    
    // Ajouter le nouveau listener
    newOpenBtn.addEventListener('click', async function() {
        const apiBoosterType = this.getAttribute('data-api-type');
        try {
            // Animation d'ouverture du booster
            boosterImg.classList.add('opening');
            
            // Appeler l'API pour ouvrir le booster
            const response = await apiService.openBooster(apiBoosterType);
            
            if (response.success) {
                // Cacher l'image du booster après l'animation
                setTimeout(() => {
                    boosterImg.classList.add('hidden');
                    newOpenBtn.classList.add('hidden');
                    
                    // Afficher les cartes obtenues
                    displayOpenedCards(response.cards);
                    
                    // Afficher le bouton continuer
                    document.getElementById('continue-btn').classList.remove('hidden');
                }, 800);
            } else {
                showErrorNotification(`Erreur lors de l'ouverture: ${response.message}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du booster:', error);
            showErrorNotification('Erreur de connexion au serveur.');
        }
    });
}

/**
 * Affiche les cartes obtenues dans la modale
 */
function displayOpenedCards(cards) {
    const cardsContainer = document.querySelector('.cards-reveal');
    cardsContainer.innerHTML = '';
    cardsContainer.classList.remove('hidden');
    
    // Créer les éléments pour chaque carte
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `card-reveal ${card.gameCard.rarity}`;
        
        cardEl.innerHTML = `
            <img src="${card.gameCard.imageUrl}" alt="${card.gameCard.name}">
            <div class="card-info">
                <h3>${card.gameCard.name}</h3>
                <div class="card-stats">
                    <span>ATT: ${card.gameCard.stats.attack}</span>
                    <span>DEF: ${card.gameCard.stats.defense}</span>
                    <span>MAG: ${card.gameCard.stats.magic}</span>
                    <span>VIT: ${card.gameCard.stats.speed}</span>
                </div>
            </div>
        `;
        
        cardsContainer.appendChild(cardEl);
    });
    
    // Animation d'apparition des cartes
    const cardElements = cardsContainer.querySelectorAll('.card-reveal');
    cardElements.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('revealed');
        }, 200 * index);
    });
}

/**
 * Affiche une notification de succès
 */
function showSuccessNotification(boosterName) {
    const notification = document.getElementById('purchase-notification');
    document.getElementById('purchased-booster-type').textContent = boosterName;
    notification.classList.add('show');
    
    // Masquer la notification après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

/**
 * Affiche une notification d'erreur
 */
function showErrorNotification(message) {
    const notification = document.getElementById('error-notification');
    document.getElementById('error-message').textContent = message;
    notification.classList.add('show');
    
    // Masquer la notification après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

/**
 * Met à jour l'affichage du solde utilisateur
 */
function updateUserBalance() {
    // Mettre à jour l'affichage du solde dans la boutique
    const balanceElements = document.querySelectorAll('.balance-amount');
    balanceElements.forEach(element => {
        element.textContent = userBalance;
    });
    
    // Mettre à jour l'affichage du solde dans la sidebar
    const sidebarTokenAmount = document.querySelector('.token-amount');
    if (sidebarTokenAmount) {
        sidebarTokenAmount.textContent = `${userBalance} $EFC`;
    }
    
    // Désactiver les boutons si le solde est insuffisant
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo');
    buyButtons.forEach(button => {
        const price = parseInt(button.getAttribute('data-booster-price'));
        if (userBalance < price) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    });
    
    // Vérifier si le solde est suffisant pour le distributeur
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        // Note: On ne désactive pas réellement le bouton pour permettre d'afficher la modal "Vous êtes pauvre"
        if (userBalance < BOOSTER_TYPES['random'].price) {
            distributeurBtn.classList.add('disabled');
            // Mais on garde le pointeur en mode "pointer" pour pouvoir cliquer et montrer la modal
            distributeurBtn.style.pointerEvents = 'auto';
            distributeurBtn.style.cursor = 'pointer';
        } else {
            distributeurBtn.classList.remove('disabled');
            distributeurBtn.style.pointerEvents = 'auto';
        }
    }
}

/**
 * Met à jour l'affichage des informations du wallet
 */
function updateWalletInfo() {
    const walletAddressEl = document.getElementById('wallet-address');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    
    if (walletAddressEl) {
        if (userWalletAddress) {
            // Formater l'adresse pour l'affichage (ex: 0x1234...5678)
            const formattedAddress = `${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
            walletAddressEl.textContent = formattedAddress;
            walletAddressEl.classList.remove('hidden');
            
            // Cacher le bouton de connexion si on est connecté
            if (connectWalletBtn) {
                connectWalletBtn.classList.add('hidden');
            }
        } else {
            walletAddressEl.classList.add('hidden');
            
            // Afficher le bouton de connexion si on n'est pas connecté
            if (connectWalletBtn) {
                connectWalletBtn.classList.remove('hidden');
            }
        }
    }
}

/**
 * Fonctions pour l'intégration avec la blockchain
 */

// Fonction pour vérifier si Web3 est disponible
function checkWeb3Availability() {
    return typeof window.ethereum !== 'undefined';
}

// Fonction pour se connecter au wallet
async function connectWallet() {
    if (!checkWeb3Availability()) {
        showErrorNotification('Veuillez installer MetaMask ou un autre wallet compatible Web3.');
        return null;
    }

    try {
        // Demander à l'utilisateur de se connecter
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            showErrorNotification('Aucun compte trouvé. Veuillez vous connecter à votre wallet.');
            return null;
        }
        
        // Retourner l'adresse du compte connecté
        return accounts[0];
    } catch (error) {
        console.error('Erreur lors de la connexion au wallet:', error);
        showErrorNotification('Erreur de connexion au wallet: ' + error.message);
        return null;
    }
}

// Fonction pour synchroniser le wallet avec le backend
async function syncWalletWithBackend(walletAddress) {
    try {
        // Récupérer un nonce pour la signature
        const nonceResponse = await apiService.getWalletNonce(walletAddress);
        
        if (!nonceResponse.success) {
            showErrorNotification('Erreur lors de la récupération du nonce: ' + nonceResponse.message);
            return false;
        }
        
        // Demander à l'utilisateur de signer le message avec son wallet
        const signMessage = nonceResponse.message;
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [signMessage, walletAddress]
        });
        
        // Envoyer la signature au serveur pour vérification
        const connectResponse = await apiService.connectWallet(walletAddress, signature);
        
        if (connectResponse.success) {
            // Mettre à jour les informations de l'utilisateur
            if (connectResponse.token) {
                apiService.setToken(connectResponse.token);
            }
            
            if (connectResponse.user) {
                userBalance = connectResponse.user.tokenBalance;
                userWalletAddress = connectResponse.user.walletAddress;
                updateUserBalance();
                updateWalletInfo();
            }
            
            return true;
        } else {
            showErrorNotification('Erreur lors de la connexion du wallet: ' + connectResponse.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation du wallet:', error);
        showErrorNotification('Erreur lors de la signature du message: ' + error.message);
        return false;
    }
}

// Fonction pour acheter des tokens via blockchain
async function buyTokensViaBlockchain(amount) {
    const walletAddress = await connectWallet();
    
    if (!walletAddress) {
        return false;
    }
    
    try {
        // Ici, on implémentera l'appel au smart contract pour acheter des tokens
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        // Calculer le prix en ETH pour l'achat
        const priceInEth = ... // prix dynamique via Oracle ou fixe
        
        // Appeler la fonction buyTokens du smart contract
        await contract.methods.buyTokens(amount).send({
            from: walletAddress,
            value: web3.utils.toWei(priceInEth.toString(), 'ether')
        });
        */
        
        // Après l'achat, on mettra à jour le solde via l'API backend
        // Qui synchronisera avec le smart contract
        const response = await apiService.updateUserProfile({
            tokenBalanceAdd: amount
        });
        
        if (response.success) {
            userBalance = response.user.tokenBalance;
            updateUserBalance();
            showSuccessNotification(`Vous avez acheté ${amount} $EFC via blockchain !`);
            return true;
        } else {
            showErrorNotification('Erreur lors de la mise à jour du solde: ' + response.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'achat de tokens via blockchain:', error);
        showErrorNotification('Erreur lors de la transaction blockchain: ' + error.message);
        return false;
    }
}

// Fonction pour acheter un booster via blockchain
async function purchaseBoosterViaBlockchain(boosterType, price) {
    try {
        // Ici, on implémentera l'appel au smart contract pour acheter un booster
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        // Appeler la fonction buyBooster du smart contract
        await contract.methods.buyBooster(boosterType, price).send({
            from: userWalletAddress
        });
        */
        
        // Pour l'instant, on considère que l'achat via blockchain a réussi
        // Dans une implémentation réelle, on vérifierait la transaction
        
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'achat via blockchain:', error);
        showErrorNotification('Erreur lors de la transaction blockchain: ' + error.message);
        return false;
    }
}

// Vérifie si le backend prend en charge l'intégration wallet
function hasBackendWalletIntegration() {
    // Cette fonction pourrait vérifier une configuration ou une variable d'environnement
    // Pour l'instant, on retourne true pour activer l'intégration
    return true;
}

// Vérifie si l'intégration blockchain est activée pour les boosters
function hasBlockchainBoosterIntegration() {
    // Cette fonction pourrait vérifier une configuration ou une variable d'environnement
    // Pour l'instant, on retourne false pour désactiver l'intégration
    return false;
}

// Fonction pour vérifier le solde de tokens sur la blockchain
async function checkBlockchainTokenBalance(address) {
    try {
        // Ici, on implémentera l'appel au smart contract pour vérifier le solde
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        // Appeler la fonction balanceOf du smart contract
        const balance = await contract.methods.balanceOf(address).call();
        return parseInt(balance);
        */
        
        // Pour l'instant, on retourne le solde de l'API
        return userBalance;
    } catch (error) {
        console.error('Erreur lors de la vérification du solde blockchain:', error);
        return null;
    }
}

// Fonction pour vérifier si l'utilisateur possède des NFT (cartes)
async function checkBlockchainNFTs(address) {
    try {
        // Ici, on implémentera l'appel au smart contract pour vérifier les NFT
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract NFT
        const contract = new web3.eth.Contract(NFT_ABI, contractAddress);
        
        // Récupérer tous les tokenIds appartenant à l'adresse
        const tokenIds = await contract.methods.tokensOfOwner(address).call();
        
        // Récupérer les métadonnées pour chaque token
        const nfts = [];
        for (const tokenId of tokenIds) {
            const tokenURI = await contract.methods.tokenURI(tokenId).call();
            // Récupérer les métadonnées via l'URI (IPFS ou HTTP)
            // ...
            nfts.push({
                tokenId,
                metadata: { ... }
            });
        }
        
        return nfts;
        */
        
        // Pour l'instant, on retourne un tableau vide
        return [];
    } catch (error) {
        console.error('Erreur lors de la vérification des NFT:', error);
        return [];
    }
}

// Fonction pour vérifier si une carte spécifique est un NFT
async function isCardNFT(cardId) {
    try {
        // Récupérer les détails de la carte depuis l'API
        const response = await apiService.getCardById(cardId);
        
        if (response.success && response.card) {
            // Vérifier si la carte a un tokenId, ce qui indique qu'elle est un NFT
            return !!response.card.tokenId;
        }
        
        return false;
    } catch (error) {
        console.error('Erreur lors de la vérification de la carte NFT:', error);
        return false;
    }
}

// Fonction pour "minter" une carte en NFT
async function mintCardAsNFT(cardId) {
    try {
        // Vérifier si Web3 est disponible et si le wallet est connecté
        if (!checkWeb3Availability() || !userWalletAddress) {
            showErrorNotification('Veuillez connecter votre wallet blockchain pour créer un NFT.');
            return false;
        }
        
        // Vérifier si la carte appartient à l'utilisateur
        const cardResponse = await apiService.getCardById(cardId);
        
        if (!cardResponse.success || !cardResponse.card) {
            showErrorNotification('Impossible de récupérer les détails de la carte.');
            return false;
        }
        
        if (cardResponse.card.owner !== apiService.getUserId()) {
            showErrorNotification('Vous ne pouvez créer un NFT que pour vos propres cartes.');
            return false;
        }
        
        // Vérifier si la carte est déjà un NFT
        if (cardResponse.card.tokenId) {
            showErrorNotification('Cette carte est déjà un NFT.');
            return false;
        }
        
        // Ici, on implémentera l'appel au smart contract pour minter le NFT
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract NFT
        const contract = new web3.eth.Contract(NFT_ABI, contractAddress);
        
        // Préparer les métadonnées de la carte pour le NFT
        const metadata = {
            name: cardResponse.card.name,
            description: cardResponse.card.description,
            image: cardResponse.card.imageUrl,
            attributes: [
                { trait_type: 'Rarity', value: cardResponse.card.rarity },
                { trait_type: 'Attack', value: cardResponse.card.stats.attack },
                { trait_type: 'Defense', value: cardResponse.card.stats.defense },
                { trait_type: 'Magic', value: cardResponse.card.stats.magic },
                { trait_type: 'Speed', value: cardResponse.card.stats.speed }
            ]
        };
        
        // Uploader les métadonnées sur IPFS ou un autre stockage décentralisé
        // ...
        
        // Minter le NFT avec l'URI des métadonnées
        const metadataURI = '...'; // URI des métadonnées uploadées
        const mintTx = await contract.methods.mintNFT(userWalletAddress, metadataURI).send({
            from: userWalletAddress
        });
        
        // Récupérer le tokenId du NFT créé
        const tokenId = mintTx.events.Transfer.returnValues.tokenId;
        
        // Mettre à jour la carte dans la base de données avec le tokenId
        const updateResponse = await apiService.updateCard(cardId, { tokenId });
        
        return updateResponse.success;
        */
        
        // Pour l'instant, simuler une requête API pour mettre à jour la carte
        const updateResponse = await apiService.updateCard(cardId, { 
            tokenId: 'nft_' + Date.now() // Simuler un tokenId 
        });
        
        if (updateResponse.success) {
            showSuccessNotification('Carte transformée en NFT avec succès !');
            return true;
        } else {
            showErrorNotification('Erreur lors de la mise à jour de la carte.');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la création du NFT:', error);
        showErrorNotification('Erreur lors de la création du NFT: ' + error.message);
        return false;
    }
}

// Fonction pour transférer un NFT vers un autre wallet
async function transferNFT(cardId, toAddress) {
    try {
        // Vérifier si Web3 est disponible et si le wallet est connecté
        if (!checkWeb3Availability() || !userWalletAddress) {
            showErrorNotification('Veuillez connecter votre wallet blockchain pour transférer un NFT.');
            return false;
        }
        
        // Vérifier si la carte appartient à l'utilisateur et est un NFT
        const cardResponse = await apiService.getCardById(cardId);
        
        if (!cardResponse.success || !cardResponse.card) {
            showErrorNotification('Impossible de récupérer les détails de la carte.');
            return false;
        }
        
        if (cardResponse.card.owner !== apiService.getUserId()) {
            showErrorNotification('Vous ne pouvez transférer que vos propres cartes.');
            return false;
        }
        
        if (!cardResponse.card.tokenId) {
            showErrorNotification('Cette carte n\'est pas un NFT.');
            return false;
        }
        
        // Vérifier si l'adresse de destination est valide
        if (!toAddress || !toAddress.startsWith('0x')) {
            showErrorNotification('Adresse de destination invalide.');
            return false;
        }
        
        // Ici, on implémentera l'appel au smart contract pour transférer le NFT
        // Pour l'instant, c'est un placeholder pour la future intégration
        
        // Exemple de structure future:
        /*
        const web3 = new Web3(window.ethereum);
        const contractAddress = '0x...'; // Adresse du smart contract NFT
        const contract = new web3.eth.Contract(NFT_ABI, contractAddress);
        
        // Transférer le NFT
        const tokenId = cardResponse.card.tokenId;
        await contract.methods.transferFrom(userWalletAddress, toAddress, tokenId).send({
            from: userWalletAddress
        });
        
        // Mettre à jour la propriété de la carte dans la base de données
        const updateResponse = await apiService.transferCard(cardId, { toAddress });
        
        return updateResponse.success;
        */
        
        // Pour l'instant, simuler une requête API pour transférer la carte
        const updateResponse = await apiService.transferCard(cardId, { toAddress });
        
        if (updateResponse.success) {
            showSuccessNotification('NFT transféré avec succès !');
            return true;
        } else {
            showErrorNotification('Erreur lors du transfert du NFT.');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors du transfert du NFT:', error);
        showErrorNotification('Erreur lors du transfert du NFT: ' + error.message);
        return false;
    }
}

// Fonction pour vérifier si l'environnement supporte l'intégration blockchain
function isBlockchainEnabled() {
    // On pourrait avoir une configuration globale ou une variable d'environnement
    // Pour l'instant, on vérifie simplement si Web3 est disponible
    return checkWeb3Availability();
}

// Fonction pour changer de réseau blockchain (mainnet, testnet, etc.)
async function switchBlockchainNetwork(networkId) {
    try {
        if (!checkWeb3Availability()) {
            showErrorNotification('Web3 n\'est pas disponible. Veuillez installer MetaMask.');
            return false;
        }
        
        // Les IDs des réseaux Ethereum
        const networks = {
            mainnet: '0x1',
            ropsten: '0x3',
            rinkeby: '0x4',
            goerli: '0x5',
            kovan: '0x2a',
            polygon: '0x89',
            mumbai: '0x13881'
        };
        
        const chainId = networks[networkId] || networkId;
        
        // Essayer de changer de réseau
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
        });
        
        // Mettre à jour l'interface utilisateur si nécessaire
        // ...
        
        return true;
    } catch (error) {
        // Si le réseau n'est pas configuré dans MetaMask, proposer de l'ajouter
        if (error.code === 4902) {
            try {
                // Configurations pour les réseaux courants
                const networkParams = {
                    polygon: {
                        chainId: '0x89',
                        chainName: 'Polygon Mainnet',
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        },
                        rpcUrls: ['https://polygon-rpc.com/'],
                        blockExplorerUrls: ['https://polygonscan.com/']
                    },
                    mumbai: {
                        chainId: '0x13881',
                        chainName: 'Polygon Mumbai Testnet',
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        },
                        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
                    }
                    // Ajouter d'autres réseaux au besoin
                };
                
                // Ajouter le réseau à MetaMask
                if (networkParams[networkId]) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams[networkId]]
                    });
                    return true;
                } else {
                    showErrorNotification('Réseau non supporté.');
                    return false;
                }
            } catch (addError) {
                console.error('Erreur lors de l\'ajout du réseau:', addError);
                showErrorNotification('Erreur lors du changement de réseau: ' + addError.message);
                return false;
            }
        } else {
            console.error('Erreur lors du changement de réseau:', error);
            showErrorNotification('Erreur lors du changement de réseau: ' + error.message);
            return false;
        }
    }
}

// Équivalent de l'écouteur d'événements window.ethereum.on('accountsChanged')
// pour détecter les changements de compte
if (checkWeb3Availability()) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // L'utilisateur s'est déconnecté
            userWalletAddress = null;
            updateWalletInfo();
            showErrorNotification('Wallet déconnecté.');
        } else {
            // L'utilisateur a changé de compte
            userWalletAddress = accounts[0];
            updateWalletInfo();
            
            // Synchroniser avec le backend si nécessaire
            if (hasBackendWalletIntegration()) {
                syncWalletWithBackend(userWalletAddress).then(() => {
                    showSuccessNotification('Wallet connecté avec succès !');
                });
            }
        }
    });
    
    // Écouter les changements de réseau
    window.ethereum.on('chainChanged', (chainId) => {
        // Recharger la page pour s'assurer que tous les états sont mis à jour
        window.location.reload();
    });
}