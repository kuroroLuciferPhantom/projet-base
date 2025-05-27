const PlayerCard = require('../models/PlayerCard');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Obtenir les cartes disponibles sur le marché avec filtres et recherche
exports.getMarketCards = async (req, res) => {
  try {
    // Récupérer les paramètres de requête pour filtrage et recherche
    const { 
      search, 
      rarity, 
      minPrice, 
      maxPrice, 
      sort = 'price_asc', 
      page = 1, 
      limit = 12 
    } = req.query;
    
    // Construire le filtre de base
    const filter = { isForSale: true };
    
    // Ajouter des filtres supplémentaires si spécifiés
    if (search) {
      filter.name = { $regex: search, $options: 'i' }; // Recherche insensible à la casse
    }
    
    if (rarity) {
      filter.rarity = rarity;
    }
    
    // Filtre de prix
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Déterminer le tri
    let sortOption = {};
    switch (sort) {
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'rarity':
        // Tri personnalisé par rareté (legendary > epic > rare > common)
        sortOption = { 
          rarity: -1, // En supposant que les raretés sont stockées dans un ordre numérique
          price: 1 
        };
        break;
      default: // price_asc par défaut
        sortOption = { price: 1 };
    }
    
    // Calcul pour la pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Récupérer les cartes avec pagination
    const marketCards = await PlayerCard.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'username');
    
    // Compter le total de cartes pour la pagination
    const total = await PlayerCard.countDocuments(filter);
    
    // Format de la réponse API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(200).json({
        success: true,
        count: marketCards.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        cards: marketCards
      });
    }
    
    // Format de la réponse pour le rendu de la vue
    res.render('marketplace/index', {
      title: 'EpicFactionCommunity - Marketplace',
      marketCards,
      filters: { search, rarity, minPrice, maxPrice, sort },
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      },
      user: req.user || null,
      pageCss: 'marketplace',
      cssFiles: ['card', 'marketplace'],
      pageJs: 'marketplace'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes du marché:', error);
    
    // Format de la réponse d'erreur API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des cartes du marché' 
      });
    }
    
    // Format de la réponse d'erreur pour le rendu de la vue
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des cartes du marché',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtenir les dernières cartes mises en vente (pour l'aperçu dans l'app)
exports.getLatestCards = async (req, res) => {
  try {
    // Récupérer les 4 dernières cartes mises en vente
    const latestCards = await Card.find({ isForSale: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('owner', 'username');
    
    return res.status(200).json({
      success: true,
      count: latestCards.length,
      cards: latestCards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des dernières cartes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des dernières cartes' 
    });
  }
};

// Obtenir les détails d'une carte sur le marché
exports.getMarketCardDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la carte avec les informations du propriétaire
    const card = await PlayerCard.findById(id).populate('owner', 'username walletAddress');
    
    if (!card) {
      if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
        return res.status(404).json({ 
          success: false, 
          message: 'Carte non trouvée' 
        });
      }
      
      return res.status(404).render('error', {
        message: 'Carte non trouvée',
        error: { status: 404 }
      });
    }
    
    // Récupérer l'historique des transactions pour cette carte
    const transactions = await Transaction.find({ card: id })
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .sort({ timestamp: -1 });
    
    // Format de la réponse API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(200).json({
        success: true,
        card,
        transactions,
        isOwner: req.user ? req.user.id === card.owner._id.toString() : false
      });
    }
    
    // Format de la réponse pour le rendu de la vue
    res.render('marketplace/details', {
      title: `EpicFactionCommunity - ${card.name}`,
      card,
      transactions,
      user: req.user || null,
      isOwner: req.user ? req.user.id === card.owner._id.toString() : false,
      pageCss: 'marketplace',
      cssFiles: ['card', 'marketplace'],
      pageJs: 'marketplace'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la carte:', error);
    
    // Format de la réponse d'erreur API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des détails de la carte' 
      });
    }
    
    // Format de la réponse d'erreur pour le rendu de la vue
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des détails de la carte',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtenir mes cartes mises en vente
exports.getMyListings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Récupérer les cartes de l'utilisateur qui sont en vente
    const myListings = await Card.find({ 
      owner: req.user.id, 
      isForSale: true 
    }).populate('owner', 'username');

    return res.status(200).json({
      success: true,
      count: myListings.length,
      cards: myListings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de vos cartes en vente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos cartes en vente'
    });
  }
};

// Acheter une carte
exports.buyCard = async (req, res) => {
  try {
    const { cardId } = req.body;
    const buyerId = req.user.id;
    
    // Récupérer la carte
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si la carte est en vente
    if (!card.isForSale) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cette carte n\'est pas en vente' 
      });
    }
    
    // Récupérer l'acheteur pour vérifier les fonds
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier si l'acheteur a assez de tokens
    if (buyer.balance < card.price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Solde insuffisant pour effectuer cet achat' 
      });
    }
    
    // Récupérer le vendeur
    const sellerId = card.owner;
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendeur non trouvé' 
      });
    }
    
    // Mettre à jour les soldes
    buyer.balance -= card.price;
    seller.balance += card.price;
    
    // Mettre à jour le propriétaire de la carte
    card.owner = buyerId;
    card.isForSale = false;
    
    // Sauvegarder les modifications
    await Promise.all([
      buyer.save(),
      seller.save(),
      card.save()
    ]);
    
    // Enregistrer la transaction
    const transaction = new Transaction({
      card: cardId,
      seller: sellerId,
      buyer: buyerId,
      price: card.price,
      timestamp: Date.now()
    });
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: 'Carte achetée avec succès',
      card,
      newBalance: buyer.balance
    });
  } catch (error) {
    console.error('Erreur lors de l\'achat de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'achat de la carte' 
    });
  }
};

