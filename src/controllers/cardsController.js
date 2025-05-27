const PlayerCard = require('../models/PlayerCard');
const GameCard = require('../models/GameCard');
const User = require('../models/User');
const mongoose = require('mongoose');

// Obtenir les cartes de l'utilisateur avec filtres, tri et pagination
exports.getUserCards = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Paramètres de requête pour les filtres et la pagination
    const {
      page = 1,
      limit = 16,
      rarity,
      sort = 'name',
      order = 'asc',
      search
    } = req.query;
    
    // Construire le pipeline d'agrégation pour PlayerCard
    const pipeline = [
      // Étape 1: Filtrer par propriétaire
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      
      // Étape 2: Joindre avec GameCard
      {
        $lookup: {
          from: 'gamecards',
          localField: 'gameCard',
          foreignField: '_id',
          as: 'gameCard'
        }
      },
      
      // Étape 3: Dérouler le tableau gameCard
      { $unwind: '$gameCard' },
      
      // Étape 4: Appliquer les filtres
      ...(rarity && rarity !== 'all' ? [{ $match: { 'gameCard.rarity': rarity } }] : []),
      ...(search ? [{ $match: { 'gameCard.name': { $regex: search, $options: 'i' } } }] : []),
      
      // Étape 5: Projeter les champs nécessaires
      {
        $project: {
          _id: 1,
          owner: 1,
          level: 1,
          experience: 1,
          isForSale: 1,
          price: 1,
          acquiredAt: 1,
          enhancedStats: 1,
          tokenId: 1,
          // Champs de GameCard
          name: '$gameCard.name',
          description: '$gameCard.description',
          rarity: '$gameCard.rarity',
          imageUrl: '$gameCard.imageUrl',
          stats: {
            attack: { $add: ['$gameCard.stats.attack', { $ifNull: ['$enhancedStats.attack', 0] }] },
            defense: { $add: ['$gameCard.stats.defense', { $ifNull: ['$enhancedStats.defense', 0] }] },
            magic: { $add: ['$gameCard.stats.magic', { $ifNull: ['$enhancedStats.magic', 0] }] },
            speed: { $add: ['$gameCard.stats.speed', { $ifNull: ['$enhancedStats.speed', 0] }] }
          },
          baseStats: '$gameCard.stats',
          createdAt: '$acquiredAt',
          isPublic: { $literal: true } // Compatibilité avec l'ancien modèle
        }
      }
    ];
    
    // Ajouter le tri
    const sortOptions = {};
    if (sort === 'name') {
      sortOptions.name = order === 'desc' ? -1 : 1;
    } else if (sort === 'rarity') {
      // Ordre de rareté personnalisé
      sortOptions.rarity = order === 'desc' ? -1 : 1;
    } else if (sort === 'attack') {
      sortOptions['stats.attack'] = order === 'desc' ? -1 : 1;
    } else if (sort === 'defense') {
      sortOptions['stats.defense'] = order === 'desc' ? -1 : 1;
    } else if (sort === 'createdAt') {
      sortOptions.createdAt = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.name = 1; // Tri par défaut
    }
    
    pipeline.push({ $sort: sortOptions });
    
    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Pipeline pour compter le total
    const countPipeline = [
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'gamecards',
          localField: 'gameCard',
          foreignField: '_id',
          as: 'gameCard'
        }
      },
      { $unwind: '$gameCard' },
      ...(rarity && rarity !== 'all' ? [{ $match: { 'gameCard.rarity': rarity } }] : []),
      ...(search ? [{ $match: { 'gameCard.name': { $regex: search, $options: 'i' } } }] : []),
      { $count: 'total' }
    ];
    
    // Exécuter les deux pipelines en parallèle
    const [totalResult, cards] = await Promise.all([
      PlayerCard.aggregate(countPipeline),
      PlayerCard.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: parseInt(limit) }
      ])
    ]);
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    console.log(`🎴 Cartes trouvées pour l'utilisateur ${userId}: ${cards.length}/${total}`);
    
    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      cards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des cartes' 
    });
  }
};

