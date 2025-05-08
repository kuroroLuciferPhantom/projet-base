const express = require('express');
const router = express.Router();
const batailleController = require('../controllers/batailleController');
const { isAuthenticated } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(isAuthenticated);
router.use(batailleController.initPlayerStats);

// Routes pour l'interface web
router.get('/', batailleController.renderBataillePage);

// Routes API pour les statistiques du joueur
router.get('/api/stats', batailleController.getPlayerStats);
router.get('/api/leaderboard', batailleController.getLeagueLeaderboard);

// Routes API pour les decks
router.get('/api/decks', batailleController.getPlayerDecks);
router.post('/api/decks', batailleController.createDeck);
router.put('/api/decks/:deckId', batailleController.updateDeck);
router.delete('/api/decks/:deckId', batailleController.deleteDeck);
router.post('/api/decks/:deckId/activate', batailleController.activateDeck);

// Routes API pour les combats
router.post('/api/battle/start', batailleController.startBattle);

module.exports = router;