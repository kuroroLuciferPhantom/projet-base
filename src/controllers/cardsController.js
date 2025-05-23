const Card = require('../models/Card');
const User = require('../models/User');

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
    
    // Construire les filtres
    const filters = { owner: userId };
    
    if (rarity && rarity !== 'all') {
      filters.rarity = rarity;
    }
    
    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }
    
    // Options de tri
    const sortOptions = {};
    if (sort === 'name') {
      sortOptions.name = order === 'desc' ? -1 : 1;
    } else if (sort === 'rarity') {
      // Tri par rareté avec ordre personnalisé
      const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
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
    
    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les cartes avec filtres, tri et pagination
    const cards = await Card.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Compter le total pour la pagination
    const total = await Card.countDocuments(filters);
    const totalPages = Math.ceil(total / parseInt(limit));
    
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
    
    // Récupérer les détails de la carte depuis la base de données
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (card.owner.toString() !== req.user.id && !card.isPublic) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas autorisé à voir cette carte' 
      });
    }
    
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
    const user = await User.findById(userId).select('level experience cards');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Compter les cartes par rareté
    const cardStats = await Card.aggregate([
      { $match: { owner: userId } },
      { 
        $group: { 
          _id: '$rarity', 
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Compter le total de cartes
    const totalCards = await Card.countDocuments({ owner: userId });
    
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
    const card = await Card.findOne({ _id: cardId, owner: userId });
    
    if (!card) {
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
    card.isForSale = isForSale;
    card.price = isForSale ? price : 0;
    await card.save();
    
    res.status(200).json({
      success: true,
      message: isForSale ? 'Carte mise en vente' : 'Carte retirée de la vente',
      card
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la carte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la carte'
    });
  }
};