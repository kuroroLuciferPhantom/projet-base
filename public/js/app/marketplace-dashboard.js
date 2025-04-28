/**
 * JavaScript pour la marketplace intégrée au dashboard
 */

// Initialisation des variables globales
let currentCardId = null;
let currentPage = 1;
let currentFilters = {
    search: '',
    rarity: '',
    minPrice: '',
    maxPrice: '',
    sort: 'price_asc'
};

// Éléments DOM
const filterForm = document.getElementById('marketplace-filter-form');
const resetFiltersBtn = document.getElementById('reset-filters');
const cardsGrid = document.getElementById('marketplace-cards-grid');
const paginationContainer = document.getElementById('marketplace-pagination');
const totalCountElement = document.getElementById('marketplace-total-count');
const noCardsMessage = document.getElementById('no-cards-message');

// Modals
const cardDetailModal = document.getElementById('card-detail-marketplace-modal');
const buyConfirmModal = document.getElementById('buy-confirm-modal');
const sellModal = document.getElementById('sell-modal');
const removeConfirmModal = document.getElementById('remove-confirm-modal');
const marketplaceToast = document.getElementById('marketplace-toast');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes dans la section marketplace
    if (!document.getElementById('section-marketplace')) return;
    
    // Vérifier si les éléments marketplace existent
    if (!filterForm || !cardsGrid) return;
    
    // Charger les cartes initiales
    loadMarketCards();
    
    // Gestionnaire d'événements pour le formulaire de filtres
    if (filterForm) {
        filterForm.addEventListener('submit', handleFilterSubmit);
    }
    
    // Gestionnaire pour réinitialiser les filtres
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Gestionnaires pour les liens rapides
    document.getElementById('view-stats').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/marketplace/stats';
    });
    
    document.getElementById('view-history').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/marketplace/history';
    });
    
    document.getElementById('view-my-listings').addEventListener('click', (e) => {
        e.preventDefault();
        loadMyListings();
    });
    
    // Gestionnaires pour les modals
    setupModalEventListeners();
});

/**
 * Configure les écouteurs d'événements pour les modals
 */
function setupModalEventListeners() {
    // Fermer les modals lors du clic sur la croix
    document.querySelectorAll('.marketplace-modal .close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Fermer les modals lors du clic à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('marketplace-modal')) {
            closeAllModals();
        }
    });
    
    // Gestionnaires pour le modal d'achat
    if (document.getElementById('cancel-buy')) {
        document.getElementById('cancel-buy').addEventListener('click', function() {
            buyConfirmModal.classList.remove('open');
        });
    }
    
    if (document.getElementById('confirm-buy')) {
        document.getElementById('confirm-buy').addEventListener('click', function() {
            buyCard();
        });
    }
    
    // Gestionnaires pour le modal de vente
    if (document.getElementById('sell-form')) {
        document.getElementById('sell-form').addEventListener('submit', function(e) {
            e.preventDefault();
            sellCard();
        });
    }
    
    if (document.getElementById('cancel-sell')) {
        document.getElementById('cancel-sell').addEventListener('click', function() {
            sellModal.classList.remove('open');
        });
    }
    
    // Gestionnaires pour le modal de retrait
    if (document.getElementById('cancel-remove')) {
        document.getElementById('cancel-remove').addEventListener('click', function() {
            removeConfirmModal.classList.remove('open');
        });
    }
    
    if (document.getElementById('confirm-remove')) {
        document.getElementById('confirm-remove').addEventListener('click', function() {
            removeCardFromMarket();
        });
    }
    
    // Fermer le toast lors du clic sur la croix
    const toastClose = document.querySelector('.marketplace-toast .toast-close');
    if (toastClose) {
        toastClose.addEventListener('click', function() {
            marketplaceToast.classList.remove('show');
        });
    }
}

/**
 * Charge les cartes du marché avec les filtres spécifiés
 */
