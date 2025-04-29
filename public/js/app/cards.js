/**
 * Gestion des cartes de l'utilisateur
 */

// Variables globales pour la gestion des cartes
let userCards = [];
let filteredCards = [];
let currentPage = 1;
const cardsPerPage = 8;
let currentFilters = {
    rarity: 'all',
    energy: 'all',
    tournament: 'all'
};
let currentSort = {
    by: 'name',
    order: 'asc'
};

// Fonction d'initialisation appelée au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("[DEBUG] Initialisation des cartes...");
    
    // Configuration des écouteurs d'événements pour les filtres et le tri immédiatement
    setupFilterSortListeners();
    
    // Écouteur pour le changement de section vers la collection
    const collectionLink = document.querySelector('a[href="#collection"]');
    if (collectionLink) {
        collectionLink.addEventListener('click', function() {
            console.log("[DEBUG] Section collection activée");
            setTimeout(loadUserCards, 100); // Petit délai pour s'assurer que la section est affichée
        });
    }
});

/**
 * Charge et affiche les cartes de l'utilisateur
 */
async function loadUserCards() {
    try {
        console.log("[DEBUG] Chargement des cartes utilisateur...");
        
        // Masquer le message "collection vide"
        document.querySelector('.no-cards-prompt').classList.add('hidden');
        
        // Afficher la grille de cartes
        const cardsGrid = document.querySelector('.cards-grid');
        cardsGrid.classList.remove('hidden');
        
        // Définition des cartes avec leurs images correspondantes
        userCards = [
            {
                id: 1,
                name: 'Guerrier à poils',
                rarity: 'common',
                image: '/img/cards/3.jpg',
                attack: 2,
                defense: 3,
                energy: 1,
                rank: 2,
                tournament: 'bronze'
            },
            {
                id: 2,
                name: 'Bambo',
                rarity: 'uncommon',
                image: '/img/cards/4.jpg',
                attack: 4,
                defense: 4,
                energy: 2,
                rank: 3,
                tournament: 'bronze'
            },
            {
                id: 3,
                name: 'Sursumot',
                rarity: 'uncommon',
                image: '/img/cards/5.jpg',
                attack: 5,
                defense: 2,
                energy: 2,
                rank: 1,
                tournament: 'silver'
            },
            {
                id: 4,
                name: 'RIG',
                rarity: 'epic',
                image: '/img/cards/1.jpg',
                attack: 6,
                defense: 8,
                energy: 2,
                rank: 4,
                tournament: 'silver'
            },
            {
                id: 5,
                name: 'Mulk',
                rarity: 'legendary',
                image: '/img/cards/2.jpg',
                attack: 8,
                defense: 8,
                energy: 3,
                rank: 5,
                tournament: 'gold'
            },
            {
                id: 6,
                name: 'Zorg',
                rarity: 'epic',
                image: '/img/cards/3.jpg',
                attack: 7,
                defense: 5,
                energy: 3,
                rank: 4,
                tournament: 'gold'
            },
            {
                id: 7,
                name: 'Vortex',
                rarity: 'uncommon',
                image: '/img/cards/4.jpg',
                attack: 3,
                defense: 6,
                energy: 2,
                rank: 2,
                tournament: 'bronze'
            },
            {
                id: 8,
                name: 'Drakonid',
                rarity: 'legendary',
                image: '/img/cards/5.jpg',
                attack: 9,
                defense: 7,
                energy: 4,
                rank: 5,
                tournament: 'gold'
            },
            {
                id: 9,
                name: 'Pyrox',
                rarity: 'common',
                image: '/img/cards/1.jpg',
                attack: 1,
                defense: 2,
                energy: 1,
                rank: 1,
                tournament: 'bronze'
            },
            {
                id: 10,
                name: 'Luna',
                rarity: 'epic',
                image: '/img/cards/2.jpg',
                attack: 5,
                defense: 6,
                energy: 3,
                rank: 4,
                tournament: 'silver'
            }
        ];
        
        console.log("[DEBUG] Nombre total de cartes: " + userCards.length);
        
        // Initialiser les filtres et le tri
        filteredCards = [...userCards];
        
        // Appliquer les filtres et afficher les cartes
        applyFiltersAndSort();
        
        // Mettre à jour les statistiques
        document.querySelector('.collection-stats .cards-count .stat-value').textContent = userCards.length.toString();
        
        // Ajouter les écouteurs d'événements pour la pagination et les boutons d'action
        setupOtherListeners();
    } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
    }
}

