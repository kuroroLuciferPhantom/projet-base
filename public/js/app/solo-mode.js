/**
 * Script principal pour le mode solo - Exploration des Arcanes
 */

// Configuration du mode solo
const soloConfig = {
    gameCost: 10,            // Coût en tokens pour jouer
    maxGamesPerDay: 3,       // Nombre maximal de parties par jour
    startingLives: 10,       // Vies de départ
    minCardSelection: 3,     // Nombre de cartes requises pour commencer
    probabilites: {
        chestCommon: 0.20,   // Coffre commun
        chestRare: 0.10,     // Coffre rare
        chestEpic: 0.03,     // Coffre épique
        enemyWeak: 0.20,     // Ennemi faible
        enemyMedium: 0.10,   // Ennemi moyen
        enemyStrong: 0.10,   // Ennemi fort
        trap: 0.15,          // Piège
        choice: 0.12         // Événement à choix
    },
    // Difficulté par niveau (multiplicateur)
    levelDifficulty: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.3, 3.6, 4, 4.5, 5, 5.5, 6],
    // Récompense par niveau (multiplicateur)
    levelRewards: [1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.3, 3.6, 3.9, 4.2, 4.5, 5, 5.5, 6, 7],
};

// État du jeu
let gameState = {
    initialized: false,      // Si le jeu a été initialisé
    gamesPlayed: 0,          // Nombre de parties jouées aujourd'hui
    selectedCards: [],       // Cartes sélectionnées pour l'équipe
    usedCards: [],           // Cartes déjà utilisées aujourd'hui
    inGame: false,           // Si une partie est en cours
    currentLevel: 0,         // Niveau actuel de l'exploration
    lives: 0,                // Vies restantes
    keys: 0,                 // Clés obtenues
    chests: {                // Coffres obtenus
        common: 0,
        rare: 0,
        epic: 0
    },
    tokensEarned: 0,         // Tokens gagnés pendant la partie
    enemiesDefeated: 0,      // Ennemis vaincus
    eventsEncountered: 0,    // Événements rencontrés
    bestScore: 0,            // Meilleur score (niveau atteint)
};

// Initialisation du module solo
document.addEventListener('DOMContentLoaded', function() {
    initSoloMode();
});

// Fonction d'initialisation du mode solo
function initSoloMode() {
    // Simuler des données stockées
    const storedGamesPlayed = localStorage.getItem('solo_gamesPlayed');
    const storedUsedCards = localStorage.getItem('solo_usedCards');
    const storedBestScore = localStorage.getItem('solo_bestScore');
    
    // Charger l'état sauvegardé si disponible
    gameState.gamesPlayed = storedGamesPlayed ? parseInt(storedGamesPlayed) : 0;
    gameState.usedCards = storedUsedCards ? JSON.parse(storedUsedCards) : [];
    gameState.bestScore = storedBestScore ? parseInt(storedBestScore) : 0;
    
    // Mettre à jour l'interface
    updateSoloInterfaceState();
    updateCardSelection();
    
    // Définir les gestionnaires d'événements
    setupEventListeners();
    
    gameState.initialized = true;
}

// Configurer les gestionnaires d'événements
function setupEventListeners() {
    // Bouton de démarrage de l'expédition
    const startExpeditionBtn = document.getElementById('start-expedition');
    if (startExpeditionBtn) {
        startExpeditionBtn.addEventListener('click', startGame);
    }
    
    // Bouton de révélation d'événement
    const revealEventBtn = document.getElementById('reveal-event');
    if (revealEventBtn) {
        revealEventBtn.addEventListener('click', revealEvent);
    }
    
    // Boutons d'action de jeu
    const stopBtn = document.getElementById('btn-stop');
    if (stopBtn) {
        stopBtn.addEventListener('click', endGame);
    }
    
    const continueBtn = document.getElementById('btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('click', nextLevel);
    }
    
    // Bouton de retour aux résultats
    const returnBtn = document.getElementById('return-to-solo');
    if (returnBtn) {
        returnBtn.addEventListener('click', returnToSoloIntro);
    }
}

// Sauvegarder l'état du jeu
function saveGameState() {
    localStorage.setItem('solo_gamesPlayed', gameState.gamesPlayed);
    localStorage.setItem('solo_usedCards', JSON.stringify(gameState.usedCards));
    localStorage.setItem('solo_bestScore', gameState.bestScore);
}