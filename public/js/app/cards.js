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

/**
 * Charge et affiche les cartes de l'utilisateur
 */
async function loadUserCards() {
    try {
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
            }
        ];
        
        // Appliquer les filtres et afficher les cartes
        applyFiltersAndSort();
        
        // Afficher la pagination seulement s'il y a plus d'une page
        const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
        const paginationContainer = document.querySelector('.pagination-container');
        
        if (totalPages > 1) {
            paginationContainer.classList.remove('hidden');
        } else {
            paginationContainer.classList.add('hidden');
        }
        
        updatePagination();
        
        // Mettre à jour les statistiques
        document.querySelector('.collection-stats .cards-count .stat-value').textContent = userCards.length.toString();
        
        // Ajouter les écouteurs d'événements pour les filtres et le tri
        setupEventListeners();
    } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
    }
}

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
    // Filtrage
    document.getElementById('filter-cards').addEventListener('click', function() {
        const dropdown = document.getElementById('filter-dropdown');
        dropdown.classList.toggle('hidden');
        
        // Cacher le dropdown de tri si ouvert
        document.getElementById('sort-dropdown').classList.add('hidden');
    });
    
    document.getElementById('apply-filters').addEventListener('click', function() {
        currentFilters = {
            rarity: document.getElementById('filter-rarity').value,
            energy: document.getElementById('filter-energy').value,
            tournament: document.getElementById('filter-tournament').value
        };
        
        currentPage = 1;
        applyFiltersAndSort();
        document.getElementById('filter-dropdown').classList.add('hidden');
    });
    
    // Tri
    document.getElementById('sort-cards').addEventListener('click', function() {
        const dropdown = document.getElementById('sort-dropdown');
        dropdown.classList.toggle('hidden');
        
        // Cacher le dropdown de filtre si ouvert
        document.getElementById('filter-dropdown').classList.add('hidden');
    });
    
    document.getElementById('apply-sort').addEventListener('click', function() {
        currentSort = {
            by: document.getElementById('sort-by').value,
            order: document.getElementById('sort-order').value
        };
        
        applyFiltersAndSort();
        document.getElementById('sort-dropdown').classList.add('hidden');
    });
    
    // Pagination
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayCards();
            updatePagination();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayCards();
            updatePagination();
        }
    });
    
    // Boutons d'action globaux
    document.getElementById('btn-burn').addEventListener('click', function() {
        burnSelectedCards();
    });
    
    document.getElementById('btn-level-up').addEventListener('click', function() {
        levelUpSelectedCards();
    });
}

/**
 * Applique les filtres et le tri aux cartes
 */
function applyFiltersAndSort() {
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
    
    // Trier les cartes
    filteredCards.sort((a, b) => {
        let valueA = a[currentSort.by];
        let valueB = b[currentSort.by];
        
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
    
    // Réinitialiser à la première page
    currentPage = 1;
    
    // Afficher les cartes filtrées et triées
    displayCards();
    updatePagination();
}

/**
 * Affiche les cartes pour la page courante
 */
function displayCards() {
    const cardsGrid = document.querySelector('.cards-grid');
    cardsGrid.innerHTML = '';
    
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, filteredCards.length);
    
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
    
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    // Activer/désactiver les boutons de pagination
    document.getElementById('prev-page').disabled = (currentPage <= 1);
    document.getElementById('next-page').disabled = (currentPage >= totalPages);
}

/**
 * Fonction pour brûler les cartes sélectionnées (à implémenter plus tard)
 */
function burnSelectedCards() {
    console.log('Burn selected cards');
    alert('Fonctionnalité "Burn" à implémenter');
}

/**
 * Fonction pour augmenter le niveau des cartes sélectionnées (à implémenter plus tard)
 */
function levelUpSelectedCards() {
    console.log('Level up selected cards');
    alert('Fonctionnalité "Level Up" à implémenter');
}