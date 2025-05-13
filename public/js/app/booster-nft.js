/**
 * Intégration des boosters avec les NFTs
 * Extension du script shop.js pour supporter l'achat de boosters via blockchain
 */

// Au chargement du document, initialiser les événements liés aux boosters NFT
document.addEventListener('DOMContentLoaded', function() {
    initBoosterNFTEvents();
});

// Initialiser les événements pour l'achat de boosters avec NFT
function initBoosterNFTEvents() {
    // Bouton d'achat de booster avec NFT
    const buyBoosterNftButtons = document.querySelectorAll('.btn-buy-booster-nft');
    if (buyBoosterNftButtons.length > 0) {
        buyBoosterNftButtons.forEach(button => {
            button.addEventListener('click', handleBoosterNFTPurchase);
        });
    }
    
    // Vérifier si Web3 est disponible
    if (typeof blockchainService !== 'undefined' && blockchainService.isWeb3Available()) {
        // Activer les boutons NFT si Web3 est disponible
        enableNFTFeatures();
    } else {
        // Désactiver les fonctionnalités NFT si Web3 n'est pas disponible
        disableNFTFeatures();
    }
}

// Activer les fonctionnalités NFT
function enableNFTFeatures() {
    // Afficher les boutons d'achat de booster avec NFT
    const nftFeatures = document.querySelectorAll('.nft-feature');
    nftFeatures.forEach(feature => {
        feature.classList.remove('disabled');
        
        // Ajouter un tooltip pour expliquer que cette fonctionnalité utilise la blockchain
        const tooltip = document.createElement('span');
        tooltip.className = 'blockchain-tooltip';
        tooltip.innerHTML = '<i class="fas fa-info-circle"></i> Cette fonctionnalité utilise la blockchain';
        feature.appendChild(tooltip);
    });
    
    // Ajouter une indication "NFT" aux cartes qui sont des NFTs
    refreshNFTCardIndicators();
}

// Désactiver les fonctionnalités NFT
function disableNFTFeatures() {
    // Masquer les boutons d'achat de booster avec NFT
    const nftFeatures = document.querySelectorAll('.nft-feature');
    nftFeatures.forEach(feature => {
        feature.classList.add('disabled');
        
        // Ajouter un message expliquant pourquoi c'est désactivé
        const disabledMessage = document.createElement('div');
        disabledMessage.className = 'disabled-message';
        disabledMessage.innerHTML = 'Cette fonctionnalité nécessite MetaMask ou un autre wallet compatible Web3';
        feature.appendChild(disabledMessage);
    });
}

