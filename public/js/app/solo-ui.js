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
    const slots = [
        document.getElementById('card-slot-1'),
        document.getElementById('card-slot-2'),
        document.getElementById('card-slot-3')
    ];
    
    // Réinitialiser tous les slots
    slots.forEach(slot => {
        slot.className = 'card-slot empty';
        slot.innerHTML = `
            <div class="slot-placeholder">
                <i class="fas fa-plus"></i>
                <span>Sélectionner</span>
            </div>
        `;
    });
    
    // Remplir les slots avec les cartes sélectionnées
    gameState.selectedCards.forEach((card, index) => {
        if (index < slots.length) {
            slots[index].className = 'card-slot filled';
            slots[index].innerHTML = `
                <div class="card-remove" data-card-id="${card.id}">
                    <i class="fas fa-times"></i>
                </div>
                <div class="card-item ${card.rarity}">
                    <div class="card-rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
                    <div class="card-image">
                        <img src="${card.image}" alt="${card.name}" class="card-artwork">
                    </div>
                    <div class="card-info">
                        <h3>${card.name}</h3>
                    </div>
                </div>
            `;
            
            // Ajouter l'événement de clic pour retirer la carte
            const removeBtn = slots[index].querySelector('.card-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deselectCard(parseInt(e.currentTarget.dataset.cardId));
            });
        }
    });
    
    // Ajouter les événements de clic pour les slots vides
    slots.forEach((slot, index) => {
        if (index >= gameState.selectedCards.length) {
            slot.addEventListener('click', openCardSelectionModal);
        }
    });
}

// Ouvrir la modale de sélection de carte
function openCardSelectionModal() {
    // Cette fonction serait implémentée dans une version complète
    // Pour l'instant, nous utilisons la sélection directe depuis la grille
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
function updateGameInterface() {
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
    
    // Réinitialiser l'affichage de l'événement
    document.getElementById('event-placeholder').classList.remove('hidden');
    document.getElementById('event-display').classList.add('hidden');
    document.getElementById('game-actions').classList.add('hidden');
}