// Mettre une carte en vente
exports.sellCard = async (req, res) => {
  try {
    const { cardId, price } = req.body;
    const sellerId = req.user.id;
    
    // Valider le prix
    if (!price || price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le prix doit être supérieur à 0' 
      });
    }
    
    // Récupérer la carte
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (card.owner.toString() !== sellerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas le propriétaire de cette carte' 
      });
    }
    
    // Mettre la carte en vente
    card.isForSale = true;
    card.price = price;
    await card.save();
    
    res.status(200).json({
      success: true,
      message: 'Carte mise en vente avec succès',
      card
    });
  } catch (error) {
    console.error('Erreur lors de la mise en vente de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise en vente de la carte' 
    });
  }
};

// Retirer une carte du marché
exports.removeFromMarket = async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;
    
    // Récupérer la carte
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (card.owner.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas le propriétaire de cette carte' 
      });
    }
    
    // Retirer la carte du marché
    card.isForSale = false;
    await card.save();
    
    res.status(200).json({
      success: true,
      message: 'Carte retirée du marché avec succès',
      card
    });
  } catch (error) {
    console.error('Erreur lors du retrait de la carte du marché:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du retrait de la carte du marché' 
    });
  }
};

// Obtenir l'historique des transactions du marché
exports.getMarketHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Récupérer les transactions récentes
    const transactions = await Transaction.find()
      .populate('card', 'name imageUrl rarity')
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Compter le total de transactions
    const total = await Transaction.countDocuments();
    
    // Format de la réponse API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(200).json({
        success: true,
        count: transactions.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        transactions
      });
    }
    
    // Format de la réponse pour le rendu de la vue
    res.render('marketplace/history', {
      title: 'EpicFactionCommunity - Historique des transactions',
      transactions,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      },
      user: req.user || null,
      pageCss: 'marketplace',
      cssFiles: ['card', 'marketplace'],
      pageJs: 'marketplace'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique du marché:', error);
    
    // Format de la réponse d'erreur API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de l\'historique du marché' 
      });
    }
    
    // Format de la réponse d'erreur pour le rendu de la vue
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération de l\'historique du marché',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtenir des statistiques du marché
exports.getMarketStats = async (req, res) => {
  try {
    // Nombre total de cartes en vente
    const totalListings = await Card.countDocuments({ isForSale: true });
    
    // Prix moyen des cartes en vente
    const priceAggregation = await Card.aggregate([
      { $match: { isForSale: true } },
      { $group: {
          _id: null,
          averagePrice: { $avg: "$price" },
          lowestPrice: { $min: "$price" },
          highestPrice: { $max: "$price" }
        }
      }
    ]);
    
    // Répartition par rareté
    const rarityDistribution = await Card.aggregate([
      { $match: { isForSale: true } },
      { $group: {
          _id: "$rarity",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Transactions des dernières 24h
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransactions = await Transaction.countDocuments({ timestamp: { $gte: last24Hours } });
    
    // Volume des transactions des dernières 24h
    const volumeAggregation = await Transaction.aggregate([
      { $match: { timestamp: { $gte: last24Hours } } },
      { $group: {
          _id: null,
          totalVolume: { $sum: "$price" }
        }
      }
    ]);
    
    // Préparer les données de statistiques
    const stats = {
      totalListings,
      averagePrice: priceAggregation.length > 0 ? priceAggregation[0].averagePrice.toFixed(2) : 0,
      lowestPrice: priceAggregation.length > 0 ? priceAggregation[0].lowestPrice : 0,
      highestPrice: priceAggregation.length > 0 ? priceAggregation[0].highestPrice : 0,
      rarityDistribution,
      recentTransactions,
      recentVolume: volumeAggregation.length > 0 ? volumeAggregation[0].totalVolume.toFixed(2) : 0
    };
    
    // Format de la réponse API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(200).json({
        success: true,
        stats
      });
    }
    
    // Format de la réponse pour le rendu de la vue
    res.render('marketplace/stats', {
      title: 'EpicFactionCommunity - Statistiques du marché',
      stats,
      user: req.user || null,
      pageCss: 'marketplace',
      cssFiles: ['card', 'marketplace'],
      pageJs: 'marketplace'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du marché:', error);
    
    // Format de la réponse d'erreur API
    if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl.includes('/api'))) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des statistiques du marché' 
      });
    }
    
    // Format de la réponse d'erreur pour le rendu de la vue
    res.status(500).render('error', {
      message: 'Erreur lors de la récupération des statistiques du marché',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};
