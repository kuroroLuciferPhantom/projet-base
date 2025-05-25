// Variables globales
let userBalance = 0;
let boosterConfig = {};
let distributeurAnimating = false;
let userWalletAddress = null;
let shopEventsInitialized = false;

// Au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    fetchUserBalance();
    fetchBoosterConfig();
    initBrokeModalEvents();
    initWalletEvents();
    
    // Initialiser les événements du shop immédiatement
    initShopEvents();
    
    // Observer les changements de visibilité de la section shop
    observeShopSection();
});

/**
 * Observe les changements de visibilité de la section shop
 */
function observeShopSection() {
    const shopSection = document.getElementById('section-shop');
    if (!shopSection) return;
    
    // Utiliser MutationObserver pour surveiller les changements de classe
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isVisible = !shopSection.classList.contains('hidden');
                if (isVisible && !shopEventsInitialized) {
                    // Réinitialiser les événements quand la section devient visible
                    setTimeout(() => {
                        initShopEvents();
                        shopEventsInitialized = true;
                    }, 100);
                }
            }
        });
    });
    
    observer.observe(shopSection, {
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Récupère la configuration des boosters depuis le serveur
 */
async function fetchBoosterConfig() {
    try {
        const response = await fetch('/api/v1/boosters/config');
        const data = await response.json();
        
        if (data.success) {
            boosterConfig = data.config;
            updateBoosterPrices();
        } else {
            console.error('Erreur lors de la récupération de la configuration:', data.message);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration:', error);
    }
}

/**
 * Met à jour les prix affichés selon la configuration serveur
 */
function updateBoosterPrices() {
    // Mettre à jour les prix dans l'interface
    const priceElements = document.querySelectorAll('[data-booster-type]');
    priceElements.forEach(element => {
        const boosterType = element.getAttribute('data-booster-type');
        if (boosterConfig.rarityProbabilities && boosterConfig.rarityProbabilities[boosterType]) {
            element.setAttribute('data-booster-price', boosterConfig.price);
            
            // Mettre à jour l'affichage du prix
            const priceDisplay = element.querySelector('.price-amount, .booster-price .price-amount');
            if (priceDisplay) {
                priceDisplay.textContent = boosterConfig.price;
            }
        }
    });
    
    // Mettre à jour le prix du distributeur (prix fixe de 100 $EFC)
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn && boosterConfig.price) {
        const distributeurPrice = boosterConfig.price; // Prix fixe pour tous les boosters
        const priceSpan = distributeurBtn.querySelector('.bouton-price');
        if (priceSpan) {
            priceSpan.textContent = `${distributeurPrice} $EFC`;
        }
    }
}

/**
 * Récupère le solde de l'utilisateur depuis le serveur
 */
async function fetchUserBalance() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Aucun token trouvé');
            return;
        }
        
        const response = await fetch('/api/v1/users/me/token-balance', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            userBalance = data.tokenBalance;
            updateUserBalance();
        } else {
            console.error('Erreur lors de la récupération du solde:', data.message);
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
    console.log('Initialisation des événements du shop...');
    
    // Supprimer les anciens écouteurs pour éviter les doublons
    removeOldEventListeners();
    
    // Boutons d'achat de boosters principaux
    const buyButtonsMain = document.querySelectorAll('.btn-buy-booster-main');
    buyButtonsMain.forEach(button => {
        button.addEventListener('click', handleMainBoosterPurchase);
        button.setAttribute('data-event-attached', 'true');
    });
    
    // Boutons d'achat de boosters spécifiques (si il y en a)
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo, .btn-buy-booster-nft');
    buyButtons.forEach(button => {
        button.addEventListener('click', handleBoosterPurchase);
        button.setAttribute('data-event-attached', 'true');
    });
    
    // Bouton du distributeur automatique
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        console.log('Distributeur trouvé, ajout de l\'événement...');
        distributeurBtn.addEventListener('click', handleDistributeurClick);
        distributeurBtn.setAttribute('data-event-attached', 'true');
    } else {
        console.log('Distributeur non trouvé');
    }
    
    // Masquer les notifications lorsqu'on clique dessus
    const notifications = document.querySelectorAll('.purchase-notification');
    notifications.forEach(notification => {
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    });
    
    console.log('Événements du shop initialisés');
}

