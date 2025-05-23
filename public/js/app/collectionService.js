/**
 * Service pour la gestion dynamique de la collection de cartes
 * Récupère les cartes depuis la base de données via l'API
 */

const collectionService = {
    // Cache des cartes de l'utilisateur
    userCards: [],
    filteredCards: [],
    collectionStats: null,
    
    // État actuel des filtres et tri
    currentFilters: {
        rarity: 'all',
        search: '',
        sale: 'all'
    },
    currentSort: {
        by: 'name',
        order: 'asc'
    },
    
    // Pagination
    currentPage: 1,
    cardsPerPage: 16,
    totalPages: 1,
    
    // État de sélection des cartes
    selectedCards: new Set(),
    
    // Initialiser le service
    initialize() {
        this.setupEventListeners();
        
        // Charger les cartes si la section collection est visible
        if (document.getElementById('section-collection').classList.contains('active')) {
            this.loadUserCollection();
        }
    },
    
    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Boutons de filtre et tri
        this.setupFilterEvents();
        this.setupSortEvents();
        this.setupPaginationEvents();
        this.setupActionEvents();
        
        // Navigation vers la collection
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'collection') {
                this.loadUserCollection();
            }
        });
    },
    
    // Configuration des événements de filtres
    setupFilterEvents() {
        const filterBtn = document.getElementById('filter-cards');
        const filterDropdown = document.getElementById('filter-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const resetFiltersBtn = document.getElementById('reset-filters');
        const resetAllFiltersBtn = document.getElementById('reset-all-filters');
        
        // Toggle du dropdown de filtres
        if (filterBtn && filterDropdown) {
            filterBtn.addEventListener('click', () => {
                filterDropdown.classList.toggle('hidden');
                // Fermer le dropdown de tri si ouvert
                document.getElementById('sort-dropdown').classList.add('hidden');
            });
        }
        
        // Appliquer les filtres
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
                filterDropdown.classList.add('hidden');
            });
        }
        
        // Recherche en temps réel
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300); // Délai de 300ms pour éviter trop de requêtes
            });
        }
        
        // Réinitialiser les filtres
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        if (resetAllFiltersBtn) {
            resetAllFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    },
    
    // Configuration des événements de tri
    setupSortEvents() {
        const sortBtn = document.getElementById('sort-cards');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applySortBtn = document.getElementById('apply-sort');
        
        // Toggle du dropdown de tri
        if (sortBtn && sortDropdown) {
            sortBtn.addEventListener('click', () => {
                sortDropdown.classList.toggle('hidden');
                // Fermer le dropdown de filtres si ouvert
                document.getElementById('filter-dropdown').classList.add('hidden');
            });
        }
        
        // Appliquer le tri
        if (applySortBtn) {
            applySortBtn.addEventListener('click', () => {
                this.applySort();
                sortDropdown.classList.add('hidden');
            });
        }
    },
    
    // Configuration des événements de pagination
    setupPaginationEvents() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadUserCards();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.loadUserCards();
                }
            });
        }
    },
    
    // Configuration des événements d'actions
    setupActionEvents() {
        const refreshBtn = document.getElementById('btn-refresh');
        const sellSelectedBtn = document.getElementById('btn-sell-selected');
        const buyPackBtn = document.getElementById('buy-pack');
        const visitMarketBtn = document.getElementById('visit-marketplace');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadUserCollection();
            });
        }
        
        if (sellSelectedBtn) {
            sellSelectedBtn.addEventListener('click', () => {
                this.sellSelectedCards();
            });
        }
        
        if (buyPackBtn) {
            buyPackBtn.addEventListener('click', () => {
                // Naviguer vers le shop
                this.navigateToSection('shop');
            });
        }
        
        if (visitMarketBtn) {
            visitMarketBtn.addEventListener('click', () => {
                // Naviguer vers le marketplace
                this.navigateToSection('marketplace');
            });
        }
    },
    
    // Charger la collection complète de l'utilisateur
    async loadUserCollection() {
        try {
            this.showLoading();
            
            // Charger les statistiques et les cartes en parallèle
            const [statsResponse, cardsResponse] = await Promise.all([
                this.loadCollectionStats(),
                this.loadUserCards()
            ]);
            
            this.hideLoading();
            
            if (statsResponse.success) {
                this.updateStatsDisplay(statsResponse.stats);
            }
            
            if (cardsResponse.success) {
                this.updateCardsDisplay(cardsResponse);
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement de la collection:', error);
            this.hideLoading();
            this.showError('Erreur lors du chargement de votre collection');
        }
    },
    
    // Charger les statistiques de la collection
    async loadCollectionStats() {
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
    },
    
    // Charger les cartes de l'utilisateur avec filtres et pagination
    async loadUserCards() {
        try {
            // Construire les paramètres de requête
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.cardsPerPage,
                sort: this.currentSort.by,
                order: this.currentSort.order
            });
            
            // Ajouter les filtres
            if (this.currentFilters.rarity !== 'all') {
                params.append('rarity', this.currentFilters.rarity);
            }
            
            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
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
    },
    
    // Mettre à jour l'affichage des statistiques
    updateStatsDisplay(stats) {
        // Statistiques générales
        document.getElementById('total-cards-count').textContent = stats.totalCards || 0;
        document.getElementById('wins-count').textContent = stats.gameStats.wins || 0;
        document.getElementById('losses-count').textContent = stats.gameStats.losses || 0;
        document.getElementById('current-rank').textContent = stats.gameStats.currentRank || 'Non classé';
        
        // Statistiques par rareté
        if (stats.rarityStats) {
            document.getElementById('common-count').textContent = stats.rarityStats.common || 0;
            document.getElementById('rare-count').textContent = stats.rarityStats.rare || 0;
            document.getElementById('epic-count').textContent = stats.rarityStats.epic || 0;
            document.getElementById('legendary-count').textContent = stats.rarityStats.legendary || 0;
            
            // Afficher les statistiques si l'utilisateur a des cartes
            if (stats.totalCards > 0) {
                document.getElementById('rarity-stats').classList.remove('hidden');
            }
        }
        
        this.collectionStats = stats;
    },
    
    // Mettre à jour l'affichage des cartes
    updateCardsDisplay(response) {
        const cardsGrid = document.getElementById('cards-grid');
        const noCardsSection = document.getElementById('no-cards-section');
        const noResultsSection = document.getElementById('no-results-section');
        
        // Cacher toutes les sections
        cardsGrid.classList.add('hidden');
        noCardsSection.classList.add('hidden');
        noResultsSection.classList.add('hidden');
        
        if (!response.success) {
            this.showError(response.message);
            return;
        }
        
        this.userCards = response.cards || [];
        this.totalPages = response.totalPages || 1;
        this.currentPage = response.currentPage || 1;
        
        // Si aucune carte
        if (response.total === 0) {
            noCardsSection.classList.remove('hidden');
            return;
        }
        
        // Si aucun résultat avec les filtres actuels
        if (this.userCards.length === 0) {
            noResultsSection.classList.remove('hidden');
            return;
        }
        
        // Afficher les cartes
        cardsGrid.classList.remove('hidden');
        this.renderCards();
        this.updatePagination();
    },
    
    // Rendre les cartes dans la grille
    renderCards() {
        const cardsGrid = document.getElementById('cards-grid');
        cardsGrid.innerHTML = '';
        
        this.userCards.forEach(card => {
            const cardElement = this.createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
    },
    
    // Créer un élément de carte
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.rarity}`;
        cardDiv.dataset.cardId = card._id;
        
        // Ajouter une classe si la carte est sélectionnée
        if (this.selectedCards.has(card._id)) {
            cardDiv.classList.add('selected');
        }
        
        cardDiv.innerHTML = `
            <div class=\"card-image\">
                <img src=\"${card.imageUrl}\" alt=\"${card.name}\" class=\"card-artwork\" loading=\"lazy\">
                ${card.isForSale ? `<div class=\"card-sale-indicator\">En vente - ${card.price} EFC</div>` : ''}
            </div>
            <div class=\"card-info\">
                <h3>${card.name}</h3>
                <p class=\"card-description\">${card.description || ''}</p>
                <div class=\"card-stats\">
                    <div class=\"card-stat\">
                        <div class=\"card-stat-value\">${card.stats.attack}</div>
                        <div class=\"card-stat-label\">ATK</div>
                    </div>
                    <div class=\"card-stat\">
                        <div class=\"card-stat-value\">${card.stats.defense}</div>
                        <div class=\"card-stat-label\">DEF</div>
                    </div>
                    <div class=\"card-stat\">
                        <div class=\"card-stat-value\">${card.stats.magic}</div>
                        <div class=\"card-stat-label\">MAG</div>
                    </div>
                    <div class=\"card-stat\">
                        <div class=\"card-stat-value\">${card.stats.speed}</div>
                        <div class=\"card-stat-label\">SPD</div>
                    </div>
                </div>
            </div>
        `;
        
        // Événements de clic
        cardDiv.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                // Sélection multiple avec Ctrl/Cmd
                this.toggleCardSelection(card._id);
            } else {
                // Afficher les détails de la carte
                this.showCardDetails(card);
            }
        });
        
        return cardDiv;
    },
    
    // Basculer la sélection d'une carte
    toggleCardSelection(cardId) {
        const cardElement = document.querySelector(`[data-card-id=\"${cardId}\"]`);
        
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
            cardElement.classList.remove('selected');
        } else {
            this.selectedCards.add(cardId);
            cardElement.classList.add('selected');
        }
        
        // Mettre à jour l'état du bouton de vente
        this.updateSellButtonState();
    },
    
    // Mettre à jour l'état du bouton de vente
    updateSellButtonState() {
        const sellBtn = document.getElementById('btn-sell-selected');
        if (sellBtn) {
            sellBtn.disabled = this.selectedCards.size === 0;
            sellBtn.textContent = this.selectedCards.size > 0 
                ? `Vendre ${this.selectedCards.size} cartes` 
                : 'Vendre sélectionnées';
        }
    },
    
    // Mettre à jour la pagination
    updatePagination() {
        const paginationContainer = document.getElementById('pagination-container');
        const currentPageSpan = document.getElementById('current-page');
        const totalPagesSpan = document.getElementById('total-pages');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (this.totalPages <= 1) {
            paginationContainer.classList.add('hidden');
            return;
        }
        
        paginationContainer.classList.remove('hidden');
        currentPageSpan.textContent = this.currentPage;
        totalPagesSpan.textContent = this.totalPages;
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= this.totalPages;
    },
    
    // Appliquer les filtres
    applyFilters() {
        // Récupérer les valeurs des filtres
        this.currentFilters.rarity = document.getElementById('filter-rarity').value;
        this.currentFilters.search = document.getElementById('filter-search').value.trim();
        this.currentFilters.sale = document.getElementById('filter-sale').value;
        
        // Réinitialiser à la première page
        this.currentPage = 1;
        
        // Recharger les cartes
        this.loadUserCards().then(response => {
            if (response.success) {
                this.updateCardsDisplay(response);
            }
        });
    },
    
    // Appliquer le tri
    applySort() {
        this.currentSort.by = document.getElementById('sort-by').value;
        this.currentSort.order = document.getElementById('sort-order').value;
        
        // Réinitialiser à la première page
        this.currentPage = 1;
        
        // Recharger les cartes
        this.loadUserCards().then(response => {
            if (response.success) {
                this.updateCardsDisplay(response);
            }
        });
    },
    
    // Réinitialiser les filtres
    resetFilters() {
        // Réinitialiser les valeurs des filtres dans l'interface
        document.getElementById('filter-rarity').value = 'all';
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-sale').value = 'all';
        document.getElementById('sort-by').value = 'name';
        document.getElementById('sort-order').value = 'asc';
        
        // Réinitialiser les valeurs internes
        this.currentFilters = {
            rarity: 'all',
            search: '',
            sale: 'all'
        };
        this.currentSort = {
            by: 'name',
            order: 'asc'
        };
        this.currentPage = 1;
        
        // Fermer les dropdowns
        document.getElementById('filter-dropdown').classList.add('hidden');
        document.getElementById('sort-dropdown').classList.add('hidden');
        
        // Recharger les cartes
        this.loadUserCards().then(response => {
            if (response.success) {
                this.updateCardsDisplay(response);
            }
        });
    },
    
    // Vendre les cartes sélectionnées
    async sellSelectedCards() {
        if (this.selectedCards.size === 0) {
            this.showError('Aucune carte sélectionnée');
            return;
        }
        
        // Demander le prix de vente
        const price = prompt('Prix de vente pour chaque carte (en EFC):');
        if (!price || isNaN(price) || parseFloat(price) <= 0) {
            this.showError('Prix invalide');
            return;
        }
        
        const priceValue = parseFloat(price);
        let successCount = 0;
        let errorCount = 0;
        
        // Mettre en vente chaque carte sélectionnée
        for (const cardId of this.selectedCards) {
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
            this.showSuccess(`${successCount} carte(s) mise(s) en vente avec succès`);
        }
        if (errorCount > 0) {
            this.showError(`${errorCount} carte(s) n'ont pas pu être mises en vente`);
        }
        
        // Réinitialiser la sélection et recharger
        this.selectedCards.clear();
        this.updateSellButtonState();
        this.loadUserCards().then(response => {
            if (response.success) {
                this.updateCardsDisplay(response);
            }
        });
    },
    
    // Afficher les détails d'une carte
    showCardDetails(card) {
        // Utiliser le système de modal existant ou créer une popup
        if (window.showCardDetails) {
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
    },
    
    // Naviguer vers une autre section
    navigateToSection(sectionName) {
        // Utiliser le système de navigation existant
        if (window.showSection) {
            window.showSection(sectionName);
        } else {
            // Fallback: émettre un événement personnalisé
            document.dispatchEvent(new CustomEvent('navigateToSection', {
                detail: { section: sectionName }
            }));
        }
    },
    
    // Afficher l'indicateur de chargement
    showLoading() {
        const loadingIndicator = document.getElementById('cards-loading');
        const cardsGrid = document.getElementById('cards-grid');
        const noCardsSection = document.getElementById('no-cards-section');
        const noResultsSection = document.getElementById('no-results-section');
        
        // Cacher tout le reste
        cardsGrid.classList.add('hidden');
        noCardsSection.classList.add('hidden');
        noResultsSection.classList.add('hidden');
        
        // Afficher le chargement
        loadingIndicator.classList.remove('hidden');
    },
    
    // Masquer l'indicateur de chargement
    hideLoading() {
        const loadingIndicator = document.getElementById('cards-loading');
        loadingIndicator.classList.add('hidden');
    },
    
    // Afficher un message d'erreur
    showError(message) {
        // Supprimer les anciens messages
        this.removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insérer le message après le header
        const header = document.querySelector('.collection-header');
        header.insertAdjacentElement('afterend', errorDiv);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },
    
    // Afficher un message de succès
    showSuccess(message) {
        // Supprimer les anciens messages
        this.removeMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        // Insérer le message après le header
        const header = document.querySelector('.collection-header');
        header.insertAdjacentElement('afterend', successDiv);
        
        // Supprimer automatiquement après 3 secondes
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    },
    
    // Supprimer tous les messages d'erreur/succès
    removeMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.remove());
    },
    
    // Obtenir une carte par ID
    getCardById(cardId) {
        return this.userCards.find(card => card._id === cardId);
    },
    
    // Obtenir les cartes sélectionnées
    getSelectedCards() {
        return Array.from(this.selectedCards).map(id => this.getCardById(id)).filter(Boolean);
    },
    
    // Rafraîchir le solde de tokens après une transaction
    refreshTokenBalance() {
        if (window.tokenService) {
            window.tokenService.refreshTokenBalance();
        }
    },
    
    // Émettre un événement de mise à jour de collection
    emitCollectionUpdate() {
        document.dispatchEvent(new CustomEvent('collectionUpdated', {
            detail: { 
                totalCards: this.collectionStats?.totalCards || 0,
                rarityStats: this.collectionStats?.rarityStats || {}
            }
        }));
    }
};

// Initialiser le service quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        collectionService.initialize();
    });
} else {
    collectionService.initialize();
}

// Exposer le service pour qu'il soit accessible par d'autres modules
window.collectionService = collectionService;