/**
 * Gestion dynamique des cartes de l'utilisateur
 * Récupère les cartes depuis la base de données via l'API
 */

// Variables globales pour la gestion des cartes
let userCards = [];
let collectionStats = null;
let currentPage = 1;
const cardsPerPage = 16;
let totalPages = 1;
let currentFilters = {
    rarity: 'all',
    search: '',
    sale: 'all'
};
let currentSort = {
    by: 'name',
    order: 'asc'
};
let selectedCards = new Set();

// Fonction d'initialisation appelée au chargement de la page
document.addEventListener('DOMContentLoaded', function() {    
    // Configuration des écouteurs d'événements
    setupEventListeners();
    
    // Écouteur pour le changement de section vers la collection
    document.addEventListener('sectionChanged', function(event) {
        if (event.detail && event.detail.section === 'collection') {
            loadUserCollection();
        }
    });
    
    // Si la section collection est déjà active au chargement
    if (document.getElementById('section-collection') && !document.getElementById('section-collection').classList.contains('hidden')) {
        loadUserCollection();
    }
});

/**
 * Configuration de tous les écouteurs d'événements
 */
function setupEventListeners() {
    setupFilterSortListeners();
    setupPaginationListeners();
    setupActionListeners();
}

/**
 * Configuration des écouteurs d'événements pour les filtres et le tri
 */
function setupFilterSortListeners() {
    // Toggle du dropdown de filtres
    const filterBtn = document.getElementById('filter-cards');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', function() {
            filterDropdown.classList.toggle('hidden');
            // Fermer le dropdown de tri si ouvert
            const sortDropdown = document.getElementById('sort-dropdown');
            if (sortDropdown) {
                sortDropdown.classList.add('hidden');
            }
        });
    }
    
    // Toggle du dropdown de tri
    const sortBtn = document.getElementById('sort-cards');
    const sortDropdown = document.getElementById('sort-dropdown');
    
    if (sortBtn && sortDropdown) {
        sortBtn.addEventListener('click', function() {
            sortDropdown.classList.toggle('hidden');
            // Fermer le dropdown de filtres si ouvert
            if (filterDropdown) {
                filterDropdown.classList.add('hidden');
            }
        });
    }
    
    // Appliquer les filtres
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            filterDropdown.classList.add('hidden');
        });
    }
    
    // Appliquer le tri
    const applySortBtn = document.getElementById('apply-sort');
    if (applySortBtn) {
        applySortBtn.addEventListener('click', function() {
            applySort();
            sortDropdown.classList.add('hidden');
        });
    }
    
    // Recherche en temps réel
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300); // Délai de 300ms pour éviter trop de requêtes
        });
    }
    
    // Réinitialiser les filtres
    const resetFiltersBtn = document.getElementById('reset-filters');
    const resetAllFiltersBtn = document.getElementById('reset-all-filters');
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFiltersAndSort);
    }
    
    if (resetAllFiltersBtn) {
        resetAllFiltersBtn.addEventListener('click', resetAllFiltersAndSort);
    }
}

/**
 * Configuration des écouteurs d'événements pour la pagination
 */
function setupPaginationListeners() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadUserCards();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadUserCards();
            }
        });
    }
}

/**
 * Configuration des écouteurs d'événements pour les actions
 */
function setupActionListeners() {
    // Bouton actualiser
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadUserCollection();
        });
    }
    
    // Bouton vendre cartes sélectionnées
    const sellSelectedBtn = document.getElementById('btn-sell-selected');
    if (sellSelectedBtn) {
        sellSelectedBtn.addEventListener('click', function() {
            sellSelectedCards();
        });
    }
    
    // Bouton acheter booster
    const buyPackBtn = document.getElementById('buy-pack');
    if (buyPackBtn) {
        buyPackBtn.addEventListener('click', function() {
            // Naviguer vers le shop
            if (window.showSection) {
                window.showSection('shop');
            }
        });
    }
    
    // Bouton visiter marketplace
    const visitMarketBtn = document.getElementById('visit-marketplace');
    if (visitMarketBtn) {
        visitMarketBtn.addEventListener('click', function() {
            // Naviguer vers le marketplace
            if (window.showSection) {
                window.showSection('marketplace');
            }
        });
    }
}

/**
 * Charge la collection complète de l'utilisateur (statistiques + cartes)
 */
