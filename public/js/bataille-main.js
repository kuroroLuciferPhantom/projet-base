/**
 * Script principal pour la fonctionnalité Bataille
 * Initialise les modules et coordonne les fonctionnalités
 */

document.addEventListener('DOMContentLoaded', function() {
    // Namespace global pour la bataille
    window.Bataille = window.Bataille || {};
    
    // État global de l'application
    Bataille.state = {
        stats: null,
        decks: [],
        leaderboard: [],
        selectedDeckForBattle: null,
        cardCollection: [],
        selectedCards: [],
        currentDeck: null
    };
    
    // Éléments du DOM communs
    Bataille.elements = {
        // Statistiques
        statsLoading: document.getElementById('stats-loading'),
        playerStats: document.getElementById('player-stats'),
        leagueName: document.getElementById('league-name'),
        leagueIcon: document.getElementById('league-icon'),
        leagueRank: document.getElementById('league-rank'),
        playerWins: document.getElementById('player-wins'),
        playerLosses: document.getElementById('player-losses'),
        playerWinrate: document.getElementById('player-winrate'),
        playerElo: document.getElementById('player-elo'),
        
        // Decks
        decksLoading: document.getElementById('decks-loading'),
        decksContainer: document.getElementById('decks-container'),
        decksList: document.getElementById('decks-list'),
        noDecks: document.getElementById('no-decks'),
        createDeckBtn: document.getElementById('create-deck-btn'),
        
        // Leaderboard
        leaderboardLoading: document.getElementById('leaderboard-loading'),
        leaderboardTableContainer: document.getElementById('leaderboard-table-container'),
        leaderboardLeague: document.getElementById('leaderboard-league'),
        leaderboardCount: document.getElementById('leaderboard-count'),
        leaderboardBody: document.getElementById('leaderboard-body'),
        promotionThreshold: document.getElementById('promotion-threshold'),
        demotionThreshold: document.getElementById('demotion-threshold'),
        
        // Combat
        battleDeckSelection: document.getElementById('battle-deck-selection'),
        noBattleDecks: document.getElementById('no-battle-decks'),
        battleDecksList: document.getElementById('battle-decks-list'),
        startBattleBtn: document.getElementById('start-battle-btn'),
        
        // Modaux
        deckModal: document.getElementById('deck-modal'),
        deckModalTitle: document.getElementById('deck-modal-title'),
        deckForm: document.getElementById('deck-form'),
        deckId: document.getElementById('deck-id'),
        deckName: document.getElementById('deck-name'),
        deckDescription: document.getElementById('deck-description'),
        selectedCardsCount: document.getElementById('selected-cards-count'),
        selectedCardsList: document.getElementById('selected-cards-list'),
        availableCardsList: document.getElementById('available-cards-list'),
        cardSearch: document.getElementById('card-search'),
        cardRarityFilter: document.getElementById('card-rarity-filter'),
        saveDeckBtn: document.getElementById('save-deck-btn'),
        cancelDeckBtn: document.getElementById('cancel-deck-btn'),
        closeDeckModal: document.getElementById('close-deck-modal'),
        
        // Modal de suppression
        deleteDeckModal: document.getElementById('delete-deck-modal'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        closeDeleteModal: document.getElementById('close-delete-modal')
    };

    // Templates
    Bataille.templates = {
        deck: document.getElementById('deck-template'),
        cardSelection: document.getElementById('card-selection-template'),
        battleDeck: document.getElementById('battle-deck-template')
    };

    // Initialisation
    function init() {
        if (!checkElements()) return;
        
        // Charger les données initiales
        Bataille.Stats.loadPlayerStats();
        Bataille.Decks.loadPlayerDecks();
        Bataille.Stats.loadLeaderboard();
        
        // Attacher les événements
        attachEvents();
    }

    // Vérifier que tous les éléments DOM nécessaires sont présents
    function checkElements() {
        // Liste des éléments clés requis
        const requiredElements = [
            'statsLoading', 'playerStats', 'decksLoading', 'decksContainer',
            'leaderboardLoading', 'battleDecksList', 'startBattleBtn',
            'deckModal', 'deckForm', 'deleteDeckModal'
        ];
        
        // Vérifier chaque élément
        let allPresent = true;
        requiredElements.forEach(elementName => {
            if (!Bataille.elements[elementName]) {
                console.error(`Élément DOM manquant: ${elementName}`);
                allPresent = false;
            }
        });
        
        // Vérifier les templates
        const requiredTemplates = ['deck', 'cardSelection', 'battleDeck'];
        requiredTemplates.forEach(templateName => {
            if (!Bataille.templates[templateName]) {
                console.error(`Template manquant: ${templateName}`);
                allPresent = false;
            }
        });
        
        return allPresent;
    }

    // Attacher les événements
    function attachEvents() {
        // Création et gestion des decks
        Bataille.elements.createDeckBtn.addEventListener('click', () => Bataille.Decks.openDeckModal());
        Bataille.elements.cancelDeckBtn.addEventListener('click', Bataille.Decks.closeDeckModal);
        Bataille.elements.closeDeckModal.addEventListener('click', Bataille.Decks.closeDeckModal);
        Bataille.elements.deckForm.addEventListener('submit', Bataille.Decks.saveDeck);
        
        // Filtres de cartes
        Bataille.elements.cardSearch.addEventListener('input', Bataille.Decks.updateAvailableCardsList);
        Bataille.elements.cardRarityFilter.addEventListener('change', Bataille.Decks.updateAvailableCardsList);
        
        // Modal de suppression
        Bataille.elements.confirmDeleteBtn.addEventListener('click', Bataille.Decks.deleteDeck);
        Bataille.elements.cancelDeleteBtn.addEventListener('click', Bataille.Decks.closeDeleteModal);
        Bataille.elements.closeDeleteModal.addEventListener('click', Bataille.Decks.closeDeleteModal);
        
        // Combat
        Bataille.elements.startBattleBtn.addEventListener('click', Bataille.Battle.startBattle);
    }

    // Attendre que tous les modules soient chargés avant d'initialiser
    function checkAllModulesLoaded() {
        if (
            typeof Bataille.Stats !== 'undefined' &&
            typeof Bataille.Decks !== 'undefined' &&
            typeof Bataille.Battle !== 'undefined' &&
            typeof Bataille.UI !== 'undefined'
        ) {
            init();
        } else {
            // Réessayer après un court délai
            setTimeout(checkAllModulesLoaded, 50);
        }
    }
    
    // Démarrer la vérification des modules
    checkAllModulesLoaded();
});
