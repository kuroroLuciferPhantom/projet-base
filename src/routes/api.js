const express = require('express');
const router = express.Router();
const { isAuthenticatedApi } = require('../middleware/auth');

// Contrôleurs
const cardsController = require('../controllers/cardsController');
const marketController = require('../controllers/marketController');
const authController = require('../controllers/authController');

// Routes pour les cartes
router.get('/cards', isAuthenticatedApi, cardsController.getUserCards);
router.get('/cards/:id', isAuthenticatedApi, cardsController.getCardDetails);

// Routes pour le marché
router.get('/market/cards', marketController.getMarketCards);
router.post('/market/buy', isAuthenticatedApi, marketController.buyCard);
router.post('/market/sell', isAuthenticatedApi, marketController.sellCard);

// Routes pour les fonctionnalités blockchain
router.post('/connect-wallet', authController.connectWallet);
router.get('/token-balance', isAuthenticatedApi, (req, res) => {
  // Simuler l'obtention du solde de tokens
  res.json({ balance: 1000, success: true });
});

module.exports = router;