function loadMarketCards(page = 1) {
    // Afficher un indicateur de chargement
    cardsGrid.innerHTML = '<div class="loading-spinner">Chargement...</div>';
    
    // Construire l'URL avec les paramètres de filtre
    let url = '/marketplace/api?';
    const params = new URLSearchParams();
    
    params.append('page', page);
    
    if (currentFilters.search) {
        params.append('search', currentFilters.search);
    }
    
    if (currentFilters.rarity) {
        params.append('rarity', currentFilters.rarity);
    }
    
    if (currentFilters.minPrice) {
        params.append('minPrice', currentFilters.minPrice);
    }
    
    if (currentFilters.maxPrice) {
        params.append('maxPrice', currentFilters.maxPrice);
    }
    
    if (currentFilters.sort) {
        params.append('sort', currentFilters.sort);
    }
    
    url += params.toString();
    
    // Faire la requête pour obtenir les cartes
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCards(data.cards);
                updatePagination(data.currentPage, data.totalPages);
                totalCountElement.textContent = data.total;
                
                // Afficher ou masquer le message "Aucune carte trouvée"
                if (data.cards.length === 0) {
                    noCardsMessage.classList.remove('hidden');
                } else {
                    noCardsMessage.classList.add('hidden');
                }
                
                currentPage = data.currentPage;
            } else {
                showToast('error', 'Erreur', data.message || 'Erreur lors du chargement des cartes');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('error', 'Erreur', 'Erreur lors du chargement des cartes');
            cardsGrid.innerHTML = '<div class="error-message">Erreur lors du chargement des cartes</div>';
        });
}

/**
 * Affiche mes cartes en vente
 */
function loadMyListings() {
    // Réinitialiser les filtres visuels mais pas les appliquer
    resetFilterInputs();
    
    // Faire la requête pour obtenir mes cartes en vente
    fetch('/marketplace/api/my-listings')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCards(data.cards);
                // Pas de pagination pour mes cartes
                paginationContainer.innerHTML = '';
                totalCountElement.textContent = data.cards.length;
                
                // Afficher ou masquer le message "Aucune carte trouvée"
                if (data.cards.length === 0) {
                    noCardsMessage.classList.remove('hidden');
                } else {
                    noCardsMessage.classList.add('hidden');
                }
            } else {
                showToast('error', 'Erreur', data.message || 'Erreur lors du chargement de vos cartes');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('error', 'Erreur', 'Erreur lors du chargement de vos cartes');
            cardsGrid.innerHTML = '<div class="error-message">Erreur lors du chargement de vos cartes</div>';
        });
}

/**
 * Affiche les cartes dans la grille
 */
function displayCards(cards) {
    cardsGrid.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.dataset.cardId = card._id;
        
        // Déterminer la classe de rareté
        const rarityClass = card.rarity || 'common';
        const rarityText = getRarityText(card.rarity);
        
        cardElement.innerHTML = `
            <div class="card-header ${rarityClass}">${rarityText}</div>
            <div class="card-img-container">
                <img src="${card.imageUrl}" alt="${card.name}">
                <div class="card-title">${card.name}</div>
            </div>
            <div class="card-info">
                <div class="card-price">${card.price} CRYP</div>
                <button class="card-buy-btn">Acheter</button>
            </div>
        `;
        
        // Ajouter un événement de clic pour ouvrir le modal de détails
        cardElement.addEventListener('click', function(e) {
            // Si le clic n'est pas sur le bouton d'achat
            if (!e.target.classList.contains('card-buy-btn')) {
                openCardDetailModal(card._id);
            }
        });
        
        // Gestionnaire spécifique pour le bouton d'achat
        const buyButton = cardElement.querySelector('.card-buy-btn');
        buyButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêcher la propagation du clic
            openBuyConfirmModal(card._id, card.price);
        });
        
        cardsGrid.appendChild(cardElement);
    });
}

/**
 * Gère la soumission du formulaire de filtres
 */