/**
 * Configuration des écouteurs d'événements pour les filtres et le tri
 */
function setupFilterSortListeners() {
    console.log("[DEBUG] Configuration des écouteurs pour filtres et tri");
    
    // Appliquer les filtres - Configuration de l'écouteur
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        console.log("[DEBUG] Bouton 'apply-filters' trouvé");
        
        // Supprimer les anciens écouteurs si présents
        const newApplyFiltersBtn = applyFiltersBtn.cloneNode(true);
        applyFiltersBtn.parentNode.replaceChild(newApplyFiltersBtn, applyFiltersBtn);
        
        newApplyFiltersBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Appliquer les filtres'");
            
            const rarityFilter = document.getElementById('filter-rarity').value;
            const energyFilter = document.getElementById('filter-energy').value;
            const tournamentFilter = document.getElementById('filter-tournament').value;
            
            console.log("[DEBUG] Filtres sélectionnés:", {
                rarity: rarityFilter,
                energy: energyFilter,
                tournament: tournamentFilter
            });
            
            // Mettre à jour les filtres actuels
            currentFilters = {
                rarity: rarityFilter,
                energy: energyFilter,
                tournament: tournamentFilter
            };
            
            // Appliquer les filtres et le tri
            applyFiltersAndSort();
            
            // Cacher le menu déroulant
            document.getElementById('filter-dropdown').classList.add('hidden');
        });
    } else {
        console.log("[ERROR] Bouton 'apply-filters' non trouvé");
    }
    
    // Appliquer le tri - Configuration de l'écouteur
    const applySortBtn = document.getElementById('apply-sort');
    if (applySortBtn) {
        console.log("[DEBUG] Bouton 'apply-sort' trouvé");
        
        // Supprimer les anciens écouteurs si présents
        const newApplySortBtn = applySortBtn.cloneNode(true);
        applySortBtn.parentNode.replaceChild(newApplySortBtn, applySortBtn);
        
        newApplySortBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Appliquer le tri'");
            
            const sortBy = document.getElementById('sort-by').value;
            const sortOrder = document.getElementById('sort-order').value;
            
            console.log("[DEBUG] Tri sélectionné:", {
                by: sortBy,
                order: sortOrder
            });
            
            // Mettre à jour le tri actuel
            currentSort = {
                by: sortBy,
                order: sortOrder
            };
            
            // Appliquer les filtres et le tri
            applyFiltersAndSort();
            
            // Cacher le menu déroulant
            document.getElementById('sort-dropdown').classList.add('hidden');
        });
    } else {
        console.log("[ERROR] Bouton 'apply-sort' non trouvé");
    }
    
    // Gérer le bouton de réinitialisation des filtres
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        console.log("[DEBUG] Bouton 'reset-filters' trouvé");
        
        // Supprimer les anciens écouteurs si présents
        const newResetFiltersBtn = resetFiltersBtn.cloneNode(true);
        resetFiltersBtn.parentNode.replaceChild(newResetFiltersBtn, resetFiltersBtn);
        
        newResetFiltersBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Réinitialiser les filtres'");
            
            // Réinitialiser les filtres et le tri dans l'interface
            const filterRarity = document.getElementById('filter-rarity');
            const filterEnergy = document.getElementById('filter-energy');
            const filterTournament = document.getElementById('filter-tournament');
            const sortBy = document.getElementById('sort-by');
            const sortOrder = document.getElementById('sort-order');
            
            if (filterRarity) filterRarity.value = 'all';
            if (filterEnergy) filterEnergy.value = 'all';
            if (filterTournament) filterTournament.value = 'all';
            if (sortBy) sortBy.value = 'name';
            if (sortOrder) sortOrder.value = 'asc';
            
            // Réinitialiser les valeurs actuelles
            currentFilters = {
                rarity: 'all',
                energy: 'all',
                tournament: 'all'
            };
            
            currentSort = {
                by: 'name',
                order: 'asc'
            };
            
            // Appliquer les filtres et tri
            applyFiltersAndSort();
        });
    } else {
        console.log("[ERROR] Bouton 'reset-filters' non trouvé");
    }
}