async function loadUserCollection() {
    try {
        showLoading();
        
        // Charger les statistiques et les cartes en parallèle
        const [statsResponse, cardsResponse] = await Promise.all([
            loadCollectionStats(),
            loadUserCards()
        ]);
        
        hideLoading();
        
        if (statsResponse.success) {
            updateStatsDisplay(statsResponse.stats);
        }
        
        if (cardsResponse.success) {
            updateCardsDisplay(cardsResponse);
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement de la collection:', error);
        hideLoading();
        showError('Erreur lors du chargement de votre collection');
    }
}

/**
 * Charge les statistiques de la collection depuis l'API
 */
async function loadCollectionStats() {
    try {
        const response = await fetch('/api/v1/users/me/cards/stats', {
            method: 'GET',
            headers: apiService.getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Charge les cartes de l'utilisateur avec filtres et pagination
 */
async function loadUserCards() {
    try {
        // Construire les paramètres de requête
        const params = new URLSearchParams({
            page: currentPage,
            limit: cardsPerPage,
            sort: currentSort.by,
            order: currentSort.order
        });
        
        // Ajouter les filtres
        if (currentFilters.rarity !== 'all') {
            params.append('rarity', currentFilters.rarity);
        }
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/v1/users/me/cards?${params.toString()}`, {
            method: 'GET',
            headers: apiService.getAuthHeaders()
        });
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Met à jour l'affichage des statistiques
 */
function updateStatsDisplay(stats) {
    // Statistiques générales
    const totalCardsElem = document.getElementById('total-cards-count');
    const winsElem = document.getElementById('wins-count');
    const lossesElem = document.getElementById('losses-count');
    const rankElem = document.getElementById('current-rank');
    
    if (totalCardsElem) totalCardsElem.textContent = stats.totalCards || 0;
    if (winsElem) winsElem.textContent = stats.gameStats.wins || 0;
    if (lossesElem) lossesElem.textContent = stats.gameStats.losses || 0;
    if (rankElem) rankElem.textContent = stats.gameStats.currentRank || 'Non classé';
    
    // Statistiques par rareté
    if (stats.rarityStats) {
        const commonElem = document.getElementById('common-count');
        const rareElem = document.getElementById('rare-count');
        const epicElem = document.getElementById('epic-count');
        const legendaryElem = document.getElementById('legendary-count');
        
        if (commonElem) commonElem.textContent = stats.rarityStats.common || 0;
        if (rareElem) rareElem.textContent = stats.rarityStats.rare || 0;
        if (epicElem) epicElem.textContent = stats.rarityStats.epic || 0;
        if (legendaryElem) legendaryElem.textContent = stats.rarityStats.legendary || 0;
        
        // Afficher les statistiques si l'utilisateur a des cartes
        if (stats.totalCards > 0) {
            const rarityStatsElem = document.getElementById('rarity-stats');
            if (rarityStatsElem) {
                rarityStatsElem.classList.remove('hidden');
            }
        }
    }
    
    collectionStats = stats;
}

/**
 * Met à jour l'affichage des cartes
 */
function updateCardsDisplay(response) {
    const cardsGrid = document.getElementById('cards-grid');
    const noCardsSection = document.getElementById('no-cards-section');
    const noResultsSection = document.getElementById('no-results-section');
    
    // Cacher toutes les sections
    if (cardsGrid) cardsGrid.classList.add('hidden');
    if (noCardsSection) noCardsSection.classList.add('hidden');
    if (noResultsSection) noResultsSection.classList.add('hidden');
    
    if (!response.success) {
        showError(response.message);
        return;
    }
    
    userCards = response.cards || [];
    totalPages = response.totalPages || 1;
    currentPage = response.currentPage || 1;
    
    // Si aucune carte
    if (response.total === 0) {
        if (noCardsSection) noCardsSection.classList.remove('hidden');
        return;
    }
    
    // Si aucun résultat avec les filtres actuels
    if (userCards.length === 0) {
        if (noResultsSection) noResultsSection.classList.remove('hidden');
        return;
    }
    
    // Afficher les cartes
    if (cardsGrid) cardsGrid.classList.remove('hidden');
    renderCards();
    updatePagination();
}

/**
 * Rend les cartes dans la grille
 */
function renderCards() {
    const cardsGrid = document.getElementById('cards-grid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    userCards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsGrid.appendChild(cardElement);
    });
}

/**
 * Crée un élément de carte
 */
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card-item ${card.rarity}`;
    cardDiv.dataset.cardId = card._id;
    
    // Ajouter une classe si la carte est sélectionnée
    if (selectedCards.has(card._id)) {
        cardDiv.classList.add('selected');
    }
    
    cardDiv.innerHTML = `
        <div class="card-image">
            <img src="${card.imageUrl}" alt="${card.name}" class="card-artwork" loading="lazy">
            ${card.isForSale ? `<div class="card-sale-indicator">En vente - ${card.price} EFC</div>` : ''}
        </div>
        <div class="card-info">
            <h3>${card.name}</h3>
            <p class="card-description">${card.description || ''}</p>
            <div class="card-stats">
                <div class="card-stat">
                    <div class="card-stat-value">${card.stats.attack}</div>
                    <div class="card-stat-label">ATK</div>
                </div>
                <div class="card-stat">
                    <div class="card-stat-value">${card.stats.defense}</div>
                    <div class="card-stat-label">DEF</div>
                </div>
                <div class="card-stat">
                    <div class="card-stat-value">${card.stats.magic}</div>
                    <div class="card-stat-label">MAG</div>
                </div>
                <div class="card-stat">
                    <div class="card-stat-value">${card.stats.speed}</div>
                    <div class="card-stat-label">SPD</div>
                </div>
            </div>
        </div>
    `;
    
    // Événements de clic
    cardDiv.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
            // Sélection multiple avec Ctrl/Cmd
            toggleCardSelection(card._id);
        } else {
            // Afficher les détails de la carte
            showCardDetails(card);
        }
    });
    
    return cardDiv;
}

/**
 * Bascule la sélection d'une carte
 */
function toggleCardSelection(cardId) {
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    
    if (selectedCards.has(cardId)) {
        selectedCards.delete(cardId);
        if (cardElement) cardElement.classList.remove('selected');
    } else {
        selectedCards.add(cardId);
        if (cardElement) cardElement.classList.add('selected');
    }
    
    // Mettre à jour l'état du bouton de vente
    updateSellButtonState();
}

/**
 * Met à jour l'état du bouton de vente
 */
function updateSellButtonState() {
    const sellBtn = document.getElementById('btn-sell-selected');
    if (sellBtn) {
        sellBtn.disabled = selectedCards.size === 0;
        sellBtn.textContent = selectedCards.size > 0 
            ? `Vendre ${selectedCards.size} cartes` 
            : 'Vendre sélectionnées';
    }
}

/**
 * Met à jour l'affichage de la pagination
 */
function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        return;
    }
    
    paginationContainer.classList.remove('hidden');
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

/**
 * Applique les filtres
 */
function applyFilters() {
    // Récupérer les valeurs des filtres
    const raritySelect = document.getElementById('filter-rarity');
    const searchInput = document.getElementById('filter-search');
    const saleSelect = document.getElementById('filter-sale');
    
    if (raritySelect) currentFilters.rarity = raritySelect.value;
    if (searchInput) currentFilters.search = searchInput.value.trim();
    if (saleSelect) currentFilters.sale = saleSelect.value;
    
    // Réinitialiser à la première page
    currentPage = 1;
    
    // Recharger les cartes
    loadUserCards().then(response => {
        if (response.success) {
            updateCardsDisplay(response);
        }
    });
}

/**
 * Applique le tri
 */
function applySort() {
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    
    if (sortBySelect) currentSort.by = sortBySelect.value;
    if (sortOrderSelect) currentSort.order = sortOrderSelect.value;
    
    // Réinitialiser à la première page
    currentPage = 1;
    
    // Recharger les cartes
    loadUserCards().then(response => {
        if (response.success) {
            updateCardsDisplay(response);
        }
    });
}

/**
 * Réinitialise tous les filtres et le tri
 */
function resetAllFiltersAndSort() {
    // Réinitialiser les valeurs des filtres dans l'interface
    const filterRarity = document.getElementById('filter-rarity');
    const filterSearch = document.getElementById('filter-search');
    const filterSale = document.getElementById('filter-sale');
    const sortBy = document.getElementById('sort-by');
    const sortOrder = document.getElementById('sort-order');
    
    if (filterRarity) filterRarity.value = 'all';
    if (filterSearch) filterSearch.value = '';
    if (filterSale) filterSale.value = 'all';
    if (sortBy) sortBy.value = 'name';
    if (sortOrder) sortOrder.value = 'asc';
    
    // Réinitialiser les valeurs internes
    currentFilters = {
        rarity: 'all',
        search: '',
        sale: 'all'
    };
    
    currentSort = {
        by: 'name',
        order: 'asc'
    };
    
    currentPage = 1;
    
    // Fermer les dropdowns
    const filterDropdown = document.getElementById('filter-dropdown');
    const sortDropdown = document.getElementById('sort-dropdown');
    
    if (filterDropdown) filterDropdown.classList.add('hidden');
    if (sortDropdown) sortDropdown.classList.add('hidden');
    
    // Recharger les cartes
    loadUserCards().then(response => {
        if (response.success) {
            updateCardsDisplay(response);
        }
    });
}

/**
 * Vend les cartes sélectionnées
 */
async function sellSelectedCards() {
    if (selectedCards.size === 0) {
        showError('Aucune carte sélectionnée');
        return;
    }
    
    // Demander le prix de vente
    const price = prompt('Prix de vente pour chaque carte (en EFC):');
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
        showError('Prix invalide');
        return;
    }
    
    const priceValue = parseFloat(price);
    let successCount = 0;
    let errorCount = 0;
    
    // Mettre en vente chaque carte sélectionnée
    for (const cardId of selectedCards) {
        try {
            const response = await fetch(`/api/v1/users/me/cards/${cardId}/sale`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...apiService.getAuthHeaders()
                },
                body: JSON.stringify({
                    isForSale: true,
                    price: priceValue
                })
            });
            
            const result = await response.json();
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                console.error(`Erreur pour la carte ${cardId}:`, result.message);
            }
        } catch (error) {
            errorCount++;
            console.error(`Erreur lors de la mise en vente de la carte ${cardId}:`, error);
        }
    }
    
    // Afficher le résultat
    if (successCount > 0) {
        showSuccess(`${successCount} carte(s) mise(s) en vente avec succès`);
    }
    if (errorCount > 0) {
        showError(`${errorCount} carte(s) n'ont pas pu être mises en vente`);
    }
    
    // Réinitialiser la sélection et recharger
    selectedCards.clear();
    updateSellButtonState();
    loadUserCards().then(response => {
        if (response.success) {
            updateCardsDisplay(response);
        }
    });
}

