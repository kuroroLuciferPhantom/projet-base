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
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');

// Contrôleurs
const cardsController = require('../controllers/cardsController');
const marketController = require('../controllers/marketController');
const authController = require('../controllers/authController');
const boosterController = require('../controllers/boosterController');
const apiController = require('../controllers/apiController');

// Utilitaires
const TestCardGenerator = require('../utils/testCardGenerator');

// Import du script d'initialisation
const { initializeDemoCards, demoCards } = require('../initDatabase');

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
        blockchain: '/api/v1/blockchain',
        admin: '/api/v1/admin'
      }
    });
  });

  // Routes pour les cartes - avec cache pour les requêtes GET
  v1Router.get('/cards', isAuthenticatedApi, cacheService.middleware(300), apiController.getAllCards);
  v1Router.get('/cards/:id', isAuthenticatedApi, cacheService.middleware(300), apiController.getCardById);
  
  // Routes pour les cartes de l'utilisateur
  v1Router.get('/users/me/cards', isAuthenticatedApi, cacheService.middleware(60), cardsController.getUserCards);
  v1Router.get('/users/me/cards/stats', isAuthenticatedApi, cacheService.middleware(120), cardsController.getUserCollectionStats);
  v1Router.put('/users/me/cards/:id/sale', isAuthenticatedApi, cardsController.updateCardSaleStatus);

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
  v1Router.get('/boosters/config', cacheService.middleware(300), boosterController.getBoosterConfig);
  v1Router.post('/boosters/open', isAuthenticatedApi, validateOpenBooster, boosterController.openBooster);
  v1Router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
  v1Router.post('/boosters/buy-and-open', isAuthenticatedApi, boosterController.buyAndOpenBooster);
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

  // Routes d'administration
  
  // Route pour initialiser les cartes de démonstration
  v1Router.post('/admin/init-cards', isAuthenticatedApi, async (req, res) => {
    try {
      console.log('🎮 Initialisation des cartes de démonstration via API...');
      
      // Vérifier si des cartes existent déjà
      const existingCardsCount = await GameCard.countDocuments();
      
      if (existingCardsCount > 0) {
        console.log(`📦 ${existingCardsCount} cartes déjà présentes. Suppression...`);
        await GameCard.deleteMany({});
      }
      
      // Insérer les cartes de démonstration
      const insertedCards = await GameCard.insertMany(demoCards);
      
      // Mettre à jour l'utilisateur actuel avec des récompenses
      const user = await User.findById(req.user.id);
      if (user) {
        if (user.tokenBalance < 500) {
          user.tokenBalance = 500;
        }
        const totalBoosters = user.boosters.common + user.boosters.rare + user.boosters.epic + user.boosters.legendary;
        if (totalBoosters === 0) {
          user.boosters.common = 2;
        }
        await user.save();
      }
      
      // Vider le cache
      cacheService.clear();
      
      console.log(`✅ ${insertedCards.length} cartes créées avec succès !`);
      
      res.json({
        success: true,
        message: `${insertedCards.length} cartes de démonstration créées avec succès !`,
        cards: insertedCards.length,
        userUpdated: !!user,
        summary: {
          common: demoCards.filter(c => c.rarity === 'common').length,
          rare: demoCards.filter(c => c.rarity === 'rare').length,
          epic: demoCards.filter(c => c.rarity === 'epic').length,
          legendary: demoCards.filter(c => c.rarity === 'legendary').length
        }
      });
      
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation des cartes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'initialisation des cartes",
        error: error.message
      });
    }
  });

  // Route pour donner un starter pack à l'utilisateur actuel
  v1Router.post('/admin/give-starter-pack', isAuthenticatedApi, async (req, res) => {
    try {
      console.log(`🎁 Attribution du starter pack à l'utilisateur ${req.user.id}...`);
      
      const newCards = await TestCardGenerator.giveStarterPack(req.user.id);
      const stats = await TestCardGenerator.getUserCardStats(req.user.id);
      
      // Vider le cache pour forcer le rafraîchissement
      cacheService.clear();
      
      res.json({
        success: true,
        message: `Starter pack attribué avec succès !`,
        newCards: newCards.length,
        totalCards: stats.totalCards,
        rarityStats: stats.rarityStats
      });
      
    } catch (error) {
      console.error("❌ Erreur lors de l'attribution du starter pack:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'attribution du starter pack",
        error: error.message
      });
    }
  });

  // Route pour donner des cartes aléatoires à l'utilisateur actuel
  v1Router.post('/admin/give-random-cards', isAuthenticatedApi, async (req, res) => {
    try {
      const { count = 5 } = req.body;
      console.log(`🎲 Attribution de ${count} cartes aléatoires à l'utilisateur ${req.user.id}...`);
      
      const newCards = await TestCardGenerator.giveRandomCards(req.user.id, count);
      const stats = await TestCardGenerator.getUserCardStats(req.user.id);
      
      // Vider le cache pour forcer le rafraîchissement
      cacheService.clear();
      
      res.json({
        success: true,
        message: `${newCards.length} cartes attribuées avec succès !`,
        newCards: newCards.length,
        totalCards: stats.totalCards,
        rarityStats: stats.rarityStats
      });
      
    } catch (error) {
      console.error("❌ Erreur lors de l'attribution des cartes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'attribution des cartes",
        error: error.message
      });
    }
  });

  // Route pour vérifier l'état de la base de données
  v1Router.get('/admin/db-status', isAuthenticatedApi, async (req, res) => {
    try {
      const gameCardCount = await GameCard.countDocuments();
      const userCount = await User.countDocuments();
      const playerCardCount = await PlayerCard.countDocuments();
      
      // Statistiques des GameCards
      const gameCardsByRarity = await GameCard.aggregate([
        { $group: { _id: '$rarity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      // Statistiques des PlayerCards pour l'utilisateur actuel
      // Statistiques des PlayerCards pour l'utilisateur actuel
      const userPlayerCards = await PlayerCard.countDocuments({ owner: req.user.id });
      const userCardsByRarity = await PlayerCard.aggregate([
        { $match: { owner: req.user.id } },
        {
          $lookup: {
            from: 'gamecards',
            localField: 'gameCard',
            foreignField: '_id',
            as: 'gameCard'
          }
        },
        { $unwind: '$gameCard' },
        { $group: { _id: '$gameCard.rarity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        success: true,
        stats: {
          gameCards: gameCardCount,
          playerCards: playerCardCount,
          users: userCount,
          gameCardsByRarity: gameCardsByRarity.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          userCards: userPlayerCards,
          userCardsByRarity: userCardsByRarity.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          needsGameCardsInit: gameCardCount === 0,
          userNeedsCards: userPlayerCards === 0
        }
      });
      
    } catch (error) {
      console.error('Erreur lors de la vérification du statut DB:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut de la base de données'
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
router.get('/cards/stats', isAuthenticatedApi, cacheService.middleware(120), cardsController.getUserCollectionStats);
router.get('/market/cards', validateMarketSearch, cacheService.middleware(60), marketController.getMarketCards);
router.post('/market/buy', isAuthenticatedApi, validateBuyCard, marketController.buyCard);
router.post('/market/sell', isAuthenticatedApi, validateSellCard, marketController.sellCard);
router.get('/wallet/nonce/:address', authController.getNonce);
router.post('/wallet/connect', authController.connectWallet);
router.put('/user/:userId/tutorial', isAuthenticatedApi, authController.updateTutorialStatus);
router.get('/boosters', isAuthenticatedApi, cacheService.middleware(120), boosterController.getUserBoosters);
router.get('/boosters/config', cacheService.middleware(300), boosterController.getBoosterConfig);
router.post('/boosters/open', isAuthenticatedApi, validateOpenBooster, boosterController.openBooster);
router.post('/boosters/buy', isAuthenticatedApi, boosterController.buyBooster);
router.post('/boosters/buy-and-open', isAuthenticatedApi, boosterController.buyAndOpenBooster);
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