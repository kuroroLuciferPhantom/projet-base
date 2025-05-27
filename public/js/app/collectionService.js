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
                    if (!target.classList.contains('hidden')) {
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
            console.log('[CollectionService] Loading user collection...');
            this.showLoading();
            
            // Vérifier que apiService est disponible
            if (!window.apiService) {
                console.error('[CollectionService] apiService not available');
                this.showError('Service API non disponible');
                this.hideLoading();
                return;
            }
            
            // Vérifier que l'utilisateur est connecté
            if (!window.apiService.isLoggedIn()) {
                console.warn('[CollectionService] User not logged in');
                this.showError('Vous devez être connecté pour voir votre collection');
                this.hideLoading();
                return;
            }
            
            // Charger les cartes
            console.log('[CollectionService] Loading user cards...');
            const cardsResponse = await this.loadUserCards();
            
            this.hideLoading();
            
            if (cardsResponse.success) {
                console.log('[CollectionService] Cards loaded successfully:', cardsResponse);
                this.updateCardsDisplay(cardsResponse);
                
                // Charger les statistiques séparément
                this.loadCollectionStats().then(statsResponse => {
                    if (statsResponse.success) {
                        console.log('[CollectionService] Stats loaded successfully:', statsResponse);
                        this.updateStatsDisplay(statsResponse.stats);
                    } else {
                        console.warn('[CollectionService] Failed to load stats:', statsResponse.message);
                    }
                }).catch(error => {
                    console.warn('[CollectionService] Error loading stats:', error);
                });
            } else {
                console.error('[CollectionService] Failed to load cards:', cardsResponse);
                this.showError(cardsResponse.message || 'Erreur lors du chargement des cartes');
            }
            
        } catch (error) {
            console.error('[CollectionService] Error loading collection:', error);
            this.hideLoading();
            this.showError('Erreur lors du chargement de votre collection');
        }
    },
    
    // Charger les statistiques de la collection
    async loadCollectionStats() {
        try {
            console.log('[CollectionService] Loading collection stats...');
            
            // Créer des statistiques de base à partir des cartes chargées
            const stats = {
                totalCards: this.userCards.length,
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
            this.userCards.forEach(card => {
                if (card.rarity && stats.rarityStats.hasOwnProperty(card.rarity)) {
                    stats.rarityStats[card.rarity]++;
                }
            });
            
            console.log('[CollectionService] Generated stats:', stats);
            return { success: true, stats };
            
        } catch (error) {
            console.error('[CollectionService] Error loading stats:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Charger les cartes de l'utilisateur avec filtres et pagination
    async loadUserCards() {
        try {
            console.log('[CollectionService] Loading user cards from API...');
            
            // Utiliser l'API existante dans apiService
            const response = await window.apiService.getUserCards();
            console.log('[CollectionService] API response:', response);
            
            if (response.success) {
                // Traiter la réponse pour correspondre au format attendu
                // L'API retourne { success: true, data: { cards: [...], pagination: {...} } }
                const cards = response.data?.cards || response.cards || [];
                const pagination = response.data?.pagination || {};
                
                console.log('[CollectionService] Extracted cards:', cards);
                console.log('[CollectionService] Pagination info:', pagination);
                
                return {
                    success: true,
                    cards: cards,
                    total: pagination.total || cards.length,
                    totalPages: pagination.pages || Math.ceil(cards.length / this.cardsPerPage),
                    currentPage: pagination.current || 1
                };
            } else {
                return response;
            }
            
        } catch (error) {
            console.error('[CollectionService] Error loading cards:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    },
    
    // Mettre à jour l'affichage des statistiques
    updateStatsDisplay(stats) {
        console.log('[CollectionService] Updating stats display:', stats);
        
        // Statistiques générales
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
    updateCardsDisplay(response) {
        console.log('[CollectionService] Updating cards display:', response);
        
        const cardsGrid = document.getElementById('cards-grid');
        const noCardsSection = document.getElementById('no-cards-section');
        const noResultsSection = document.getElementById('no-results-section');
        
        // Cacher toutes les sections
        if (cardsGrid) cardsGrid.classList.add('hidden');
        if (noCardsSection) noCardsSection.classList.add('hidden');
        if (noResultsSection) noResultsSection.classList.add('hidden');
        
        if (!response.success) {
            console.error('[CollectionService] Response not successful:', response.message);
            this.showError(response.message);
            return;
        }
        
        this.userCards = response.cards || [];
        this.totalPages = response.totalPages || 1;
        this.currentPage = response.currentPage || 1;
        
        console.log('[CollectionService] User cards:', this.userCards);
        
        // Si aucune carte
        if (response.total === 0 || this.userCards.length === 0) {
            console.log('[CollectionService] No cards found, showing no-cards section');
            if (noCardsSection) noCardsSection.classList.remove('hidden');
            return;
        }
        
        // Afficher les cartes
        console.log('[CollectionService] Showing cards grid with', this.userCards.length, 'cards');
        if (cardsGrid) {
            cardsGrid.classList.remove('hidden');
            this.renderCards();
            this.updatePagination();
        }
    },
    
    // Rendre les cartes dans la grille
    renderCards() {
        console.log('[CollectionService] Rendering', this.userCards.length, 'cards');
        const cardsGrid = document.getElementById('cards-grid');
        if (!cardsGrid) {
            console.error('[CollectionService] Cards grid element not found');
            return;
        }
        
        cardsGrid.innerHTML = '';
        
        this.userCards.forEach((card, index) => {
            console.log(`[CollectionService] Rendering card ${index + 1}:`, card);
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
        
        // Assurer que les statistiques existent
        const stats = card.stats || { attack: 0, defense: 0, magic: 0, speed: 0 };
        
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
            if (paginationContainer) paginationContainer.classList.add('hidden');
            return;
        }
        
        if (paginationContainer) paginationContainer.classList.remove('hidden');
        if (currentPageSpan) currentPageSpan.textContent = this.currentPage;
        if (totalPagesSpan) totalPagesSpan.textContent = this.totalPages;
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    },
    
    // Appliquer les filtres
    applyFilters() {
        // Récupérer les valeurs des filtres
        const raritySelect = document.getElementById('filter-rarity');
        const searchInput = document.getElementById('filter-search');
        const saleSelect = document.getElementById('filter-sale');
        
        if (raritySelect) this.currentFilters.rarity = raritySelect.value;
        if (searchInput) this.currentFilters.search = searchInput.value.trim();
        if (saleSelect) this.currentFilters.sale = saleSelect.value;
        
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
        const sortBySelect = document.getElementById('sort-by');
        const sortOrderSelect = document.getElementById('sort-order');
        
        if (sortBySelect) this.currentSort.by = sortBySelect.value;
        if (sortOrderSelect) this.currentSort.order = sortOrderSelect.value;
        
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
        console.log('[CollectionService] Showing loading indicator');
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
    },
    
    // Masquer l'indicateur de chargement
    hideLoading() {
        console.log('[CollectionService] Hiding loading indicator');
        const loadingIndicator = document.getElementById('cards-loading');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    },
    
    // Afficher un message d'erreur
    showError(message) {
        console.error('[CollectionService] Showing error:', message);
        
        // Supprimer les anciens messages
        this.removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insérer le message après le header
        const header = document.querySelector('.collection-header');
        if (header) {
            header.insertAdjacentElement('afterend', errorDiv);
        } else {
            // Fallback: insérer au début de la section collection
            const collectionSection = document.getElementById('section-collection');
            if (collectionSection) {
                collectionSection.insertAdjacentElement('afterbegin', errorDiv);
            }
        }
        
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
        if (header) {
            header.insertAdjacentElement('afterend', successDiv);
        } else {
            // Fallback: insérer au début de la section collection
            const collectionSection = document.getElementById('section-collection');
            if (collectionSection) {
                collectionSection.insertAdjacentElement('afterbegin', successDiv);
            }
        }
        
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
        console.log('[CollectionService] DOM loaded, initializing service');
        collectionService.initialize();
    });
} else {
    console.log('[CollectionService] DOM already loaded, initializing service immediately');
    collectionService.initialize();
}

// Exposer le service pour qu'il soit accessible par d'autres modules
window.collectionService = collectionService;