// Obtenir les détails d'une carte
exports.getCardDetails = async (req, res) => {
  try {
    const cardId = req.params.id;
    
    // Récupérer les détails de la carte depuis PlayerCard avec GameCard
    const playerCard = await PlayerCard.findById(cardId).populate('gameCard');
    
    if (!playerCard || !playerCard.gameCard) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (playerCard.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas autorisé à voir cette carte' 
      });
    }
    
    // Construire la réponse avec les statistiques totales
    const card = {
      _id: playerCard._id,
      name: playerCard.gameCard.name,
      description: playerCard.gameCard.description,
      rarity: playerCard.gameCard.rarity,
      imageUrl: playerCard.gameCard.imageUrl,
      tokenId: playerCard.tokenId,
      owner: playerCard.owner,
      level: playerCard.level,
      experience: playerCard.experience,
      isForSale: playerCard.isForSale,
      price: playerCard.price,
      stats: {
        attack: playerCard.gameCard.stats.attack + (playerCard.enhancedStats?.attack || 0),
        defense: playerCard.gameCard.stats.defense + (playerCard.enhancedStats?.defense || 0),
        magic: playerCard.gameCard.stats.magic + (playerCard.enhancedStats?.magic || 0),
        speed: playerCard.gameCard.stats.speed + (playerCard.enhancedStats?.speed || 0)
      },
      baseStats: playerCard.gameCard.stats,
      enhancedStats: playerCard.enhancedStats,
      createdAt: playerCard.acquiredAt,
      isPublic: true
    };
    
    res.status(200).json({
      success: true,
      card
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des détails de la carte' 
    });
  }
};

// Obtenir les statistiques de collection de l'utilisateur
exports.getUserCollectionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur avec ses statistiques
    const user = await User.findById(userId).select('level experience');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Compter les cartes par rareté en utilisant PlayerCard
    const cardStats = await PlayerCard.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'gamecards',
          localField: 'gameCard',
          foreignField: '_id',
          as: 'gameCard'
        }
      },
      { $unwind: '$gameCard' },
      { 
        $group: { 
          _id: '$gameCard.rarity', 
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Compter le total de cartes
    const totalCards = await PlayerCard.countDocuments({ owner: userId });
    
    // Statistiques par rareté (avec valeurs par défaut)
    const rarityStats = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    cardStats.forEach(stat => {
      if (stat._id && rarityStats.hasOwnProperty(stat._id)) {
        rarityStats[stat._id] = stat.count;
      }
    });
    
    // TODO: Récupérer les vraies statistiques de combat depuis GameStats
    // Pour l'instant, on utilise des valeurs par défaut
    const gameStats = {
      wins: 0,
      losses: 0,
      winRate: 0,
      currentRank: 'Bronze #0'
    };
    
    console.log(`📊 Statistiques pour l'utilisateur ${userId}: ${totalCards} cartes total`);
    
    res.status(200).json({
      success: true,
      stats: {
        totalCards,
        rarityStats,
        gameStats,
        level: user.level || 1,
        experience: user.experience || 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Mettre à jour le statut de vente d'une carte
exports.updateCardSaleStatus = async (req, res) => {
  try {
    const cardId = req.params.id;
    const { isForSale, price } = req.body;
    const userId = req.user.id;
    
    // Vérifier que la carte appartient à l'utilisateur
    const playerCard = await PlayerCard.findOne({ _id: cardId, owner: userId });
    
    if (!playerCard) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée ou vous n\'êtes pas le propriétaire'
      });
    }
    
    // Valider le prix si la carte est mise en vente
    if (isForSale && (!price || price <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Le prix doit être supérieur à 0 pour mettre une carte en vente'
      });
    }
    
    // Mettre à jour la carte
    playerCard.isForSale = isForSale;
    playerCard.price = isForSale ? price : 0;
    await playerCard.save();
    
    // Populate les données GameCard pour la réponse
    await playerCard.populate('gameCard');
    
    const responseCard = {
      _id: playerCard._id,
      name: playerCard.gameCard.name,
      description: playerCard.gameCard.description,
      rarity: playerCard.gameCard.rarity,
      imageUrl: playerCard.gameCard.imageUrl,
      isForSale: playerCard.isForSale,
      price: playerCard.price,
      stats: {
        attack: playerCard.gameCard.stats.attack + (playerCard.enhancedStats?.attack || 0),
        defense: playerCard.gameCard.stats.defense + (playerCard.enhancedStats?.defense || 0),
        magic: playerCard.gameCard.stats.magic + (playerCard.enhancedStats?.magic || 0),
        speed: playerCard.gameCard.stats.speed + (playerCard.enhancedStats?.speed || 0)
      }
    };
    
    res.status(200).json({
      success: true,
      message: isForSale ? 'Carte mise en vente' : 'Carte retirée de la vente',
      card: responseCard
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la carte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la carte'
    });
  }
};