function handleFilterSubmit(e) {
    e.preventDefault();
    
    // Récupérer les valeurs des filtres
    const formData = new FormData(filterForm);
    currentFilters = {
        search: formData.get('search'),
        rarity: formData.get('rarity'),
        minPrice: formData.get('minPrice'),
        maxPrice: formData.get('maxPrice'),
        sort: formData.get('sort')
    };
    
    // Recharger les cartes avec les nouveaux filtres
    loadMarketCards(1); // Retourner à la première page
}

/**
 * Réinitialise les filtres et recharge les cartes
 */
function resetFilters() {
    // Réinitialiser les valeurs du formulaire
    resetFilterInputs();
    
    // Réinitialiser les filtres actuels
    currentFilters = {
        search: '',
        rarity: '',
        minPrice: '',
        maxPrice: '',
        sort: 'price_asc'
    };
    
    // Recharger les cartes
    loadMarketCards(1);
}

/**
 * Réinitialise les champs du formulaire
 */
function resetFilterInputs() {
    if (filterForm) {
        filterForm.reset();
        
        // S'assurer que les sélects sont aussi réinitialisés
        const selects = filterForm.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });
    }
}

/**
 * Met à jour la pagination
 */
function updatePagination(currentPage, totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        return; // Pas besoin de pagination
    }
    
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Bouton précédent
    if (currentPage > 1) {
        addPaginationItem(ul, currentPage - 1, '«', false);
    }
    
    // Pages
    for (let i = 1; i <= totalPages; i++) {
        // Si on a beaucoup de pages, afficher seulement certaines
        if (
            i === 1 || // Première page
            i === totalPages || // Dernière page
            (i >= currentPage - 1 && i <= currentPage + 1) // Pages autour de la page courante
        ) {
            addPaginationItem(ul, i, i, i === currentPage);
        } else if (
            (i === currentPage - 2 && currentPage > 3) ||
            (i === currentPage + 2 && currentPage < totalPages - 2)
        ) {
            // Ajouter des points de suspension pour indiquer les pages omises
            const li = document.createElement('li');
            li.className = 'pagination-item';
            li.innerHTML = '<span class="pagination-ellipsis">...</span>';
            ul.appendChild(li);
        }
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        addPaginationItem(ul, currentPage + 1, '»', false);
    }
    
    paginationContainer.appendChild(ul);
}

/**
 * Ajoute un élément à la pagination
 */
function addPaginationItem(ul, page, text, isActive) {
    const li = document.createElement('li');
    li.className = 'pagination-item';
    
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'pagination-link' + (isActive ? ' active' : '');
    a.textContent = text;
    
    a.addEventListener('click', function(e) {
        e.preventDefault();
        loadMarketCards(page);
    });
    
    li.appendChild(a);
    ul.appendChild(li);
}

/**
 * Ouvre le modal de détails d'une carte
 */
