const express = require('express');
const router = express.Router();
const { isAuthenticatedApi } = require('../middleware/auth');
const { 
  validateMarketSearch, 
  validateSellCard, 
  validateBuyCard, 
  validateOpenBooster, 
  validateUpdateProfile,
  validateBuyBoosterAndMintNFTs,
  validateSyncNFTs
} = require('../middleware/validate');
const cacheService = require('../utils/cache');

// Modèles
const User = require('../models/User');

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
        stats: '/api/v1/stats',
        blockchain: '/api/v1/blockchain'
      }
    });
  });

  // Routes pour les cartes - avec cache pour les requêtes GET
  v1Router.get('/cards', isAuthenticatedApi, cacheService.middleware(300), apiController.getAllCards);
  v1Router.get('/cards/:id', isAuthenticatedApi, cacheService.middleware(300), apiController.getCardById);
  v1Router.get('/users/me/cards', isAuthenticatedApi, cacheService.middleware(60), cardsController.getUserCards);

  // Routes pour le marché avec validation et cache pour les requêtes GET
  v1Router.get('/market', validateMarketSearch, cacheService.middleware(60), apiController.getMarketListings);
  v1Router.post('/market/transactions', isAuthenticatedApi, validateBuyCard, apiController.createTransaction);
  v1Router.post('/market/buy', isAuthenticatedApi, validateBuyCard, marketController.buyCard);
  v1Router.post('/market/sell', isAuthenticatedApi, validateSellCard, marketController.sellCard);

  // Routes pour les utilisateurs avec validation
  v1Router.get('/users/me', isAuthenticatedApi, apiController.getUserProfile);
  v1Router.put('/users/me', isAuthenticatedApi, validateUpdateProfile, apiController.updateUserProfile);
  v1Router.put('/users/me/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);

  // Route spécifique pour récupérer le solde de tokens
  v1Router.get('/users/me/token-balance', isAuthenticatedApi, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('tokenBalance');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        tokenBalance: user.tokenBalance || 0
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du solde de tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du solde de tokens'
      });
    }
  });

  // Routes pour l'authentification
  v1Router.get('/auth/wallet/nonce/:address', authController.getNonce);
  v1Router.post('/auth/wallet/connect', authController.connectWallet);

  // Routes pour les boosters avec validation
  v1Router.get('/boosters', isAuthenticatedApi, cacheService.middleware(120), boosterController.getUserBoosters);
  v1Router.post('/boosters/open', isAuthenticatedApi, validateOpenBooster, boosterController.openBooster);
  v1Router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
  v1Router.post('/boosters/first', isAuthenticatedApi, boosterController.getFirstBooster);
  
  // Nouvelles routes pour l'intégration blockchain
  v1Router.post('/boosters/buy-and-mint', isAuthenticatedApi, validateBuyBoosterAndMintNFTs, boosterController.buyBoosterAndMintNFTs);
  v1Router.post('/blockchain/sync-nfts', isAuthenticatedApi, validateSyncNFTs, boosterController.syncNFTsWithBackend);

  // Statistiques globales avec cache
  v1Router.get('/stats', cacheService.middleware(300), apiController.getStats);

  // Routes pour les fonctionnalités blockchain
  v1Router.get('/blockchain/token-balance', isAuthenticatedApi, cacheService.middleware(120), async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('tokenBalance');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        balance: user.tokenBalance || 0
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du solde blockchain:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du solde blockchain'
      });
    }
  });

  // Route pour vider le cache (réservée aux administrateurs)
  v1Router.post('/admin/cache/clear', isAuthenticatedApi, (req, res) => {
    // Ici, vous devriez vérifier si l'utilisateur est un administrateur
    // Pour l'instant, nous permettons à tout utilisateur authentifié de vider le cache
    cacheService.clear();
    res.json({ 
      success: true, 
      message: 'Cache vidé avec succès',
      stats: cacheService.getStats()
    });
  });

  // Route pour obtenir les statistiques du cache
  v1Router.get('/admin/cache/stats', isAuthenticatedApi, (req, res) => {
    res.json({
      success: true,
      stats: cacheService.getStats()
    });
  });

  return v1Router;
})());

// Support pour la rétrocompatibilité des routes existantes
// Ces routes seront dépréciées dans les futures versions
router.get('/cards', isAuthenticatedApi, cacheService.middleware(300), cardsController.getUserCards);
router.get('/cards/:id', isAuthenticatedApi, cacheService.middleware(300), cardsController.getCardDetails);
router.get('/market/cards', validateMarketSearch, cacheService.middleware(60), marketController.getMarketCards);
router.post('/market/buy', isAuthenticatedApi, validateBuyCard, marketController.buyCard);
router.post('/market/sell', isAuthenticatedApi, validateSellCard, marketController.sellCard);
router.get('/wallet/nonce/:address', authController.getNonce);
router.post('/wallet/connect', authController.connectWallet);
router.put('/user/:userId/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);
router.get('/boosters', isAuthenticatedApi, cacheService.middleware(120), boosterController.getUserBoosters);
router.post('/boosters/open', isAuthenticatedApi, validateOpenBooster, boosterController.openBooster);
router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
router.post('/boosters/first', isAuthenticatedApi, boosterController.getFirstBooster);
router.post('/boosters/buy-and-mint', isAuthenticatedApi, validateBuyBoosterAndMintNFTs, boosterController.buyBoosterAndMintNFTs);
router.post('/blockchain/sync-nfts', isAuthenticatedApi, validateSyncNFTs, boosterController.syncNFTsWithBackend);
router.get('/token-balance', isAuthenticatedApi, cacheService.middleware(120), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('tokenBalance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      balance: user.tokenBalance || 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde'
    });
  }
});

module.exports = router;