/**
 * Supprime les anciens écouteurs d'événements pour éviter les doublons
 */
function removeOldEventListeners() {
    const elementsWithEvents = document.querySelectorAll('[data-event-attached="true"]');
    elementsWithEvents.forEach(element => {
        element.removeAttribute('data-event-attached');
        // Cloner l'élément pour supprimer tous les événements
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
    });
}

/**
 * Gestionnaire pour l'achat de booster principal (bouton principal du shop)
 */
async function handleMainBoosterPurchase() {
    console.log('Achat de booster principal...');
    const boosterPrice = parseInt(this.getAttribute('data-booster-price')) || (boosterConfig.price || 100);
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        const brokeModal = document.getElementById('broke-modal');
        if (brokeModal) {
            // Mettre à jour le montant requis
            const requiredAmount = document.querySelector('.required-amount');
            if (requiredAmount) {
                requiredAmount.textContent = boosterPrice;
            }
            brokeModal.classList.add('show');
        } else {
            showErrorNotification(`Vous n'avez pas assez de tokens pour cet achat. Il vous faut ${boosterPrice} tokens mais vous n'avez que ${userBalance} tokens.`);
        }
        return;
    }
    
    try {
        // Désactiver le bouton pendant l'achat
        this.disabled = true;
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Achat en cours...';
        
        // Appeler l'API pour acheter et ouvrir automatiquement un booster mystère
        const response = await fetch('/api/v1/boosters/buy-and-open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour le solde
            userBalance = data.tokenBalance;
            updateUserBalance();
            
            // Afficher la notification d'achat réussi
            showSuccessNotification(`Booster mystère acheté et ouvert ! Vous avez obtenu un booster ${data.boosterType} !`);
            
            // Afficher directement les cartes obtenues
            setTimeout(() => {
                displayCardsResult(data.cards, `Booster ${data.boosterType}`);
            }, 1000);
        } else {
            if (data.message.includes('Solde insuffisant')) {
                const brokeModal = document.getElementById('broke-modal');
                if (brokeModal) {
                    const requiredAmount = document.querySelector('.required-amount');
                    if (requiredAmount) {
                        requiredAmount.textContent = data.required || boosterPrice;
                    }
                    brokeModal.classList.add('show');
                } else {
                    showErrorNotification(data.message);
                }
            } else {
                showErrorNotification(`Erreur lors de l'achat: ${data.message}`);
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'achat:", error);
        showErrorNotification('Erreur de connexion au serveur.');
    } finally {
        // Réactiver le bouton
        this.disabled = false;
        this.innerHTML = originalText;
    }
}

/**
 * Gestionnaire pour l'achat de booster spécifique
 */
async function handleBoosterPurchase() {
    console.log('Achat de booster spécifique...');
    const boosterType = this.getAttribute('data-booster-type');
    const boosterPrice = parseInt(this.getAttribute('data-booster-price')) || (boosterConfig.price || 100);
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        showErrorNotification(`Vous n'avez pas assez de tokens pour cet achat. Il vous faut ${boosterPrice} tokens mais vous n'avez que ${userBalance} tokens.`);
        return;
    }
    
    try {
        // Désactiver le bouton pendant l'achat
        this.disabled = true;
        this.textContent = 'Achat en cours...';
        
        // Appeler l'API pour acheter un booster spécifique et l'ouvrir automatiquement
        const response = await fetch('/api/v1/boosters/buy-and-open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ boosterType })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour le solde
            userBalance = data.tokenBalance;
            updateUserBalance();
            
            // Afficher la notification d'achat réussi
            showSuccessNotification(`Booster ${boosterType} acheté et ouvert !`);
            
            // Afficher directement les cartes obtenues
            setTimeout(() => {
                displayCardsResult(data.cards, `Booster ${boosterType}`);
            }, 1000);
        } else {
            showErrorNotification(`Erreur lors de l'achat: ${data.message}`);
        }
    } catch (error) {
        console.error("Erreur lors de l'achat:", error);
        showErrorNotification('Erreur de connexion au serveur.');
    } finally {
        // Réactiver le bouton
        this.disabled = false;
        this.innerHTML = this.getAttribute('data-original-text') || '<i class="fas fa-wallet"></i> Acheter';
    }
}

/**
 * Gestionnaire pour le distributeur automatique
 */