function openCardDetailModal(cardId) {
    // Mémoriser le cardId courant
    currentCardId = cardId;
    
    // Vider les contenus précédents
    document.getElementById('modal-card-image').src = '';
    document.getElementById('modal-card-name').textContent = '';
    document.getElementById('modal-card-price').textContent = '';
    document.getElementById('modal-card-attack').textContent = '';
    document.getElementById('modal-card-defense').textContent = '';
    document.getElementById('modal-card-magic').textContent = '';
    document.getElementById('modal-card-speed').textContent = '';
    document.getElementById('modal-card-owner-name').textContent = '';
    document.getElementById('modal-card-action').innerHTML = '';
    document.getElementById('card-transaction-history').innerHTML = 'Chargement...';
    
    // Afficher le modal
    cardDetailModal.classList.add('open');
    
    // Charger les détails de la carte
    fetch(`/marketplace/api/card/${cardId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const card = data.card;
                
                // Remplir les informations de la carte
                document.getElementById('modal-card-image').src = card.imageUrl;
                document.getElementById('modal-card-name').textContent = card.name;
                document.getElementById('modal-card-price').textContent = card.price;
                document.getElementById('modal-card-attack').textContent = card.stats.attack;
                document.getElementById('modal-card-defense').textContent = card.stats.defense;
                document.getElementById('modal-card-magic').textContent = card.stats.magic;
                document.getElementById('modal-card-speed').textContent = card.stats.speed;
                
                if (card.owner && card.owner.username) {
                    document.getElementById('modal-card-owner-name').textContent = card.owner.username;
                } else {
                    document.getElementById('modal-card-owner-name').textContent = 'Inconnu';
                }
                
                // Afficher la rareté
                const rarityElement = document.getElementById('modal-card-rarity');
                rarityElement.className = 'card-rarity ' + card.rarity;
                rarityElement.textContent = getRarityText(card.rarity);
                
                // Configurer le bouton d'action selon le statut de la carte
                const actionContainer = document.getElementById('modal-card-action');
                
                if (card.isForSale) {
                    if (data.isOwner) {
                        // C'est ma carte qui est en vente
                        actionContainer.innerHTML = `
                            <button id="remove-card-btn" class="btn-danger btn-block">
                                Retirer du marché
                            </button>
                        `;
                        
                        // Ajouter l'événement pour retirer la carte
                        document.getElementById('remove-card-btn').addEventListener('click', function() {
                            openRemoveConfirmModal(cardId);
                        });
                    } else {
                        // C'est une carte que je peux acheter
                        actionContainer.innerHTML = `
                            <button id="buy-card-btn" class="btn-primary btn-block">
                                Acheter pour ${card.price} CRYP
                            </button>
                        `;
                        
                        // Ajouter l'événement pour acheter la carte
                        document.getElementById('buy-card-btn').addEventListener('click', function() {
                            openBuyConfirmModal(cardId, card.price);
                        });
                    }
                } else if (data.isOwner) {
                    // C'est ma carte que je peux mettre en vente
                    actionContainer.innerHTML = `
                        <button id="sell-card-btn" class="btn-primary btn-block">
                            Mettre en vente
                        </button>
                    `;
                    
                    // Ajouter l'événement pour mettre la carte en vente
                    document.getElementById('sell-card-btn').addEventListener('click', function() {
                        openSellModal(cardId);
                    });
                } else {
                    // Carte non disponible
                    actionContainer.innerHTML = `
                        <div class="card-not-for-sale">
                            Cette carte n'est pas en vente
                        </div>
                    `;
                }
                
                // Afficher l'historique des transactions
                const transactionHistory = document.getElementById('card-transaction-history');
                
                if (data.transactions && data.transactions.length > 0) {
                    let transactionsHtml = '';
                    
                    data.transactions.forEach(transaction => {
                        const date = new Date(transaction.timestamp);
                        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                        
                        transactionsHtml += `
                            <div class="transaction-item">
                                <div class="transaction-date">${formattedDate}</div>
                                <div class="transaction-detail">
                                    <span class="transaction-users">
                                        ${transaction.seller ? transaction.seller.username : 'Inconnu'} → 
                                        ${transaction.buyer ? transaction.buyer.username : 'Inconnu'}
                                    </span>
                                    <span class="transaction-price">${transaction.price} CRYP</span>
                                </div>
                            </div>
                        `;
                    });
                    
                    transactionHistory.innerHTML = transactionsHtml;
                } else {
                    transactionHistory.innerHTML = `
                        <div class="transaction-empty">
                            Aucune transaction enregistrée pour cette carte.
                        </div>
                    `;
                }
            } else {
                showToast('error', 'Erreur', data.message || 'Erreur lors du chargement des détails de la carte');
                closeAllModals();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('error', 'Erreur', 'Erreur lors du chargement des détails de la carte');
            closeAllModals();
        });
}

/**
 * Ouvre le modal de confirmation d'achat
 */
function openBuyConfirmModal(cardId, price) {
    currentCardId = cardId;
    document.getElementById('confirm-price').textContent = price;
    
    // Fermer les autres modals
    cardDetailModal.classList.remove('open');
    sellModal.classList.remove('open');
    removeConfirmModal.classList.remove('open');
    
    // Ouvrir le modal d'achat
    buyConfirmModal.classList.add('open');
}

/**
 * Ouvre le modal de mise en vente
 */
function openSellModal(cardId) {
    currentCardId = cardId;
    
    // Réinitialiser le formulaire
    if (document.getElementById('sell-form')) {
        document.getElementById('sell-form').reset();
    }
    
    // Fermer les autres modals
    cardDetailModal.classList.remove('open');
    buyConfirmModal.classList.remove('open');
    removeConfirmModal.classList.remove('open');
    
    // Ouvrir le modal de vente
    sellModal.classList.add('open');
}

/**
 * Ouvre le modal de confirmation de retrait
 */
function openRemoveConfirmModal(cardId) {
    currentCardId = cardId;
    
    // Fermer les autres modals
    cardDetailModal.classList.remove('open');
    buyConfirmModal.classList.remove('open');
    sellModal.classList.remove('open');
    
    // Ouvrir le modal de retrait
    removeConfirmModal.classList.add('open');
}

/**
 * Ferme tous les modals
 */
function closeAllModals() {
    cardDetailModal.classList.remove('open');
    buyConfirmModal.classList.remove('open');
    sellModal.classList.remove('open');
    removeConfirmModal.classList.remove('open');
}

/**
 * Affiche un toast de notification
 */
function showToast(type, title, message) {
    const toastIcon = document.getElementById('toast-icon');
    const toastTitle = document.getElementById('toast-title');
    const toastText = document.getElementById('toast-text');
    
    // Configurer le toast selon le type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle toast-icon success';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle toast-icon error';
    }
    
    toastTitle.textContent = title;
    toastText.textContent = message;
    
    // Afficher le toast
    marketplaceToast.classList.add('show');
    
    // Masquer le toast après 5 secondes
    setTimeout(() => {
        marketplaceToast.classList.remove('show');
    }, 5000);
}

/**
 * Achète une carte
 */
function buyCard() {
    if (!currentCardId) return;
    
    // Faire la requête pour acheter la carte
    fetch('/marketplace/api/buy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId: currentCardId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Succès', 'Carte achetée avec succès !');
            closeAllModals();
            // Recharger les cartes
            loadMarketCards(currentPage);
        } else {
            showToast('error', 'Erreur', data.message || 'Erreur lors de l\'achat de la carte');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showToast('error', 'Erreur', 'Erreur lors de l\'achat de la carte');
    });
}

/**
 * Met une carte en vente
 */
function sellCard() {
    if (!currentCardId) return;
    
    const price = document.getElementById('price').value;
    
    if (!price || price <= 0) {
        showToast('error', 'Erreur', 'Veuillez entrer un prix valide supérieur à 0');
        return;
    }
    
    // Faire la requête pour mettre la carte en vente
    fetch('/marketplace/api/sell', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId: currentCardId, price })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Succès', 'Carte mise en vente avec succès !');
            closeAllModals();
            // Recharger les cartes
            loadMarketCards(currentPage);
        } else {
            showToast('error', 'Erreur', data.message || 'Erreur lors de la mise en vente de la carte');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showToast('error', 'Erreur', 'Erreur lors de la mise en vente de la carte');
    });
}

/**
 * Retire une carte du marché
 */
function removeCardFromMarket() {
    if (!currentCardId) return;
    
    // Faire la requête pour retirer la carte du marché
    fetch(`/marketplace/api/card/${currentCardId}/listing`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Succès', 'Carte retirée du marché avec succès !');
            closeAllModals();
            // Recharger les cartes
            loadMarketCards(currentPage);
        } else {
            showToast('error', 'Erreur', data.message || 'Erreur lors du retrait de la carte du marché');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showToast('error', 'Erreur', 'Erreur lors du retrait de la carte du marché');
    });
}

/**
 * Retourne le texte correspondant à la rareté
 */
function getRarityText(rarity) {
    switch (rarity) {
        case 'legendary': return 'Légendaire';
        case 'epic': return 'Épique';
        case 'rare': return 'Rare';
        case 'common': 
        default: return 'Commune';
    }
}
