/**
 * Service pour la gestion dynamique de la collection de cartes
 * Version avec debug renforcé pour les dropdowns
 */

const collectionService = {
    // État actuel
    userCards: [],
    currentFilters: {
        rarity: 'all',
        search: '',
        sale: 'all'
    },
    currentSort: {
        by: 'name',
        order: 'asc'
    },
    currentPage: 1,
    cardsPerPage: 16,
    totalPages: 1,
    totalCards: 0,
    selectedCards: new Set(),
    
    // Flag pour éviter les appels multiples
    isLoading: false,
    isInitialized: false,
    hasLoadedOnce: false,
    
    // Initialiser le service
    initialize() {
        if (this.isInitialized) {
            console.log('[CollectionService] Already initialized');
            return;
        }
        
        console.log('[CollectionService] Initializing...');
        this.setupEventListeners();
        this.isInitialized = true;
        
        // Observer pour la visibilité de la section
        this.setupSectionObserver();
        
        // Chargement initial si la section est déjà visible
        setTimeout(() => {
            const collectionSection = document.getElementById('section-collection');
            if (collectionSection && !collectionSection.classList.contains('hidden')) {
                console.log('[CollectionService] Section already visible, loading...');
                this.loadCollection();
            }
        }, 100);
    },
    
    // Configuration de l'observer pour la section
    setupSectionObserver() {
        const collectionSection = document.getElementById('section-collection');
        if (collectionSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.id === 'section-collection' && !target.classList.contains('hidden')) {
                            if (!this.hasLoadedOnce && !this.isLoading) {
                                console.log('[CollectionService] Section became visible for first time');
                                this.loadCollection();
                            }
                        }
                    }
                });
            });
            
            observer.observe(collectionSection, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
            
            console.log('[CollectionService] Section observer set up');
        }
    },
    
    // Configuration des écouteurs d'événements
    setupEventListeners() {
        console.log('[CollectionService] Setting up event listeners...');
        
        // Boutons pour ouvrir/fermer les dropdowns
        this.setupDropdownToggles();
        
        // Boutons d'action dans les dropdowns
        this.setupFilterActions();
        this.setupSortActions();
        
        // Pagination
        this.setupPaginationActions();
        
        // Autres actions
        this.setupOtherActions();
        
        // Navigation globale
        document.addEventListener('sectionChanged', (event) => {
            console.log('[CollectionService] Section changed to:', event.detail.section);
            if (event.detail.section === 'collection' && !this.hasLoadedOnce && !this.isLoading) {
                this.loadCollection();
            }
        });
    },
    
    // Configuration des toggles de dropdowns avec debug
    setupDropdownToggles() {
        // Toggle filtres
        const filterBtn = document.getElementById('filter-cards');
        const filterDropdown = document.getElementById('filter-dropdown');
        
        console.log('[CollectionService] Filter button found:', !!filterBtn);
        console.log('[CollectionService] Filter dropdown found:', !!filterDropdown);
        
        if (filterBtn && filterDropdown) {
            console.log('[CollectionService] Setting up filter dropdown toggle');
            console.log('[CollectionService] Filter dropdown initial classes:', filterDropdown.className);
            
            filterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[CollectionService] Filter button clicked');
                
                // Re-récupérer l'élément à chaque clic (au cas où)
                const currentFilterDropdown = document.getElementById('filter-dropdown');
                console.log('[CollectionService] Current dropdown element:', currentFilterDropdown);
                console.log('[CollectionService] Is same element?', currentFilterDropdown === filterDropdown);
                
                if (!currentFilterDropdown) {
                    console.error('[CollectionService] Filter dropdown not found on click!');
                    return;
                }
                
                console.log('[CollectionService] Filter dropdown classes BEFORE toggle:', currentFilterDropdown.className);
                
                // Méthode directe avec vérification
                const hasHidden = currentFilterDropdown.classList.contains('hidden');
                console.log('[CollectionService] Has hidden class:', hasHidden);
                
                if (hasHidden) {
                    console.log('[CollectionService] Attempting to remove hidden class...');
                    currentFilterDropdown.classList.remove('hidden');
                    
                    // Vérification immédiate
                    const stillHasHidden = currentFilterDropdown.classList.contains('hidden');
                    console.log('[CollectionService] Still has hidden after removal:', stillHasHidden);
                    console.log('[CollectionService] Classes after removal:', currentFilterDropdown.className);
                    
                    // Force avec style inline si toujours caché
                    if (stillHasHidden) {
                        console.log('[CollectionService] Class removal failed, forcing with style...');
                        currentFilterDropdown.style.display = 'block';
                        currentFilterDropdown.style.visibility = 'visible';
                    }
                } else {
                    console.log('[CollectionService] Adding hidden class...');
                    currentFilterDropdown.classList.add('hidden');
                    currentFilterDropdown.style.display = '';
                    currentFilterDropdown.style.visibility = '';
                }
                
                console.log('[CollectionService] Final classes:', currentFilterDropdown.className);
                console.log('[CollectionService] Final computed style:', getComputedStyle(currentFilterDropdown).display);
                
                // Fermer l'autre dropdown
                const sortDropdown = document.getElementById('sort-dropdown');
                if (sortDropdown) {
                    sortDropdown.classList.add('hidden');
                    sortDropdown.style.display = '';
                    console.log('[CollectionService] Closed sort dropdown');
                }
            });
        } else {
            console.warn('[CollectionService] Filter button or dropdown not found');
            if (!filterBtn) console.warn('[CollectionService] Filter button element missing');
            if (!filterDropdown) console.warn('[CollectionService] Filter dropdown element missing');
        }
        
        // Toggle tri
        const sortBtn = document.getElementById('sort-cards');
        const sortDropdown = document.getElementById('sort-dropdown');
        
        console.log('[CollectionService] Sort button found:', !!sortBtn);
        console.log('[CollectionService] Sort dropdown found:', !!sortDropdown);
        
        if (sortBtn && sortDropdown) {
            console.log('[CollectionService] Setting up sort dropdown toggle');
            console.log('[CollectionService] Sort dropdown initial classes:', sortDropdown.className);
            
            sortBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[CollectionService] Sort button clicked');
                
                // Re-récupérer l'élément à chaque clic (au cas où)
                const currentSortDropdown = document.getElementById('sort-dropdown');
                console.log('[CollectionService] Current sort dropdown element:', currentSortDropdown);
                console.log('[CollectionService] Is same element?', currentSortDropdown === sortDropdown);
                
                if (!currentSortDropdown) {
                    console.error('[CollectionService] Sort dropdown not found on click!');
                    return;
                }
                
                console.log('[CollectionService] Sort dropdown classes BEFORE toggle:', currentSortDropdown.className);
                
                // Méthode directe avec vérification
                const hasHidden = currentSortDropdown.classList.contains('hidden');
                console.log('[CollectionService] Has hidden class:', hasHidden);
                
                if (hasHidden) {
                    console.log('[CollectionService] Attempting to remove hidden class...');
                    currentSortDropdown.classList.remove('hidden');
                    
                    // Vérification immédiate
                    const stillHasHidden = currentSortDropdown.classList.contains('hidden');
                    console.log('[CollectionService] Still has hidden after removal:', stillHasHidden);
                    console.log('[CollectionService] Classes after removal:', currentSortDropdown.className);
                    
                    // Force avec style inline si toujours caché
                    if (stillHasHidden) {
                        console.log('[CollectionService] Class removal failed, forcing with style...');
                        currentSortDropdown.style.display = 'block';
                        currentSortDropdown.style.visibility = 'visible';
                    }
                } else {
                    console.log('[CollectionService] Adding hidden class...');
                    currentSortDropdown.classList.add('hidden');
                    currentSortDropdown.style.display = '';
                    currentSortDropdown.style.visibility = '';
                }
                
                console.log('[CollectionService] Final classes:', currentSortDropdown.className);
                console.log('[CollectionService] Final computed style:', getComputedStyle(currentSortDropdown).display);
                
                // Fermer l'autre dropdown
                const filterDropdown = document.getElementById('filter-dropdown');
                if (filterDropdown) {
                    filterDropdown.classList.add('hidden');
                    filterDropdown.style.display = '';
                    console.log('[CollectionService] Closed filter dropdown');
                }
            });
        } else {
            console.warn('[CollectionService] Sort button or dropdown not found');
            if (!sortBtn) console.warn('[CollectionService] Sort button element missing');
            if (!sortDropdown) console.warn('[CollectionService] Sort dropdown element missing');
        }
        
        // Debug: Lister tous les éléments avec les IDs recherchés
        console.log('[CollectionService] All elements with filter-related IDs:');
        const allElements = document.querySelectorAll('[id*="filter"], [id*="sort"]');
        allElements.forEach(el => {
            console.log(`  - ${el.id}: ${el.tagName} (classes: ${el.className})`);
        });
    },
    
    // Configuration des actions de filtres
    setupFilterActions() {
        // Appliquer les filtres
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleApplyFilters();
            });
        }
        
        // Reset filtres
        const resetFiltersBtn = document.getElementById('reset-filters');
        const resetAllFiltersBtn = document.getElementById('reset-all-filters');
        
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleResetFilters();
            });
        }
        
        if (resetAllFiltersBtn) {
            resetAllFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleResetFilters();
            });
        }
        
        // Recherche en temps réel (SANS fermer le dropdown)
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    console.log('[CollectionService] Search input changed, applying filters...');
                    
                    // Récupérer les valeurs des filtres SANS fermer le dropdown
                    const raritySelect = document.getElementById('filter-rarity');
                    const saleSelect = document.getElementById('filter-sale');
                    
                    this.currentFilters.rarity = raritySelect?.value || 'all';
                    this.currentFilters.search = searchInput.value.trim() || '';
                    this.currentFilters.sale = saleSelect?.value || 'all';
                    
                    this.currentPage = 1; // Reset pagination
                    this.loadCollection();
                    
                    // NE PAS fermer le dropdown lors de la recherche
                    console.log('[CollectionService] Search applied, dropdown stays open');
                }, 500);
            });
        }
    },
    
    // Configuration des actions de tri
    setupSortActions() {
        const applySortBtn = document.getElementById('apply-sort');
        if (applySortBtn) {
            applySortBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleApplySort();
            });
        }
    },
    
    // Configuration de la pagination
    setupPaginationActions() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePreviousPage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNextPage();
            });
        }
    },
    
    // Configuration des autres actions
    setupOtherActions() {
        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRefresh();
            });
        }
        
        const sellSelectedBtn = document.getElementById('btn-sell-selected');
        if (sellSelectedBtn) {
            sellSelectedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sellSelectedCards();
            });
        }
        
        const buyPackBtn = document.getElementById('buy-pack');
        if (buyPackBtn) {
            buyPackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection('shop');
            });
        }
        
        // Fermer dropdowns quand on clique ailleurs
        document.addEventListener('click', (e) => {
            const filterDropdown = document.getElementById('filter-dropdown');
            const sortDropdown = document.getElementById('sort-dropdown');
            const filterBtn = document.getElementById('filter-cards');
            const sortBtn = document.getElementById('sort-cards');
            
            // Si on clique en dehors des boutons et dropdowns, fermer
            if (!filterBtn?.contains(e.target) && !filterDropdown?.contains(e.target)) {
                if (filterDropdown) {
                    filterDropdown.classList.add('hidden');
                    filterDropdown.style.display = '';
                }
            }
            
            if (!sortBtn?.contains(e.target) && !sortDropdown?.contains(e.target)) {
                if (sortDropdown) {
                    sortDropdown.classList.add('hidden');
                    sortDropdown.style.display = '';
                }
            }
        });
    },
    
    // Gestionnaires d'événements
    handleApplyFilters() {
        if (this.isLoading) return;
        console.log('[CollectionService] Apply filters clicked');
        
        // Récupérer les valeurs
        const raritySelect = document.getElementById('filter-rarity');
        const searchInput = document.getElementById('filter-search');
        const saleSelect = document.getElementById('filter-sale');
        
        this.currentFilters.rarity = raritySelect?.value || 'all';
        this.currentFilters.search = searchInput?.value.trim() || '';
        this.currentFilters.sale = saleSelect?.value || 'all';
        
        this.currentPage = 1; // Reset pagination
        this.loadCollection();
        
        // Fermer dropdown seulement quand on clique sur "Appliquer"
        const filterDropdown = document.getElementById('filter-dropdown');
        if (filterDropdown) {
            filterDropdown.classList.add('hidden');
            filterDropdown.style.display = '';
        }
    },
    
    handleApplySort() {
        if (this.isLoading) return;
        console.log('[CollectionService] Apply sort clicked');
        
        const sortBySelect = document.getElementById('sort-by');
        const sortOrderSelect = document.getElementById('sort-order');
        
        this.currentSort.by = sortBySelect?.value || 'name';
        this.currentSort.order = sortOrderSelect?.value || 'asc';
        
        this.currentPage = 1; // Reset pagination
        this.loadCollection();
        
        // Fermer dropdown
        const sortDropdown = document.getElementById('sort-dropdown');
        if (sortDropdown) {
            sortDropdown.classList.add('hidden');
        }
    },
    
    handleResetFilters() {
        if (this.isLoading) return;
        console.log('[CollectionService] Reset filters clicked');
        
        // Reset interface
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
        
        // Reset état interne
        this.currentFilters = { rarity: 'all', search: '', sale: 'all' };
        this.currentSort = { by: 'name', order: 'asc' };
        this.currentPage = 1;
        
        this.loadCollection();
        
        // Fermer dropdowns
        const filterDropdown = document.getElementById('filter-dropdown');
        const sortDropdown = document.getElementById('sort-dropdown');
        if (filterDropdown) filterDropdown.classList.add('hidden');
        if (sortDropdown) sortDropdown.classList.add('hidden');
    },
    
    handlePreviousPage() {
        if (this.isLoading || this.currentPage <= 1) return;
        console.log('[CollectionService] Previous page clicked');
        
        this.currentPage--;
        this.loadCollection();
    },
    
    handleNextPage() {
        if (this.isLoading || this.currentPage >= this.totalPages) return;
        console.log('[CollectionService] Next page clicked');
        
        this.currentPage++;
        this.loadCollection();
    },
    
    handleRefresh() {
        if (this.isLoading) return;
        console.log('[CollectionService] Refresh clicked');
        
        // Reset complètement et recharger
        this.hasLoadedOnce = false;
        this.loadCollection();
    },
    
    // Méthode principale de chargement
    async loadCollection() {
        if (this.isLoading) {
            console.log('[CollectionService] Already loading, skipping...');
            return;
        }
        
        try {
            console.log('[CollectionService] Loading collection...');
            this.isLoading = true;
            this.hasLoadedOnce = true;
            this.showLoading();
            
            // Vérifications de base
            if (!window.apiService) {
                console.error('[CollectionService] apiService not available');
                this.showError('Service API non disponible');
                return;
            }
            
            if (!window.apiService.isLoggedIn()) {
                console.error('[CollectionService] User not logged in');
                this.showError('Vous devez être connecté');
                return;
            }
            
            // Construire les paramètres
            const params = {
                rarity: this.currentFilters.rarity,
                search: this.currentFilters.search,
                sale: this.currentFilters.sale,
                sortBy: this.currentSort.by,
                sortOrder: this.currentSort.order,
                page: this.currentPage,
                limit: this.cardsPerPage
            };
            
            console.log('[CollectionService] API call with params:', params);
            
            // Appel API unique
            const response = await window.apiService.getUserCards(params);
            
            console.log('[CollectionService] API response:', response);
            
            if (response.success) {
                // Mise à jour des données
                this.userCards = response.cards || [];
                this.totalCards = response.total || 0;
                this.totalPages = response.totalPages || 1;
                this.currentPage = response.currentPage || 1;
                
                console.log(`[CollectionService] Updated: ${this.userCards.length} cards on page ${this.currentPage}/${this.totalPages}, total: ${this.totalCards}`);
                
                // Mise à jour de l'affichage
                this.updateDisplay();
                
            } else {
                console.error('[CollectionService] API error:', response.message);
                this.showError(response.message || 'Erreur de chargement');
            }
            
        } catch (error) {
            console.error('[CollectionService] Load error:', error);
            this.showError('Erreur de connexion');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    },
    
    // Mise à jour de l'affichage
    updateDisplay() {
        console.log('[CollectionService] Updating display...');
        
        // 1. Mettre à jour le compteur de cartes total
        const totalCardsElement = document.getElementById('total-cards-count');
        if (totalCardsElement) {
            totalCardsElement.textContent = this.totalCards;
            console.log(`[CollectionService] Total cards display updated: ${this.totalCards}`);
        }
        
        // 2. Afficher les cartes ou les messages d'état
        const cardsGrid = document.getElementById('cards-grid');
        const noCardsSection = document.getElementById('no-cards-section');
        const noResultsSection = document.getElementById('no-results-section');
        
        // Cacher toutes les sections
        if (cardsGrid) cardsGrid.classList.add('hidden');
        if (noCardsSection) noCardsSection.classList.add('hidden');
        if (noResultsSection) noResultsSection.classList.add('hidden');
        
        if (this.totalCards === 0) {
            // Aucune carte trouvée
            if (this.hasActiveFilters()) {
                // Filtres actifs = aucun résultat
                if (noResultsSection) noResultsSection.classList.remove('hidden');
            } else {
                // Pas de filtres = collection vide
                if (noCardsSection) noCardsSection.classList.remove('hidden');
            }
        } else {
            // Afficher les cartes
            if (cardsGrid) {
                cardsGrid.classList.remove('hidden');
                this.renderCards();
            }
            this.updatePagination();
        }
    },
    
    // Rendu des cartes
    renderCards() {
        const cardsGrid = document.getElementById('cards-grid');
        if (!cardsGrid) return;
        
        console.log(`[CollectionService] Rendering ${this.userCards.length} cards`);
        
        // Vider complètement la grille
        cardsGrid.innerHTML = '';
        
        // Créer les éléments de cartes
        this.userCards.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
        
        console.log('[CollectionService] Cards rendered');
    },
    
    // Création d'un élément de carte
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.rarity || 'common'}`;
        cardDiv.dataset.cardId = card._id;
        
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
        
        // Événement de clic
        cardDiv.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.toggleCardSelection(card._id);
            } else {
                this.showCardDetails(card);
            }
        });
        
        return cardDiv;
    },
    
    // Mise à jour de la pagination
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
    
    // Utilitaires
    hasActiveFilters() {
        return this.currentFilters.rarity !== 'all' || 
               this.currentFilters.search !== '' || 
               this.currentFilters.sale !== 'all';
    },
    
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
    
    updateSellButtonState() {
        const sellBtn = document.getElementById('btn-sell-selected');
        if (sellBtn) {
            sellBtn.disabled = this.selectedCards.size === 0;
            sellBtn.textContent = this.selectedCards.size > 0 
                ? `Vendre ${this.selectedCards.size} cartes` 
                : 'Vendre sélectionnées';
        }
    },
    
    showCardDetails(card) {
        if (window.showCardDetails) {
            window.showCardDetails(card);
        } else {
            alert(`Carte: ${card.name}\nRareté: ${card.rarity}\nAttaque: ${card.stats?.attack || 0}\nDéfense: ${card.stats?.defense || 0}`);
        }
    },
    
    navigateToSection(sectionName) {
        if (window.showSection) {
            window.showSection(sectionName);
        } else {
            document.dispatchEvent(new CustomEvent('navigateToSection', {
                detail: { section: sectionName }
            }));
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
        this.loadCollection();
    },
    
    // Interface loading/errors
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
    
    hideLoading() {
        const loadingIndicator = document.getElementById('cards-loading');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    },
    
    showError(message) {
        console.error('[CollectionService] Error:', message);
        
        // Supprimer les anciens messages
        this.removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const header = document.querySelector('.collection-header');
        if (header) {
            header.insertAdjacentElement('afterend', errorDiv);
        }
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },
    
    showSuccess(message) {
        this.removeMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const header = document.querySelector('.collection-header');
        if (header) {
            header.insertAdjacentElement('afterend', successDiv);
        }
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    },
    
    removeMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.remove());
    }
};

// Initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[CollectionService] DOM loaded, initializing...');
        collectionService.initialize();
    });
} else {
    console.log('[CollectionService] DOM already ready, initializing...');
    collectionService.initialize();
}

// Export global
window.collectionService = collectionService;