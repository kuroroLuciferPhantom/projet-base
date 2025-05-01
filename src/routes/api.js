const express = require('express');
const router = express.Router();
const { isAuthenticatedApi } = require('../middleware/auth');

// Contrôleurs
const cardsController = require('../controllers/cardsController');
const marketController = require('../controllers/marketController');
const authController = require('../controllers/authController');
const boosterController = require('../controllers/boosterController');
const apiController = require('../controllers/apiController');

/**
 * Routes API organisées par ressources et versions
 * Format: /api/v1/[resource]
 */

// Version 1 de l'API
router.use('/v1', (() => {
  const v1Router = express.Router();

  // Documentation de l'API
  v1Router.get('/', (req, res) => {
    res.json({
      name: 'API de Jeu de Cartes NFT',
      version: 'v1',
      endpoints: {
        cards: '/api/v1/cards',
        market: '/api/v1/market',
        users: '/api/v1/users',
        boosters: '/api/v1/boosters',
        auth: '/api/v1/auth',
        stats: '/api/v1/stats'
      }
    });
  });

  // Routes pour les cartes
  v1Router.get('/cards', isAuthenticatedApi, apiController.getAllCards);
  v1Router.get('/cards/:id', isAuthenticatedApi, apiController.getCardById);
  v1Router.get('/users/me/cards', isAuthenticatedApi, cardsController.getUserCards);

  // Routes pour le marché
  v1Router.get('/market', apiController.getMarketListings);
  v1Router.post('/market/transactions', isAuthenticatedApi, apiController.createTransaction);
  v1Router.post('/market/buy', isAuthenticatedApi, marketController.buyCard);
  v1Router.post('/market/sell', isAuthenticatedApi, marketController.sellCard);

  // Routes pour les utilisateurs
  v1Router.get('/users/me', isAuthenticatedApi, apiController.getUserProfile);
  v1Router.put('/users/me', isAuthenticatedApi, apiController.updateUserProfile);
  v1Router.put('/users/me/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);

  // Routes pour l'authentification
  v1Router.get('/auth/wallet/nonce/:address', authController.getNonce);
  v1Router.post('/auth/wallet/connect', authController.connectWallet);

  // Routes pour les boosters
  v1Router.get('/boosters', isAuthenticatedApi, boosterController.getUserBoosters);
  v1Router.post('/boosters/open', isAuthenticatedApi, boosterController.openBooster);
  v1Router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
  v1Router.post('/boosters/first', isAuthenticatedApi, boosterController.getFirstBooster);

  // Statistiques globales
  v1Router.get('/stats', apiController.getStats);

  // Routes pour les fonctionnalités blockchain
  v1Router.get('/blockchain/token-balance', isAuthenticatedApi, (req, res) => {
    // Simuler l'obtention du solde de tokens
    res.json({ balance: 1000, success: true });
  });

  return v1Router;
})());

// Support pour la rétrocompatibilité des routes existantes
// Ces routes seront dépréciées dans les futures versions
router.get('/cards', isAuthenticatedApi, cardsController.getUserCards);
router.get('/cards/:id', isAuthenticatedApi, cardsController.getCardDetails);
router.get('/market/cards', marketController.getMarketCards);
router.post('/market/buy', isAuthenticatedApi, marketController.buyCard);
router.post('/market/sell', isAuthenticatedApi, marketController.sellCard);
router.get('/wallet/nonce/:address', authController.getNonce);
router.post('/wallet/connect', authController.connectWallet);
router.put('/user/:userId/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);
router.get('/boosters', isAuthenticatedApi, boosterController.getUserBoosters);
router.post('/boosters/open', isAuthenticatedApi, boosterController.openBooster);
router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
router.post('/boosters/first', isAuthenticatedApi, boosterController.getFirstBooster);
router.get('/token-balance', isAuthenticatedApi, (req, res) => {
  // Simuler l'obtention du solde de tokens
  res.json({ balance: 1000, success: true });
});

module.exports = router;