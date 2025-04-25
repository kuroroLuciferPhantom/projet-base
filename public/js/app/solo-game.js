/**
 * Logique de jeu pour le mode solo - Exploration des Arcanes
 */

// Catalogue de cartes disponibles (simulé pour cette démo)
const availableCards = [
    {
        id: 1,
        name: "Guerrier à poils",
        rarity: "common",
        image: "/img/cards/3.jpg",
        attack: 25,
        defense: 30,
        energy: 1,
        used: false
    },
    {
        id: 2,
        name: "Bambo",
        rarity: "uncommon",
        image: "/img/cards/4.jpg",
        attack: 40,
        defense: 40,
        energy: 2,
        used: false
    },
    {
        id: 3,
        name: "Sursumot",
        rarity: "uncommon",
        image: "/img/cards/5.jpg",
        attack: 50,
        defense: 20,
        energy: 2,
        used: false
    },
    {
        id: 4,
        name: "RIG",
        rarity: "epic",
        image: "/img/cards/1.jpg",
        attack: 60,
        defense: 80,
        energy: 3,
        used: false
    },
    {
        id: 5,
        name: "Mulk",
        rarity: "legendary",
        image: "/img/cards/2.jpg",
        attack: 80,
        defense: 80,
        energy: 4,
        used: false
    }
];

// Démarrer une partie
function startGame() {
    // Vérifier les conditions de démarrage
    if (gameState.selectedCards.length !== soloConfig.minCardSelection || 
        gameState.gamesPlayed >= soloConfig.maxGamesPerDay) {
        return;
    }
    
    // Initialiser l'état du jeu
    gameState.inGame = true;
    gameState.currentLevel = 1; // S'assurer que le niveau démarre à 1
    gameState.lives = soloConfig.startingLives;
    gameState.keys = 0;
    gameState.chests = { common: 0, rare: 0, epic: 0 };
    gameState.tokensEarned = 0;
    gameState.enemiesDefeated = 0;
    gameState.eventsEncountered = 0;
    
    // Mettre à jour explicitement le niveau affiché
    document.getElementById('current-level').textContent = gameState.currentLevel;
    
    // Mettre à jour l'interface
    updateGameInterface();
    
    // Basculer vers l'écran de jeu
    document.getElementById('solo-intro').classList.add('hidden');
    document.getElementById('solo-gameplay').classList.remove('hidden');
    
    // Ajouter les cartes sélectionnées à la liste des cartes utilisées
    gameState.selectedCards.forEach(card => {
        if (!gameState.usedCards.includes(card.id)) {
            gameState.usedCards.push(card.id);
        }
    });
    
    // Sauvegarder l'état
    saveGameState();
    
    // Augmenter le compteur de parties jouées
    gameState.gamesPlayed++;
}

// Passer au niveau suivant
function nextLevel() {
    // Augmenter le niveau
    gameState.currentLevel++;
    
    // Mettre à jour le record si nécessaire
    if (gameState.currentLevel > gameState.bestScore) {
        gameState.bestScore = gameState.currentLevel;
        saveGameState();
    }
    
    // Réinitialiser l'affichage de l'événement
    document.getElementById('event-placeholder').classList.remove('hidden');
    document.getElementById('event-display').classList.add('hidden');
    document.getElementById('game-actions').classList.add('hidden');
    
    // Mettre à jour l'interface
    updateGameInterface(false); // Ne pas réinitialiser à nouveau l'affichage
    
    // Assurer que le niveau affiché est correct
    document.getElementById('current-level').textContent = gameState.currentLevel;
}

// Terminer la partie (arrêter volontairement ou défaite)
function endGame(defeated = false) {
    gameState.inGame = false;
    
    // Préparer l'écran de résultats
    const resultType = document.getElementById('result-type');
    
    if (defeated) {
        resultType.className = 'result-type defeat';
        resultType.textContent = 'Défaite';
    } else {
        resultType.className = 'result-type retreat';
        resultType.textContent = 'Retraite stratégique';
    }
    
    // Mettre à jour les statistiques de résumé
    document.getElementById('summary-levels').textContent = gameState.currentLevel;
    document.getElementById('summary-chests').textContent = 
        gameState.chests.common + gameState.chests.rare + gameState.chests.epic;
    document.getElementById('summary-enemies').textContent = gameState.enemiesDefeated;
    document.getElementById('summary-tokens').textContent = gameState.tokensEarned;
    
    // Afficher les récompenses
    displayRewards();
    
    // Basculer vers l'écran de résultats
    document.getElementById('solo-gameplay').classList.add('hidden');
    document.getElementById('solo-results').classList.remove('hidden');
}