async function handleDistributeurClick(event) {
    console.log('Clic sur le distributeur !', event);
    
    if (distributeurAnimating) {
        console.log('Distributeur en cours d\'animation, ignoré');
        return;
    }
    
    // Prix fixe du distributeur (100 $EFC)
    const distributeurPrice = boosterConfig.price || 100;
    
    console.log(`Prix du distributeur: ${distributeurPrice}, Solde utilisateur: ${userBalance}`);
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < distributeurPrice) {
        console.log('Solde insuffisant');
        const brokeModal = document.getElementById('broke-modal');
        if (brokeModal) {
            // Mettre à jour le montant requis
            const requiredAmount = document.querySelector('.required-amount');
            if (requiredAmount) {
                requiredAmount.textContent = distributeurPrice;
            }
            brokeModal.classList.add('show');
        } else {
            showErrorNotification("Vous n'avez pas assez de tokens pour utiliser le distributeur.");
        }
        return;
    }
    
    console.log('Démarrage de l\'animation du distributeur...');
    distributeurAnimating = true;
    
    // Animation du distributeur
    const distributeur = document.querySelector('.distributeur');
    const bouton = document.querySelector('.bouton');
    const fente = document.querySelector('.fente-light');
    
    // Désactiver le bouton visuellement
    if (bouton) {
        bouton.classList.add('disabled');
        bouton.style.pointerEvents = 'none';
    }
    
    if (distributeur) distributeur.classList.add('active');
    if (bouton) bouton.classList.add('pressed');
    
    try {
        console.log('Appel API pour achat et ouverture de booster...');
        // Appeler l'API pour acheter un booster mystère (le serveur détermine la rareté)
        const response = await fetch('/api/v1/boosters/buy-and-open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
            // Pas de body - le serveur détermine automatiquement la rareté
        });
        
        const data = await response.json();
        console.log('Réponse de l\'API:', data);
        
        if (data.success) {
            userBalance = data.tokenBalance;
            updateUserBalance();
            
            const boosterType = data.boosterType;
            const boosterName = `Booster ${boosterType}`;
            
            console.log('Succès, démarrage de l\'animation...');
            
            // Animation du distributeur
            setTimeout(() => {
                if (fente) fente.classList.add('active');
                
                setTimeout(() => {
                    const boosterContainer = document.getElementById('booster-animation-container');
                    if (boosterContainer) {
                        boosterContainer.innerHTML = `<img src="/img/booster/booster-${boosterType}.png" alt="${boosterName}" onerror="this.src='/img/booster/booster-commun.png';">`;
                        boosterContainer.className = `booster-animating active ${boosterType}`;
                    }
                    
                    showSuccessNotification(`Vous avez obtenu un ${boosterName} !`);
                    
                    setTimeout(() => {
                        if (fente) fente.classList.remove('active');
                        if (distributeur) distributeur.classList.remove('active');
                        if (bouton) bouton.classList.remove('pressed');
                        
                        setTimeout(() => {
                            if (boosterContainer) boosterContainer.className = 'booster-animating';
                            if (bouton) {
                                bouton.classList.remove('disabled');
                                bouton.style.pointerEvents = 'auto';
                            }
                            distributeurAnimating = false;
                            displayCardsResult(data.cards, boosterName);
                        }, 500);
                    }, 2000);
                }, 1000);
            }, 1000);
        } else {
            console.log('Erreur de l\'API:', data.message);
            if (distributeur) distributeur.classList.remove('active');
            if (bouton) {
                bouton.classList.remove('pressed');
                bouton.classList.remove('disabled');
                bouton.style.pointerEvents = 'auto';
            }
            distributeurAnimating = false;
            
            if (data.message.includes('Solde insuffisant')) {
                const brokeModal = document.getElementById('broke-modal');
                if (brokeModal) {
                    const requiredAmount = document.querySelector('.required-amount');
                    if (requiredAmount) {
                        requiredAmount.textContent = data.required || distributeurPrice;
                    }
                    brokeModal.classList.add('show');
                } else {
                    showErrorNotification(data.message);
                }
            } else {
                showErrorNotification(`Erreur lors de l'achat: ${data.message}`);
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'achat:", error);
        if (distributeur) distributeur.classList.remove('active');
        if (bouton) {
            bouton.classList.remove('pressed');
            bouton.classList.remove('disabled');
            bouton.style.pointerEvents = 'auto';
        }
        distributeurAnimating = false;
        showErrorNotification('Erreur de connexion au serveur.');
    }
}

