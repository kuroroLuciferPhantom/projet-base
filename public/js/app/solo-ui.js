/**
 * Interface utilisateur pour le mode solo - Exploration des Arcanes
 */

// Mettre à jour l'interface selon l'état du jeu
function updateSoloInterfaceState() {
    // Mettre à jour les informations du mode solo
    document.getElementById('games-remaining').textContent = soloConfig.maxGamesPerDay - gameState.gamesPlayed;
    document.getElementById('best-score').textContent = gameState.bestScore;
    document.getElementById('game-cost').textContent = soloConfig.gameCost;
    
    // Charger les cartes disponibles
    loadAvailableCards();
    
    // Mettre à jour l'état du bouton de démarrage
    updateStartButtonState();

    const actionButtons = document.querySelector('.solo-actions');
    if (actionButtons) {
        // Vérifier si le bouton de réinitialisation existe déjà
        if (!document.getElementById('reset-test-btn')) {
            const resetButton = document.createElement('button');
            resetButton.id = 'reset-test-btn';
            resetButton.className = 'btn btn-link reset-test-btn';
            resetButton.innerHTML = '<i class="fas fa-wrench"></i>';
            resetButton.title = 'Réinitialiser les cartes utilisées (Mode test)';
            
            resetButton.addEventListener('click', function(e) {
                e.preventDefault();
                resetUsedCards();
            });
            
            actionButtons.appendChild(resetButton);
        }
    }
}

// Réinitialiser les cartes utilisées
function resetUsedCards() {
    gameState.usedCards = [];
    localStorage.setItem('solo_usedCards', JSON.stringify(gameState.usedCards));
    
    // Recharger les cartes disponibles
    loadAvailableCards();
    
    // Afficher un message de confirmation
    alert('Les cartes utilisées ont été réinitialisées. Toutes les cartes sont maintenant disponibles.');
}

// Charger les cartes disponibles dans l'interface
function loadAvailableCards() {
    const cardsContainer = document.getElementById('solo-available-cards');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    availableCards.forEach(card => {
        // Vérifier si la carte a déjà été utilisée aujourd'hui
        const isUsed = gameState.usedCards.includes(card.id);
        const isSelected = gameState.selectedCards.some(c => c.id === card.id);
        
        // Créer l'élément de carte
        const cardElement = document.createElement('div');
        cardElement.className = `card-item ${card.rarity} ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`;
        cardElement.dataset.cardId = card.id;
        
        cardElement.innerHTML = `
            <div class="card-rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
            <div class="card-image">
                <img src="${card.image}" alt="${card.name}" class="card-artwork">
            </div>
            <div class="card-info">
                <h3>${card.name}</h3>
            </div>
        `;
        
        // Ajouter l'événement de clic uniquement si la carte n'est pas utilisée
        if (!isUsed && !isSelected) {
            cardElement.addEventListener('click', () => selectCard(card));
        }
        
        cardsContainer.appendChild(cardElement);
    });
}

// Sélectionner une carte pour l'équipe
function selectCard(card) {
    // Vérifier si nous avons déjà 3 cartes sélectionnées
    if (gameState.selectedCards.length >= soloConfig.minCardSelection) {
        alert(`Vous avez déjà sélectionné le maximum de ${soloConfig.minCardSelection} cartes.`);
        return;
    }
    
    // Ajouter la carte à la sélection
    gameState.selectedCards.push(card);
    
    // Mettre à jour l'interface
    updateCardSelection();
    updateStartButtonState();
    
    // Actualiser la liste des cartes disponibles
    loadAvailableCards();
}

// Désélectionner une carte
function deselectCard(cardId) {
    // Retirer la carte de la sélection
    gameState.selectedCards = gameState.selectedCards.filter(card => card.id !== cardId);
    
    // Mettre à jour l'interface
    updateCardSelection();
    updateStartButtonState();
    
    // Actualiser la liste des cartes disponibles
    loadAvailableCards();
}