/**
 * Configuration des autres écouteurs d'événements (pagination, boutons d'action)
 */
function setupOtherListeners() {
    console.log("[DEBUG] Configuration des écouteurs pour pagination et actions");
    
    // Boutons d'action globaux
    const burnBtn = document.getElementById('btn-burn');
    const levelUpBtn = document.getElementById('btn-level-up');
    
    if (burnBtn) {
        burnBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Burn'");
            burnSelectedCards();
        });
    }
    
    if (levelUpBtn) {
        levelUpBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Level Up'");
            levelUpSelectedCards();
        });
    }
    
    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        // Supprimer les anciens écouteurs si présents
        const newPrevPageBtn = prevPageBtn.cloneNode(true);
        prevPageBtn.parentNode.replaceChild(newPrevPageBtn, prevPageBtn);
        
        newPrevPageBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Page précédente'");
            if (currentPage > 1) {
                currentPage--;
                console.log("[DEBUG] Nouvelle page: " + currentPage);
                displayCards();
                updatePagination();
            }
        });
    }
    
    if (nextPageBtn) {
        // Supprimer les anciens écouteurs si présents
        const newNextPageBtn = nextPageBtn.cloneNode(true);
        nextPageBtn.parentNode.replaceChild(newNextPageBtn, nextPageBtn);
        
        newNextPageBtn.addEventListener('click', function() {
            console.log("[DEBUG] Clic sur le bouton 'Page suivante'");
            const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
            console.log("[DEBUG] Total des pages: " + totalPages + ", Page actuelle: " + currentPage);
            
            if (currentPage < totalPages) {
                currentPage++;
                console.log("[DEBUG] Nouvelle page: " + currentPage);
                displayCards();
                updatePagination();
            }
        });
    }
}

/**
 * Applique les filtres et le tri aux cartes
 */