/**
 * Affiche le résultat des cartes obtenues dans une modal améliorée
 */
function displayCardsResult(cards, boosterName) {
    let resultModal = document.getElementById('booster-cards-result-modal');
    
    if (!resultModal) {
        // S'assurer que le CSS est chargé
        ensureModalCSSLoaded();
        
        // Créer la modal si elle n'existe pas
        resultModal = document.createElement('div');
        resultModal.id = 'booster-cards-result-modal';
        resultModal.className = 'bcr-modal-overlay';
        resultModal.innerHTML = `
            <div class="bcr-modal-container">
                <div class="bcr-modal-header">
                    <h3 id="bcr-result-title" class="bcr-title">🎉 Félicitations !</h3>
                    <span class="bcr-close-btn" id="bcr-modal-close">&times;</span>
                </div>
                <div class="bcr-modal-body">
                    <p id="bcr-result-subtitle" class="bcr-subtitle">Vous avez obtenu ces cartes :</p>
                    <div class="bcr-cards-grid" id="bcr-cards-container"></div>
                </div>
                <div class="bcr-modal-footer">
                    <button class="bcr-continue-btn" id="bcr-modal-continue">
                        <i class="fas fa-forward"></i> Continuer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(resultModal);
        
        // Attacher les événements une seule fois
        attachCardsModalEventsOnce();
    }
    
    // Mettre à jour le contenu
    document.getElementById('bcr-result-title').innerHTML = `🎉 ${boosterName} ouvert !`;
    document.getElementById('bcr-result-subtitle').textContent = `Vous avez obtenu ces ${cards.length} cartes :`;
    
    const cardsContainer = document.getElementById('bcr-cards-container');
    cardsContainer.innerHTML = '';
    
    // Créer les éléments pour chaque carte - design simplifié
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `bcr-card bcr-card-${card.gameCard.rarity}`;
        
        cardEl.innerHTML = `
            <div class="bcr-card-image-wrapper">
                <img src="${card.gameCard.imageUrl}" 
                     alt="${card.gameCard.name}" 
                     onerror="this.src='/img/cards/placeholder.png';"
                     class="bcr-card-image">
                <div class="bcr-card-glow bcr-glow-${card.gameCard.rarity}"></div>
            </div>
            <div class="bcr-card-name">${card.gameCard.name}</div>
        `;
        
        cardsContainer.appendChild(cardEl);
        
        // Animation d'apparition des cartes avec effet cascade
        setTimeout(() => {
            cardEl.classList.add('bcr-revealed');
        }, 300 + (150 * index));
    });
    
    // Afficher la modal avec animation
    resultModal.style.display = 'flex';
    setTimeout(() => {
        resultModal.classList.add('bcr-show');
    }, 10);
}

/**
 * S'assure que le CSS de la modal est chargé
 */
function ensureModalCSSLoaded() {
    // Vérifier si le CSS est déjà chargé
    const existingLink = document.querySelector('link[href*="booster-cards-modal.css"]');
    if (existingLink) return;
    
    // Créer et ajouter le lien vers le fichier CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/css/booster-cards-modal.css';
    document.head.appendChild(link);
}

/**
 * Attache les événements à la modal des cartes (une seule fois)
 */
function attachCardsModalEventsOnce() {
    // Utiliser la délégation d'événements sur le document
    document.addEventListener('click', function(event) {
        console.log('Clic détecté dans la modal des cartes', event);
        // Fermeture par clic sur la croix
        if (event.target && event.target.id === 'bcr-modal-close') {
            event.preventDefault();
            closeCardsResultModal();
        }
        
        // Fermeture par clic sur le bouton continuer
        console.log('Clic sur le bouton continuer');
        console.log(event.target);
        console.log(event.target.id);
        if (event.target && event.target.id === 'bcr-modal-continue') {
            console.log('Fermeture de la modal par le bouton continuer');
            event.preventDefault();
            console.log('Fermeture de la modal des cartes');
            closeCardsResultModal();
        }
        
        // Fermeture par clic en dehors de la modal
        if (event.target && event.target.id === 'booster-cards-result-modal') {
            closeCardsResultModal();
        }
    });
    
    // Fermeture par touche Échap
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('booster-cards-result-modal');
            if (modal && modal.classList.contains('bcr-show')) {
                closeCardsResultModal();
            }
        }
    });
}

function attachCardsModalEvents() {
    const modalOverlay = document.getElementById('booster-cards-result-modal');
    if (modalOverlay) {
        modalOverlay.onclick = function(event) {
            if (event.target === modalOverlay) {
                closeCardsResultModal();
            }
        };
    }
}

/**
 * Ferme la modal de résultats des cartes
 */
function closeCardsResultModal() {
    console.log('Fermeture de la modal des cartes...');
    const resultModal = document.getElementById('booster-cards-result-modal');
    if (resultModal) {
        resultModal.classList.remove('bcr-show');
        
        // Attendre la fin de l'animation avant de masquer complètement
        setTimeout(() => {
            resultModal.style.display = 'none';
        }, 300);
    }
    
    // Recharger la collection pour afficher les nouvelles cartes
    if (typeof collectionService !== 'undefined' && collectionService.refreshCollection) {
        collectionService.refreshCollection();
    }
}

/**
 * Affiche une notification de succès
 */
function showSuccessNotification(message) {
    const notification = document.getElementById('purchase-notification');
    if (notification) {
        const messageElement = document.getElementById('purchased-booster-type');
        if (messageElement) {
            messageElement.textContent = message;
        }
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    } else {
        console.log('Notification de succès:', message);
    }
}


/**
 * Affiche une notification d'erreur
 */
function showErrorNotification(message) {
    const notification = document.getElementById('error-notification');
    if (notification) {
        const messageElement = document.getElementById('error-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    } else {
        console.log('Notification d\'erreur:', message);
    }
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
    
    // Mettre à jour l'affichage dans l'élément avec ID
    const userTokenBalance = document.getElementById('user-token-balance');
    if (userTokenBalance) {
        userTokenBalance.textContent = `${userBalance} $EFC`;
    }
    
    // Désactiver les boutons si le solde est insuffisant
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo, .btn-buy-booster-nft, .btn-buy-booster-main');
    buyButtons.forEach(button => {
        const price = parseInt(button.getAttribute('data-booster-price')) || (boosterConfig.price || 100);
        if (userBalance < price) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    });
    
    // Désactiver le distributeur si le solde est insuffisant
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        const distributeurPrice = boosterConfig.price || 100;
        if (userBalance < distributeurPrice) {
            distributeurBtn.classList.add('disabled');
        } else {
            distributeurBtn.classList.remove('disabled');
        }
    }
}

/**
 * Initialise les événements pour la modal "Vous êtes pauvre"
 */
function initBrokeModalEvents() {
    const brokeModal = document.getElementById('broke-modal');
    const closeModal = document.querySelector('.close-modal');
    const brokeCloseBtn = document.getElementById('broke-close-btn');
    const buyTokensBtn = document.getElementById('buy-tokens-btn');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            brokeModal.classList.remove('show');
        });
    }

    if (brokeCloseBtn) {
        brokeCloseBtn.addEventListener('click', () => {
            brokeModal.classList.remove('show');
        });
    }

    if (buyTokensBtn) {
        buyTokensBtn.addEventListener('click', async () => {
            // Simuler l'achat de tokens pour le développement
            try {
                const tokensToAdd = 1000;
                // Ici on pourrait appeler une vraie API d'achat de tokens
                // Pour l'instant, on simule juste l'ajout de tokens
                
                // TODO: Implémenter l'achat réel de tokens via API
                // const response = await fetch('/api/v1/tokens/buy', { ... });
                
                userBalance += tokensToAdd;
                updateUserBalance();
                showSuccessNotification(`Vous avez acheté ${tokensToAdd} $EFC !`);
                brokeModal.classList.remove('show');
            } catch (error) {
                showErrorNotification("Erreur lors de l'achat de tokens.");
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
 * Placeholder pour les fonctions wallet (à implémenter plus tard)
 */
function initWalletEvents() {
    // Fonctions wallet à implémenter
}

function checkWeb3Availability() {
    return typeof window.ethereum !== 'undefined';
}

function hasBackendWalletIntegration() {
    return false; // Désactivé pour l'instant
}

function hasBlockchainBoosterIntegration() {
    return false; // Désactivé pour l'instant
}