// Mettre à jour l'affichage des cartes sélectionnées
function updateCardSelection() {
    // Sélectionner directement les slots sans utiliser une variable intermédiaire
    document.querySelectorAll('.card-slot').forEach((slot, index) => {
        // Nettoyer les gestionnaires d'événements en clonant et remplaçant
        const newSlot = slot.cloneNode(false); // false pour ne pas cloner les enfants
        
        // Déterminer si ce slot doit être rempli ou vide
        if (index < gameState.selectedCards.length) {
            // Ce slot doit être rempli avec une carte
            const card = gameState.selectedCards[index];
            newSlot.className = 'card-slot filled';
            newSlot.innerHTML = `
                <div class="card-remove" data-card-id="${card.id}">
                    <i class="fas fa-times"></i>
                </div>
                <div class="card-item ${card.rarity}">
                    <div class="card-rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
                    <div class="card-image">
                        <img src="${card.image}" alt="${card.name}" class="card-artwork" style="object-fit: contain;">
                    </div>
                </div>
            `;
        } else {
            // Ce slot doit être vide
            newSlot.className = 'card-slot empty';
            newSlot.innerHTML = `
                <div class="slot-placeholder">
                    <i class="fas fa-plus"></i>
                    <span>Sélectionner</span>
                </div>
            `;
            
            // Ajouter directement l'événement de clic
            newSlot.onclick = function() {
                console.log("Slot vide cliqué, ouverture de la modal");
                openCardSelectionModal();
            };
        }
        
        // Remplacer l'ancien slot par le nouveau
        slot.parentNode.replaceChild(newSlot, slot);
        
        // Si c'est un slot rempli, ajouter l'événement au bouton de suppression
        if (index < gameState.selectedCards.length) {
            const removeBtn = newSlot.querySelector('.card-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Empêcher le clic de se propager
                    const cardId = parseInt(this.dataset.cardId);
                    deselectCard(cardId);
                });
            }
        }
    });
}