// Rafraîchir les indicateurs NFT sur les cartes
async function refreshNFTCardIndicators() {
    // Si l'utilisateur n'est pas connecté avec un wallet, ne rien faire
    if (!blockchainService || !blockchainService.isWeb3Available()) {
        return;
    }
    
    try {
        // Obtenir l'adresse du wallet connecté
        const walletAddress = await blockchainService.getConnectedWallet();
        if (!walletAddress) {
            return;
        }
        
        // Récupérer les cartes de l'utilisateur
        const userCards = await apiService.getUserCards();
        if (!userCards.success) {
            console.error('Erreur lors de la récupération des cartes:', userCards.message);
            return;
        }
        
        // Pour chaque carte, vérifier si c'est un NFT et ajouter un indicateur
        userCards.cards.forEach(card => {
            // Vérifier si la carte a un tokenId, ce qui indique que c'est un NFT
            if (card.tokenId) {
                // Trouver l'élément DOM correspondant à cette carte
                const cardElement = document.querySelector(`.card-item[data-card-id="${card.id}"]`);
                if (cardElement) {
                    // Ajouter un badge NFT
                    const nftBadge = document.createElement('div');
                    nftBadge.className = 'nft-badge';
                    nftBadge.innerHTML = '<i class="fas fa-certificate"></i> NFT';
                    cardElement.appendChild(nftBadge);
                    
                    // Ajouter une classe pour les effets visuels
                    cardElement.classList.add('nft-card');
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des indicateurs NFT:', error);
    }
}

// Gestionnaire pour l'achat de booster avec NFT
async function handleBoosterNFTPurchase() {
    const boosterType = this.getAttribute('data-booster-type');
    
    try {
        // Vérifier si Web3 est disponible
        if (!blockchainService || !blockchainService.isWeb3Available()) {
            showErrorNotification('Veuillez installer MetaMask ou un autre wallet compatible Web3.');
            return;
        }
        
        // Vérifier si l'utilisateur a assez de tokens
        const balanceCheck = await blockchainService.hasEnoughTokens(boosterType);
        
        if (!balanceCheck.hasEnough) {
            showErrorNotification(`Solde insuffisant. Vous avez ${balanceCheck.balance} tokens, le booster coûte ${balanceCheck.price} tokens.`);
            return;
        }
        
        // Afficher une notification de chargement
        showLoadingNotification('Transaction en cours...');
        
        // Effectuer l'achat via blockchain
        const result = await blockchainService.purchaseBoosterAndMintNFTs(boosterType);
        
        if (result.success) {
            // Masquer la notification de chargement
            hideLoadingNotification();
            
            // Afficher une notification de succès
            showSuccessNotification(`Booster ${boosterType} acheté avec succès! ${result.cardIds.length} cartes NFT ont été créées.`);
            
            // Rafraîchir l'interface utilisateur
            setTimeout(() => {
                // Rafraîchir la collection de cartes
                refreshCollection();
                
                // Rafraîchir les indicateurs NFT
                refreshNFTCardIndicators();
            }, 2000);
        } else {
            // Masquer la notification de chargement
            hideLoadingNotification();
            
            // Afficher une notification d'erreur
            showErrorNotification('Erreur lors de l\'achat: ' + (result.message || 'Une erreur est survenue.'));
        }
    } catch (error) {
        // Masquer la notification de chargement
        hideLoadingNotification();
        
        console.error('Erreur lors de l\'achat du booster avec NFT:', error);
        showErrorNotification('Erreur lors de l\'achat du booster: ' + error.message);
    }
}

// Rafraîchir la collection de cartes
async function refreshCollection() {
    try {
        // Récupérer les cartes de l'utilisateur
        const userCards = await apiService.getUserCards();
        if (!userCards.success) {
            console.error('Erreur lors de la récupération des cartes:', userCards.message);
            return;
        }
        
        // Mettre à jour l'interface utilisateur avec les nouvelles cartes
        const cardsGrid = document.querySelector('.cards-grid');
        if (!cardsGrid) {
            return;
        }
        
        // Vider la grille actuelle
        cardsGrid.innerHTML = '';
        
        // Ajouter les cartes à la grille
        userCards.cards.forEach(card => {
            // Créer un élément pour la carte
            const cardElement = document.createElement('div');
            cardElement.className = `card-item ${card.gameCard.rarity}`;
            cardElement.setAttribute('data-card-id', card.id);
            
            // Ajouter les détails de la carte
            cardElement.innerHTML = `
                <div class="card-rarity">${getRarityDisplayName(card.gameCard.rarity)}</div>
                <div class="card-image" style="background-image: url(${card.gameCard.imageUrl})"></div>
                <div class="card-info">
                    <h3>${card.gameCard.name}</h3>
                    <div class="card-stats">
                        <span>ATK: ${card.gameCard.stats.attack}</span>
                        <span>DEF: ${card.gameCard.stats.defense}</span>
                    </div>
                </div>
            `;
            
            // Ajouter un badge NFT si c'est un NFT
            if (card.tokenId) {
                const nftBadge = document.createElement('div');
                nftBadge.className = 'nft-badge';
                nftBadge.innerHTML = '<i class="fas fa-certificate"></i> NFT';
                cardElement.appendChild(nftBadge);
                
                // Ajouter une classe pour les effets visuels
                cardElement.classList.add('nft-card');
            }
            
            // Ajouter la carte à la grille
            cardsGrid.appendChild(cardElement);
            
            // Ajouter un événement de clic pour afficher les détails
            cardElement.addEventListener('click', () => {
                showCardDetails(card);
            });
        });
        
        // Mettre à jour le compteur de cartes
        const cardCount = document.querySelector('.collection-stats .stat-value');
        if (cardCount) {
            cardCount.textContent = userCards.cards.length;
        }
        
        // Masquer le message "Aucune carte" si nécessaire
        const noCardsPrompt = document.querySelector('.no-cards-prompt');
        if (noCardsPrompt) {
            if (userCards.cards.length > 0) {
                noCardsPrompt.classList.add('hidden');
                cardsGrid.classList.remove('hidden');
            } else {
                noCardsPrompt.classList.remove('hidden');
                cardsGrid.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement de la collection:', error);
    }
}

// Afficher les détails d'une carte
function showCardDetails(card) {
    // Récupérer la modal de détails de carte
    const modal = document.getElementById('card-detail-modal');
    if (!modal) {
        return;
    }
    
    // Mettre à jour les détails de la carte dans la modal
    const cardImage = modal.querySelector('.card-image img');
    if (cardImage) {
        cardImage.src = card.gameCard.imageUrl;
        cardImage.alt = card.gameCard.name;
    }
    
    const cardName = modal.querySelector('.card-details h2');
    if (cardName) {
        cardName.textContent = card.gameCard.name;
    }
    
    const cardRarity = modal.querySelector('.card-rarity');
    if (cardRarity) {
        cardRarity.textContent = getRarityDisplayName(card.gameCard.rarity);
        cardRarity.className = `card-rarity ${card.gameCard.rarity}`;
    }
    
    const cardDescription = modal.querySelector('.card-description');
    if (cardDescription) {
        cardDescription.textContent = card.gameCard.description;
    }
    
    // Mettre à jour les statistiques
    const statsList = modal.querySelector('.card-stats-list');
    if (statsList) {
        statsList.innerHTML = `
            <li><span>Attaque</span><span>${card.gameCard.stats.attack}</span></li>
            <li><span>Défense</span><span>${card.gameCard.stats.defense}</span></li>
            <li><span>Magie</span><span>${card.gameCard.stats.magic}</span></li>
            <li><span>Vitesse</span><span>${card.gameCard.stats.speed}</span></li>
        `;
    }
    
    // Afficher les informations NFT si c'est un NFT
    const nftSection = modal.querySelector('.card-nft-info');
    if (nftSection) {
        if (card.tokenId) {
            nftSection.classList.remove('hidden');
            nftSection.innerHTML = `
                <h3>Informations NFT</h3>
                <div class="nft-details">
                    <p><strong>Token ID:</strong> ${card.tokenId}</p>
                    <p><strong>Blockchain:</strong> Ethereum</p>
                    <p><a href="https://etherscan.io/token/${card.tokenId}" target="_blank" class="view-on-etherscan">
                        <i class="fas fa-external-link-alt"></i> Voir sur Etherscan
                    </a></p>
                </div>
            `;
        } else {
            nftSection.classList.add('hidden');
        }
    }
    
    // Afficher la modal
    modal.style.display = 'flex';
}

// Fonctions utilitaires

// Obtenir le nom d'affichage pour une rareté
function getRarityDisplayName(rarity) {
    const rarities = {
        'common': 'Commune',
        'rare': 'Rare',
        'epic': 'Épique',
        'legendary': 'Légendaire'
    };
    
    return rarities[rarity] || rarity;
}

// Afficher une notification de chargement
function showLoadingNotification(message) {
    // Créer la notification si elle n'existe pas
    let loadingNotification = document.getElementById('loading-notification');
    
    if (!loadingNotification) {
        loadingNotification = document.createElement('div');
        loadingNotification.id = 'loading-notification';
        loadingNotification.className = 'loading-notification';
        
        // Ajouter la notification au body
        document.body.appendChild(loadingNotification);
    }
    
    // Mettre à jour le contenu
    loadingNotification.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message || 'Chargement en cours...'}</div>
    `;
    
    // Afficher la notification
    loadingNotification.classList.add('show');
}

// Masquer la notification de chargement
function hideLoadingNotification() {
    const loadingNotification = document.getElementById('loading-notification');
    if (loadingNotification) {
        loadingNotification.classList.remove('show');
    }
}