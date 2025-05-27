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
    totalCards: 0,
    
    // État de sélection des cartes
    selectedCards: new Set(),
    
    // Flag pour éviter les appels multiples
    isLoading: false,
    
    // Initialiser le service
    initialize() {
        console.log('[CollectionService] Initializing...');
        this.setupEventListeners();
        
        // Charger les cartes si la section collection est visible
        const collectionSection = document.getElementById('section-collection');
        if (collectionSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.id === 'section-collection') {
                            console.log('[CollectionService] Section class changed:', target.className);
                            
                            // Si la section devient visible (plus de classe hidden)
                            if (!target.classList.contains('hidden') && !this.isLoading) {
                                console.log('[CollectionService] Section became visible, loading cards...');
                                this.loadUserCollection();
                            }
                        }
                    }
                });
            });
            
            observer.observe(collectionSection, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
            
            console.log('[CollectionService] Observer set up for section visibility');
        }
    },
    
    // Configuration des écouteurs d'événements
    setupEventListeners() {
        console.log('[CollectionService] Setting up event listeners...');
        // Boutons de filtre et tri
        this.setupFilterEvents();
        this.setupSortEvents();
        this.setupPaginationEvents();
        this.setupActionEvents();
        
        // Navigation vers la collection
        document.addEventListener('sectionChanged', (event) => {
            console.log('[CollectionService] Section changed to:', event.detail.section);
            if (event.detail.section === 'collection' && !this.isLoading) {
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
                const sortDropdown = document.getElementById('sort-dropdown');
                if (sortDropdown) sortDropdown.classList.add('hidden');
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
                }, 300);
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
                const filterDropdown = document.getElementById('filter-dropdown');
                if (filterDropdown) filterDropdown.classList.add('hidden');
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
                if (this.currentPage > 1 && !this.isLoading) {
                    this.currentPage--;
                    this.loadCards();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages && !this.isLoading) {
                    this.currentPage++;
                    this.loadCards();
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
                console.log('[CollectionService] Refresh button clicked');
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
                this.navigateToSection('shop');
            });
        }
        
        if (visitMarketBtn) {
            visitMarketBtn.addEventListener('click', () => {
                this.navigateToSection('marketplace');
            });
        }
    },
    
    // Charger la collection complète de l'utilisateur (premier chargement)
    async loadUserCollection() {
        if (this.isLoading) {
            console.log('[CollectionService] Already loading, skipping...');
            return;
        }
        
        try {
            console.log('[CollectionService] Loading user collection...');
            this.isLoading = true;
            this.showLoading();
            
            // Vérifier que apiService est disponible
            if (!window.apiService) {
                console.error('[CollectionService] apiService not available');
                this.showError('Service API non disponible');
                return;
            }
            
            // Vérifier que l'utilisateur est connecté
            if (!window.apiService.isLoggedIn()) {
                console.warn('[CollectionService] User not logged in');
                this.showError('Vous devez être connecté pour voir votre collection');
                return;
            }
            
            // Charger les cartes
            await this.loadCards();
            
            // Charger les statistiques pour le header (total de cartes)
            await this.loadAndUpdateStats();
            
        } catch (error) {
            console.error('[CollectionService] Error loading collection:', error);
            this.showError('Erreur lors du chargement de votre collection');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    },
    
    // Charger les cartes avec les filtres actuels
    async loadCards() {
        if (this.isLoading) {
            console.log('[CollectionService] Already loading, skipping...');
            return;
        }
        
        try {
            console.log('[CollectionService] Loading cards with current filters...');
            this.isLoading = true;
            
            // Construire les paramètres de filtres pour l'API
            const filters = {
                rarity: this.currentFilters.rarity,
                search: this.currentFilters.search,
                sale: this.currentFilters.sale,
                sortBy: this.currentSort.by,
                sortOrder: this.currentSort.order,
                page: this.currentPage,
                limit: this.cardsPerPage
            };
            
            console.log('[CollectionService] Sending filters to API:', filters);
            
            // Utiliser l'API avec les paramètres
            const response = await window.apiService.getUserCards(filters);
            console.log('[CollectionService] API response:', response);
            
            if (response.success) {
                // Mettre à jour les données
                this.userCards = response.cards || [];
                this.totalPages = response.totalPages || 1;
                this.currentPage = response.currentPage || 1;
                this.totalCards = response.total || 0;
                
                console.log(`[CollectionService] Loaded ${this.userCards.length} cards (page ${this.currentPage}/${this.totalPages}, total: ${this.totalCards})`);
                
                // Mettre à jour l'affichage
                this.updateCardsDisplay();
                this.updatePagination();
            } else {
                console.error('[CollectionService] Failed to load cards:', response);
                this.showError(response.message || 'Erreur lors du chargement des cartes');
            }
            
        } catch (error) {
            console.error('[CollectionService] Error loading cards:', error);
            this.showError('Erreur de connexion au serveur');
        } finally {
            this.isLoading = false;
        }
    },
    
    // Charger et mettre à jour les statistiques
    async loadAndUpdateStats() {
        try {
            console.log('[CollectionService] Loading collection stats...');
            
            // Faire un appel API pour récupérer les stats réelles
            const statsResponse = await window.apiService.getUserCards({ page: 1, limit: 1000 });
            
            if (statsResponse.success) {
                const allCards = statsResponse.cards || [];
                
                const stats = {
                    totalCards: statsResponse.total || 0,
                    gameStats: {
                        wins: 0,
                        losses: 0,
                        currentRank: 'Non classé'
                    },
                    rarityStats: {
                        common: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    }
                };
                
                // Calculer les statistiques par rareté
                allCards.forEach(card => {
                    if (card.rarity && stats.rarityStats.hasOwnProperty(card.rarity)) {
                        stats.rarityStats[card.rarity]++;
                    }
                });
                
                console.log('[CollectionService] Generated stats:', stats);
                this.updateStatsDisplay(stats);
            }
            
        } catch (error) {
            console.error('[CollectionService] Error loading stats:', error);
        }
    },
    
    // Mettre à jour l'affichage des statistiques
    updateStatsDisplay(stats) {
        console.log('[CollectionService] Updating stats display:', stats);
        
        // IMPORTANT: Afficher le TOTAL de cartes, pas le nombre de la page courante
        const totalCardsElement = document.getElementById('total-cards-count');
        if (totalCardsElement) {
            totalCardsElement.textContent = stats.totalCards || 0;
        }
        
        const winsElement = document.getElementById('wins-count');
        if (winsElement) {
            winsElement.textContent = stats.gameStats?.wins || 0;
        }
        
        const lossesElement = document.getElementById('losses-count');
        if (lossesElement) {
            lossesElement.textContent = stats.gameStats?.losses || 0;
        }
        
        const rankElement = document.getElementById('current-rank');
        if (rankElement) {
            rankElement.textContent = stats.gameStats?.currentRank || 'Non classé';
        }
        
        // Statistiques par rareté
        if (stats.rarityStats) {
            const commonElement = document.getElementById('common-count');
            if (commonElement) {
                commonElement.textContent = stats.rarityStats.common || 0;
            }
            
            const rareElement = document.getElementById('rare-count');
            if (rareElement) {
                rareElement.textContent = stats.rarityStats.rare || 0;
            }
            
            const epicElement = document.getElementById('epic-count');
            if (epicElement) {
                epicElement.textContent = stats.rarityStats.epic || 0;
            }
            
            const legendaryElement = document.getElementById('legendary-count');
            if (legendaryElement) {
                legendaryElement.textContent = stats.rarityStats.legendary || 0;
            }
            
            // Afficher les statistiques si l'utilisateur a des cartes
            if (stats.totalCards > 0) {
                const rarityStatsElement = document.getElementById('rarity-stats');
                if (rarityStatsElement) {
                    rarityStatsElement.classList.remove('hidden');
                }
            }
        }
        
        this.collectionStats = stats;
    },
    
    // Mettre à jour l'affichage des cartes
    updateCardsDisplay() {
        console.log('[CollectionService] Updating cards display with', this.userCards.length, 'cards');
        
        const cardsGrid = document.getElementById('cards-grid');
        const noCardsSection = document.getElementById('no-cards-section');
        const noResultsSection = document.getElementById('no-results-section');
        
        // Cacher toutes les sections
        if (cardsGrid) cardsGrid.classList.add('hidden');
        if (noCardsSection) noCardsSection.classList.add('hidden');
        if (noResultsSection) noResultsSection.classList.add('hidden');
        
        // Si aucune carte
        if (this.totalCards === 0) {
            console.log('[CollectionService] No cards found, showing appropriate section');
            
            // Si c'est un résultat de filtre et qu'on a des filtres actifs
            if (this.hasActiveFilters()) {
                if (noResultsSection) noResultsSection.classList.remove('hidden');
            } else {
                if (noCardsSection) noCardsSection.classList.remove('hidden');
            }
            return;
        }
        
        // Afficher les cartes
        console.log('[CollectionService] Showing cards grid');
        if (cardsGrid) {
            cardsGrid.classList.remove('hidden');
            this.renderCards();
        }
    },
    
    // Vérifier si des filtres sont actifs
    hasActiveFilters() {
        return this.currentFilters.rarity !== 'all' || 
               this.currentFilters.search !== '' || 
               this.currentFilters.sale !== 'all';
    },
    
    // Rendre les cartes dans la grille
    renderCards() {
        console.log('[CollectionService] Rendering', this.userCards.length, 'cards');
        const cardsGrid = document.getElementById('cards-grid');
        if (!cardsGrid) {
            console.error('[CollectionService] Cards grid element not found');
            return;
        }
        
        // IMPORTANT: Vider complètement la grille avant de re-rendre
        cardsGrid.innerHTML = '';
        
        this.userCards.forEach((card, index) => {
            console.log(`[CollectionService] Rendering card ${index + 1}:`, card.name);
            const cardElement = this.createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
        
        console.log('[CollectionService] All cards rendered');
    },
    
    // Créer un élément de carte
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.rarity || 'common'}`;
        cardDiv.dataset.cardId = card._id;
        
        // Ajouter une classe si la carte est sélectionnée
        if (this.selectedCards.has(card._id)) {
            cardDiv.classList.add('selected');
        }
        
        cardDiv.innerHTML = `
            <div class="card-image">
                <img src="${card.imageUrl || '/images/cards/default.jpg'}" alt="${card.name}" class="card-artwork" loading="lazy" onerror="this.src='/images/cards/default.jpg'">
                ${card.isForSale ? `<div class="card-sale-indicator">En vente - ${card.price} EFC</div>` : ''}
            </div>
            <div class="card-info">
                <h3>${card.name}</h3>
                <p class="card-description">${card.description || ''}</p>
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
    
    // Mettre à jour la pagination
    updatePagination() {
        const paginationContainer = document.getElementById('pagination-container');
        const currentPageSpan = document.getElementById('current-page');
        const totalPagesSpan = document.getElementById('total-pages');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (this.totalPages <= 1) {
            if (paginationContainer) paginationContainer.classList.add('hidden');
            return;
        }
        
        if (paginationContainer) paginationContainer.classList.remove('hidden');
        if (currentPageSpan) currentPageSpan.textContent = this.currentPage;
        if (totalPagesSpan) totalPagesSpan.textContent = this.totalPages;
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
        
        console.log(`[CollectionService] Pagination updated: ${this.currentPage}/${this.totalPages}`);
    },
    
    // Appliquer les filtres
    applyFilters() {
        if (this.isLoading) return;
        
        // Récupérer les valeurs des filtres
        const raritySelect = document.getElementById('filter-rarity');
        const searchInput = document.getElementById('filter-search');
        const saleSelect = document.getElementById('filter-sale');
        
        if (raritySelect) this.currentFilters.rarity = raritySelect.value;
        if (searchInput) this.currentFilters.search = searchInput.value.trim();
        if (saleSelect) this.currentFilters.sale = saleSelect.value;
        
        // Réinitialiser à la première page
        this.currentPage = 1;
        
        console.log('[CollectionService] Applying filters:', this.currentFilters);
        
        // Recharger les cartes
        this.loadCards();
    },
    
    // Appliquer le tri
    applySort() {
        if (this.isLoading) return;
        
        const sortBySelect = document.getElementById('sort-by');
        const sortOrderSelect = document.getElementById('sort-order');
        
        if (sortBySelect) this.currentSort.by = sortBySelect.value;
        if (sortOrderSelect) this.currentSort.order = sortOrderSelect.value;
        
        // Réinitialiser à la première page
        this.currentPage = 1;
        
        console.log('[CollectionService] Applying sort:', this.currentSort);
        
        // Recharger les cartes
        this.loadCards();
    },
    
    // Réinitialiser les filtres
    resetFilters() {
        if (this.isLoading) return;
        
        // Réinitialiser les valeurs des filtres dans l'interface
        const raritySelect = document.getElementById('filter-rarity');
        const searchInput = document.getElementById('filter-search');
        const saleSelect = document.getElementById('filter-sale');
        const sortBySelect = document.getElementById('sort-by');
        const sortOrderSelect = document.getElementById('sort-order');
        
        if (raritySelect) raritySelect.value = 'all';
        if (searchInput) searchInput.value = '';
        if (saleSelect) saleSelect.value = 'all';
        if (sortBySelect) sortBySelect.value = 'name';
        if (sortOrderSelect) sortOrderSelect.value = 'asc';
        
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
        const filterDropdown = document.getElementById('filter-dropdown');
        const sortDropdown = document.getElementById('sort-dropdown');
        if (filterDropdown) filterDropdown.classList.add('hidden');
        if (sortDropdown) sortDropdown.classList.add('hidden');
        
        console.log('[CollectionService] Filters reset');
        
        // Recharger les cartes
        this.loadCards();
    },
    
    // Basculer la sélection d'une carte
    toggleCardSelection(cardId) {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
            if (cardElement) cardElement.classList.remove('selected');
        } else {
            this.selectedCards.add(cardId);
            if (cardElement) cardElement.classList.add('selected');
        }
        
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
    
    // Vendre les cartes sélectionnées
    async sellSelectedCards() {
        if (this.selectedCards.size === 0) {
            this.showError('Aucune carte sélectionnée');
            return;
        }
        
        const price = prompt('Prix de vente pour chaque carte (en EFC):');
        if (!price || isNaN(price) || parseFloat(price) <= 0) {
            this.showError('Prix invalide');
            return;
        }
        
        const priceValue = parseFloat(price);
        let successCount = 0;
        let errorCount = 0;
        
        for (const cardId of this.selectedCards) {
            try {
                const response = await window.apiService.updateCard(cardId, {
                    isForSale: true,
                    price: priceValue
                });
                
                if (response.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Erreur pour la carte ${cardId}:`, response.message);
                }
            } catch (error) {
                errorCount++;
                console.error(`Erreur lors de la mise en vente de la carte ${cardId}:`, error);
            }
        }
        
        if (successCount > 0) {
            this.showSuccess(`${successCount} carte(s) mise(s) en vente avec succès`);
        }
        if (errorCount > 0) {
            this.showError(`${errorCount} carte(s) n'ont pas pu être mises en vente`);
        }
        
        this.selectedCards.clear();
        this.updateSellButtonState();
        this.loadCards();
    },
    
    // Afficher les détails d'une carte
    showCardDetails(card) {
        if (window.showCardDetails) {
            window.showCardDetails(card);
        } else {
            alert(`
                Carte: ${card.name}
                Rareté: ${card.rarity}
                Attaque: ${card.stats?.attack || 0}
                Défense: ${card.stats?.defense || 0}
                Magie: ${card.stats?.magic || 0}
                Vitesse: ${card.stats?.speed || 0}
                ${card.isForSale ? `En vente pour ${card.price} EFC` : 'Pas en vente'}
            `);
        }
    },
    
    // Naviguer vers une autre section
    navigateToSection(sectionName) {
        if (window.showSection) {
            window.showSection(sectionName);
        } else {
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
        
        if (cardsGrid) cardsGrid.classList.add('hidden');
        if (noCardsSection) noCardsSection.classList.add('hidden');
        if (noResultsSection) noResultsSection.classList.add('hidden');
        
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    },
    
    // Masquer l'indicateur de chargement
    hideLoading() {
        const loadingIndicator = document.getElementById('cards-loading');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    },
    
    // Afficher un message d'erreur
    showError(message) {
        console.error('[CollectionService] Showing error:', message);
        
        this.removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const header = document.querySelector('.collection-header');
        if (header) {
            header.insertAdjacentElement('afterend', errorDiv);
        } else {
            const collectionSection = document.getElementById('section-collection');
            if (collectionSection) {
                collectionSection.insertAdjacentElement('afterbegin', errorDiv);
            }
        }
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },
    
    // Afficher un message de succès
    showSuccess(message) {
        this.removeMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const header = document.querySelector('.collection-header');
        if (header) {
            header.insertAdjacentElement('afterend', successDiv);
        } else {
            const collectionSection = document.getElementById('section-collection');
            if (collectionSection) {
                collectionSection.insertAdjacentElement('afterbegin', successDiv);
            }
        }
        
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
        console.log('[CollectionService] DOM loaded, initializing service');
        collectionService.initialize();
    });
} else {
    console.log('[CollectionService] DOM already loaded, initializing service immediately');
    collectionService.initialize();
}

// Exposer le service pour qu'il soit accessible par d'autres modules
window.collectionService = collectionService;