// Calculer le multiplicateur de difficulté actuel
function getDifficultyMultiplier() {
    // Limiter à la taille du tableau
    const levelIndex = Math.min(gameState.currentLevel - 1, soloConfig.levelDifficulty.length - 1);
    return soloConfig.levelDifficulty[levelIndex];
}

// Calculer le multiplicateur de récompense actuel
function getRewardMultiplier() {
    // Limiter à la taille du tableau
    const levelIndex = Math.min(gameState.currentLevel - 1, soloConfig.levelRewards.length - 1);
    return soloConfig.levelRewards[levelIndex];
}

// Retourner à l'écran d'introduction du mode solo
function returnToSoloIntro() {
    // Réinitialiser la sélection de cartes
    gameState.selectedCards = [];
    
    // Masquer l'écran de résultats
    document.getElementById('solo-results').classList.add('hidden');
    
    // Afficher l'écran d'introduction
    document.getElementById('solo-intro').classList.remove('hidden');
    
    // Mettre à jour l'interface
    updateSoloInterfaceState();
}

// Afficher les récompenses obtenues
function displayRewards() {
    const rewardsContainer = document.getElementById('rewards-container');
    rewardsContainer.innerHTML = '';
    
    // Afficher les tokens gagnés
    if (gameState.tokensEarned > 0) {
        const tokenReward = document.createElement('div');
        tokenReward.className = 'reward-item';
        tokenReward.innerHTML = `
            <div class="reward-icon">
                <i class="fas fa-coins" style="color: #f1c40f;"></i>
            </div>
            <div class="reward-value">${gameState.tokensEarned}</div>
            <div class="reward-label">$CCARD</div>
        `;
        rewardsContainer.appendChild(tokenReward);
    }
    
    // Afficher les clés obtenues
    if (gameState.keys > 0) {
        const keyReward = document.createElement('div');
        keyReward.className = 'reward-item';
        keyReward.innerHTML = `
            <div class="reward-icon">
                <i class="fas fa-key" style="color: #f39c12;"></i>
            </div>
            <div class="reward-value">${gameState.keys}</div>
            <div class="reward-label">Clés</div>
        `;
        rewardsContainer.appendChild(keyReward);
    }
    
    // Afficher les coffres obtenus
    if (gameState.chests.common > 0) {
        const commonChestReward = document.createElement('div');
        commonChestReward.className = 'reward-item';
        commonChestReward.innerHTML = `
            <div class="reward-icon">
                <i class="fas fa-treasure-chest" style="color: #95a5a6;"></i>
            </div>
            <div class="reward-value">${gameState.chests.common}</div>
            <div class="reward-label">Coffres communs</div>
        `;
        rewardsContainer.appendChild(commonChestReward);
    }
    
    if (gameState.chests.rare > 0) {
        const rareChestReward = document.createElement('div');
        rareChestReward.className = 'reward-item';
        rareChestReward.innerHTML = `
            <div class="reward-icon">
                <i class="fas fa-treasure-chest" style="color: #3498db;"></i>
            </div>
            <div class="reward-value">${gameState.chests.rare}</div>
            <div class="reward-label">Coffres rares</div>
        `;
        rewardsContainer.appendChild(rareChestReward);
    }
    
    if (gameState.chests.epic > 0) {
        const epicChestReward = document.createElement('div');
        epicChestReward.className = 'reward-item';
        epicChestReward.innerHTML = `
            <div class="reward-icon">
                <i class="fas fa-treasure-chest" style="color: #9b59b6;"></i>
            </div>
            <div class="reward-value">${gameState.chests.epic}</div>
            <div class="reward-label">Coffres épiques</div>
        `;
        rewardsContainer.appendChild(epicChestReward);
    }
    
    // Mettre à jour le nombre de clés disponibles
    document.getElementById('keys-available').textContent = gameState.keys;
}