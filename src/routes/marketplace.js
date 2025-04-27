const express = require('express');
const router = express.Router();
const { isAuthenticated, isAuthenticatedApi } = require('../middleware/auth');
const marketController = require('../controllers/marketController');

// Routes pour les vues
router.get('/', marketController.getMarketCards);
router.get('/card/:id', marketController.getMarketCardDetails);
router.get('/history', marketController.getMarketHistory);
router.get('/stats', marketController.getMarketStats);

// Routes API nécessitant une authentification
router.post('/api/buy', isAuthenticatedApi, marketController.buyCard);
router.post('/api/sell', isAuthenticatedApi, marketController.sellCard);
router.delete('/api/card/:cardId/listing', isAuthenticatedApi, marketController.removeFromMarket);

module.exports = router;