function applyFiltersAndSort() {
    console.log("[DEBUG] Début de l'application des filtres et du tri");
    console.log('[DEBUG] Filtres appliqués:', currentFilters);
    console.log('[DEBUG] Tri appliqué:', currentSort);
    
    // Filtrer les cartes
    filteredCards = userCards.filter(card => {
        // Filtre par rareté
        if (currentFilters.rarity !== 'all' && card.rarity !== currentFilters.rarity) {
            return false;
        }
        
        // Filtre par énergie
        if (currentFilters.energy !== 'all') {
            if (currentFilters.energy === '4+') {
                if (card.energy < 4) return false;
            } else if (card.energy != parseInt(currentFilters.energy)) {
                return false;
            }
        }
        
        // Filtre par catégorie de tournoi
        if (currentFilters.tournament !== 'all' && card.tournament !== currentFilters.tournament) {
            return false;
        }
        
        return true;
    });
    
    console.log(`[DEBUG] Après filtrage: ${filteredCards.length} cartes restantes`);
    
    // Trier les cartes
    filteredCards.sort((a, b) => {
        let valueA = a[currentSort.by];
        let valueB = b[currentSort.by];
        
        // Vérifier si la propriété existe
        if (valueA === undefined || valueB === undefined) {
            console.log(`[ERROR] Propriété de tri "${currentSort.by}" non trouvée dans les cartes`);
            return 0;
        }
        
        // Pour les chaînes de caractères, ignorer la casse
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        // Ordre ascendant ou descendant
        if (currentSort.order === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    console.log(`[DEBUG] Après tri: Liste triée par ${currentSort.by} en ordre ${currentSort.order}`);
    
    // Réinitialiser à la première page
    currentPage = 1;
    
    // Afficher les cartes filtrées et triées
    displayCards();
    
    // Mettre à jour la pagination
    updatePagination();
    updatePaginationVisibility();
}

/**
 * Met à jour la visibilité de la pagination
 */
function updatePaginationVisibility() {
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    const paginationContainer = document.querySelector('.pagination-container');
    
    console.log(`[DEBUG] Mise à jour de la visibilité de la pagination: ${filteredCards.length} cartes, ${totalPages} pages`);
    
    if (totalPages > 1) {
        console.log("[DEBUG] Affichage de la pagination (plusieurs pages)");
        paginationContainer.classList.remove('hidden');
    } else {
        console.log("[DEBUG] Masquage de la pagination (une seule page)");
        paginationContainer.classList.add('hidden');
    }
}

/**
 * Affiche les cartes pour la page courante
 */
function displayCards() {
    console.log(`[DEBUG] Affichage des cartes pour la page ${currentPage}`);
    
    const cardsGrid = document.querySelector('.cards-grid');
    const noResultsSection = document.querySelector('.no-results');
    
    // Masquer à la fois la grille et la section "Aucun résultat"
    cardsGrid.classList.add('hidden');
    noResultsSection.classList.add('hidden');
    
    // Si aucune carte ne correspond aux filtres
    if (filteredCards.length === 0) {
        console.log("[DEBUG] Aucune carte ne correspond aux filtres");
        noResultsSection.classList.remove('hidden');
        return;
    }
    
    // Sinon, afficher les cartes
    cardsGrid.classList.remove('hidden');
    cardsGrid.innerHTML = '';
    
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, filteredCards.length);
    
    console.log(`[DEBUG] Affichage des cartes ${startIndex + 1} à ${endIndex} sur ${filteredCards.length}`);
    
    // Ajouter les cartes de la page courante
    for (let i = startIndex; i < endIndex; i++) {
        const cardData = filteredCards[i];
        const card = document.createElement('div');
        card.className = `card-item ${cardData.rarity}`;
        
        // Déterminer la couleur de la catégorie tournoi
        let tournamentColor = '';
        switch(cardData.tournament) {
            case 'bronze': tournamentColor = '#cd7f32'; break;
            case 'silver': tournamentColor = '#c0c0c0'; break;
            case 'gold': tournamentColor = '#ffd700'; break;
        }
        
        card.innerHTML = `
            <div class="card-rarity">${cardData.rarity.charAt(0).toUpperCase() + cardData.rarity.slice(1)}</div>
            <div class="tournament-badge" style="background-color: ${tournamentColor};">${cardData.tournament.charAt(0).toUpperCase() + cardData.tournament.slice(1)}</div>
            <div class="card-image">
                <img src="${cardData.image}" alt="${cardData.name}" class="card-artwork">
            </div>
            <div class="card-info">
                <h3>${cardData.name}</h3>
            </div>
        `;

        // Ajouter l'écouteur d'événement pour afficher les détails de la carte
        card.addEventListener('click', function() {
            console.log(`[DEBUG] Clic sur la carte "${cardData.name}"`);
            showCardDetails(cardData);
        });
        
        cardsGrid.appendChild(card);
    }
}

/**
 * Met à jour l'état de la pagination
 */
function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / cardsPerPage));
    
    console.log(`[DEBUG] Mise à jour de la pagination: Page ${currentPage}/${totalPages}`);
    
    // Mettre à jour les textes
    const currentPageElem = document.getElementById('current-page');
    const totalPagesElem = document.getElementById('total-pages');
    
    if (currentPageElem) currentPageElem.textContent = currentPage.toString();
    if (totalPagesElem) totalPagesElem.textContent = totalPages.toString();
    
    // Activer/désactiver les boutons de pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = (currentPage <= 1);
        console.log(`[DEBUG] Bouton Précédent ${prevPageBtn.disabled ? 'désactivé' : 'activé'}`);
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = (currentPage >= totalPages);
        console.log(`[DEBUG] Bouton Suivant ${nextPageBtn.disabled ? 'désactivé' : 'activé'}`);
    }
}

/**
 * Fonction pour brûler les cartes sélectionnées (à implémenter plus tard)
 */
function burnSelectedCards() {
    console.log('[DEBUG] Fonction burnSelectedCards() appelée');
    alert('Fonctionnalité "Burn" à implémenter');
}

/**
 * Fonction pour augmenter le niveau des cartes sélectionnées (à implémenter plus tard)
 */
function levelUpSelectedCards() {
    console.log('[DEBUG] Fonction levelUpSelectedCards() appelée');
    alert('Fonctionnalité "Level Up" à implémenter');
}

/**
 * Fonction stub pour afficher les détails d'une carte (à implémenter selon vos besoins)
 */
function showCardDetails(cardData) {
    console.log('[DEBUG] Affichage des détails de la carte:', cardData);
    // Cette fonction pourrait être définie dans card-details.js
    // Si ce n'est pas le cas, nous affichons simplement le nom de la carte
    alert(`Détails de la carte: ${cardData.name}`);
}