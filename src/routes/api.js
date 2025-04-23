const express = require('express');
const router = express.Router();
const { isAuthenticatedApi } = require('../middleware/auth');

// Contrôleurs
const cardsController = require('../controllers/cardsController');
const marketController = require('../controllers/marketController');
const authController = require('../controllers/authController');
const boosterController = require('../controllers/boosterController');

// Routes pour les cartes
router.get('/cards', isAuthenticatedApi, cardsController.getUserCards);
router.get('/cards/:id', isAuthenticatedApi, cardsController.getCardDetails);

// Routes pour le marché
router.get('/market/cards', marketController.getMarketCards);
router.post('/market/buy', isAuthenticatedApi, marketController.buyCard);
router.post('/market/sell', isAuthenticatedApi, marketController.sellCard);

// Routes pour l'authentification wallet
router.get('/wallet/nonce/:address', authController.getNonce);
router.post('/wallet/connect', authController.connectWallet);
router.put('/user/:userId/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);

// Routes pour les boosters
router.get('/boosters', isAuthenticatedApi, boosterController.getUserBoosters);
router.post('/boosters/open', isAuthenticatedApi, boosterController.openBooster);
router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
router.post('/boosters/first', isAuthenticatedApi, boosterController.getFirstBooster);

// Routes pour les fonctionnalités blockchain
router.get('/token-balance', isAuthenticatedApi, (req, res) => {
  // Simuler l'obtention du solde de tokens
  res.json({ balance: 1000, success: true });
});

module.exports = router;