// Ouvrir la modale de sélection de carte
function openCardSelectionModal() {
    const modal = document.getElementById('card-selection-modal');
    const modalBody = modal.querySelector('.modal-body');
    const cardsContainer = document.getElementById('selectable-cards');
    
    // Vider le conteneur de cartes et supprimer les éléments précédents
    cardsContainer.innerHTML = '';
    
    // Supprimer l'ancien header s'il existe
    const oldHeader = modal.querySelector('.selection-header-container');
    if (oldHeader) {
        oldHeader.remove();
    }
    
    // Créer l'en-tête avec filtres
    const headerContainer = document.createElement('div');
    headerContainer.className = 'selection-header-container';
    headerContainer.innerHTML = `
        <div class="selection-header">
            <h3>Sélectionnez une carte pour votre équipe</h3>
            <p class="selection-description">Chaque carte ne peut participer qu'à une exploration par jour</p>
        </div>
        <div class="selection-filters">
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all">Toutes</button>
                <button class="filter-tab" data-filter="common">Communes</button>
                <button class="filter-tab" data-filter="uncommon">Peu communes</button>
                <button class="filter-tab" data-filter="rare">Rares</button>
                <button class="filter-tab" data-filter="epic">Épiques</button>
                <button class="filter-tab" data-filter="legendary">Légendaires</button>
            </div>
            <div class="filter-controls">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="card-search" placeholder="Rechercher...">
                </div>
                <div class="sort-control">
                    <label for="sort-select">Trier par:</label>
                    <select id="sort-select" class="sort-select">
                        <option value="name">Nom</option>
                        <option value="attack">Attaque ↓</option>
                        <option value="defense">Défense ↓</option>
                        <option value="rarity">Rareté ↓</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    // Insérer l'en-tête avant le conteneur de cartes
    modalBody.insertBefore(headerContainer, cardsContainer);
    
    // Charger les cartes disponibles (non utilisées et non déjà sélectionnées)
    availableCards.forEach(card => {
        const isUsed = gameState.usedCards.includes(card.id);
        const isSelected = gameState.selectedCards.some(c => c.id === card.id);
        
        // Ne pas afficher les cartes déjà sélectionnées ou utilisées
        if (!isUsed && !isSelected) {
            const cardElement = document.createElement('div');
            cardElement.className = `card-item ${card.rarity}`;
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.name = card.name.toLowerCase();
            cardElement.dataset.attack = card.attack;
            cardElement.dataset.defense = card.defense;
            
            cardElement.innerHTML = `
                <div class="card-selection-overlay">
                    <button class="select-card-btn">Sélectionner</button>
                </div>
                <div class="card-rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
                <div class="card-image">
                    <img src="${card.image}" alt="${card.name}" class="card-artwork" style="object-fit: contain;">
                </div>
                <div class="card-info">
                    <h3>${card.name}</h3>
                </div>
            `;
            
            // Ajouter l'événement de clic
            cardElement.addEventListener('click', () => {
                selectCard(card);
                modal.style.display = 'none';
                
                // Nettoyer la modal après utilisation
                headerContainer.remove();
            });
            
            cardsContainer.appendChild(cardElement);
        }
    });
    
    // Configurer les filtres
    const filterTabs = headerContainer.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Mettre à jour l'état actif des onglets
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Appliquer le filtre
            const filter = this.dataset.filter;
            filterCards(filter);
        });
    });
    
    // Configurer la recherche
    const searchInput = headerContainer.querySelector('#card-search');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchCards(searchTerm);
    });
    
    // Configurer le tri
    const sortSelect = headerContainer.querySelector('#sort-select');
    sortSelect.addEventListener('change', function() {
        sortCards(this.value);
    });
    
    // Afficher la modal
    modal.style.display = 'block';
    
    // S'assurer que les événements de fermeture sont configurés
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            headerContainer.remove();
        });
    }
    
    const cancelBtn = document.getElementById('cancel-card-selection');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            headerContainer.remove();
        });
    }
}

// Fonction pour filtrer les cartes par rareté
function filterCards(rarity) {
    const cards = document.querySelectorAll('#selectable-cards .card-item');
    cards.forEach(card => {
        if (rarity === 'all' || card.classList.contains(rarity)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fonction pour rechercher des cartes par nom
function searchCards(searchTerm) {
    const cards = document.querySelectorAll('#selectable-cards .card-item');
    cards.forEach(card => {
        const cardName = card.dataset.name;
        if (cardName.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fonction pour trier les cartes
function sortCards(sortBy) {
    const cardsContainer = document.getElementById('selectable-cards');
    const cards = Array.from(cardsContainer.querySelectorAll('.card-item'));
    
    cards.sort((a, b) => {
        if (sortBy === 'name') {
            return a.dataset.name.localeCompare(b.dataset.name);
        } else if (sortBy === 'attack') {
            return parseInt(b.dataset.attack) - parseInt(a.dataset.attack);
        } else if (sortBy === 'defense') {
            return parseInt(b.dataset.defense) - parseInt(a.dataset.defense);
        } else if (sortBy === 'rarity') {
            const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
            const rarityA = a.classList.contains('legendary') ? 'legendary' : 
                           a.classList.contains('epic') ? 'epic' : 
                           a.classList.contains('rare') ? 'rare' : 
                           a.classList.contains('uncommon') ? 'uncommon' : 'common';
            const rarityB = b.classList.contains('legendary') ? 'legendary' : 
                           b.classList.contains('epic') ? 'epic' : 
                           b.classList.contains('rare') ? 'rare' : 
                           b.classList.contains('uncommon') ? 'uncommon' : 'common';
            return rarityOrder[rarityB] - rarityOrder[rarityA];
        }
    });
    
    // Réinsérer les cartes triées
    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });
}

// Mettre à jour l'état du bouton de démarrage
function updateStartButtonState() {
    const startButton = document.getElementById('start-expedition');
    if (!startButton) return;
    
    const canStart = gameState.selectedCards.length === soloConfig.minCardSelection && 
                      gameState.gamesPlayed < soloConfig.maxGamesPerDay;
    
    startButton.disabled = !canStart;
    
    if (gameState.gamesPlayed >= soloConfig.maxGamesPerDay) {
        startButton.textContent = 'Limite de parties atteinte aujourd\'hui';
    } else if (gameState.selectedCards.length < soloConfig.minCardSelection) {
        startButton.textContent = `Sélectionnez ${soloConfig.minCardSelection} cartes`;
    } else {
        startButton.innerHTML = '<i class="fas fa-hiking"></i> Lancer l\'expédition';
    }
}

// Mettre à jour l'interface du jeu
function updateGameInterface(resetEvent = true) {
    // Mettre à jour les informations du niveau
    document.getElementById('current-level').textContent = gameState.currentLevel;
    
    // Mettre à jour les statistiques du joueur
    document.getElementById('player-lives').textContent = gameState.lives;
    document.getElementById('player-keys').textContent = gameState.keys;
    document.getElementById('common-chests').textContent = gameState.chests.common;
    document.getElementById('rare-chests').textContent = gameState.chests.rare;
    document.getElementById('epic-chests').textContent = gameState.chests.epic;
    document.getElementById('earned-tokens').textContent = gameState.tokensEarned;
    
    // Afficher les cartes de l'équipe
    const teamContainer = document.getElementById('team-cards-container');
    teamContainer.innerHTML = '';
    
    gameState.selectedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card-item ${card.rarity}`;
        
        cardElement.innerHTML = `
            <div class="card-rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
            <div class="card-image">
                <img src="${card.image}" alt="${card.name}" class="card-artwork">
            </div>
            <div class="card-info">
                <h3>${card.name}</h3>
            </div>
        `;
        
        teamContainer.appendChild(cardElement);
    });
    
    // Réinitialiser l'affichage de l'événement si demandé
    if (resetEvent) {
        document.getElementById('event-placeholder').classList.remove('hidden');
        document.getElementById('event-display').classList.add('hidden');
        document.getElementById('game-actions').classList.add('hidden');
    }
}