/**
 * Affiche les détails d'une carte
 */
function showCardDetails(card) {
    // Utiliser le système de modal existant si disponible
    if (window.showCardDetails && typeof window.showCardDetails === 'function') {
        window.showCardDetails(card);
    } else {
        // Fallback: afficher les détails dans une alerte
        alert(`
Carte: ${card.name}
Rareté: ${card.rarity}
Attaque: ${card.stats.attack}
Défense: ${card.stats.defense}
Magie: ${card.stats.magic}
Vitesse: ${card.stats.speed}
${card.isForSale ? `En vente pour ${card.price} EFC` : 'Pas en vente'}
        `);
    }
}

/**
 * Affiche l'indicateur de chargement
 */
function showLoading() {
    const loadingIndicator = document.getElementById('cards-loading');
    const cardsGrid = document.getElementById('cards-grid');
    const noCardsSection = document.getElementById('no-cards-section');
    const noResultsSection = document.getElementById('no-results-section');
    
    // Cacher tout le reste
    if (cardsGrid) cardsGrid.classList.add('hidden');
    if (noCardsSection) noCardsSection.classList.add('hidden');
    if (noResultsSection) noResultsSection.classList.add('hidden');
    
    // Afficher le chargement
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
}

/**
 * Masque l'indicateur de chargement
 */
function hideLoading() {
    const loadingIndicator = document.getElementById('cards-loading');
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
    // Supprimer les anciens messages
    removeMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insérer le message après le header
    const header = document.querySelector('.collection-header');
    if (header) {
        header.insertAdjacentElement('afterend', errorDiv);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

/**
 * Affiche un message de succès
 */
function showSuccess(message) {
    // Supprimer les anciens messages
    removeMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insérer le message après le header
    const header = document.querySelector('.collection-header');
    if (header) {
        header.insertAdjacentElement('afterend', successDiv);
        
        // Supprimer automatiquement après 3 secondes
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

/**
 * Supprime tous les messages d'erreur/succès
 */
function removeMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

// Exposer les fonctions globalement pour compatibilité
window.loadUserCards = loadUserCollection;
window.showCardDetails = showCardDetails;