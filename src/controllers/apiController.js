/**
 * Contrôleur principal pour les API REST
 * Permet de centraliser la logique de traitement des requêtes API
 */
const Card = require('../models/Card');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Utilitaire pour formater les réponses API
const formatApiResponse = (success, data = null, error = null) => {
  return {
    success,
    timestamp: new Date().toISOString(),
    data,
    error
  };
};

/**
 * Contrôleurs pour les cartes
 */
exports.getAllCards = async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    return res.status(200).json(formatApiResponse(true, { cards }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json(formatApiResponse(false, null, { message: "Carte non trouvée" }));
    }
    return res.status(200).json(formatApiResponse(true, { card }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Contrôleurs pour les utilisateurs
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Récupérer l'utilisateur sans le mot de passe
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json(formatApiResponse(false, null, { message: "Utilisateur non trouvé" }));
    }
    
    return res.status(200).json(formatApiResponse(true, { user }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    
    // Construire l'objet de mise à jour
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (avatar) updateFields.avatar = avatar;
    
    // Mettre à jour et récupérer l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    return res.status(200).json(formatApiResponse(true, { user }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Contrôleurs pour le marketplace et les transactions
 */
exports.getMarketListings = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtres
    const filter = { forSale: true };
    if (req.query.rarity) filter.rarity = req.query.rarity;
    if (req.query.type) filter.type = req.query.type;
    
    // Tri
    const sortBy = req.query.sortBy || 'price';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };
    
    // Requête paginée
    const cards = await PlayerCard.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('card', 'name image rarity type');
    
    // Total pour la pagination
    const total = await PlayerCard.countDocuments(filter);
    
    return res.status(200).json(formatApiResponse(true, { 
      cards,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: cards.length,
        totalItems: total
      }
    }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { cardId, price } = req.body;
    
    // Vérifier si la carte existe
    const card = await PlayerCard.findById(cardId);
    if (!card) {
      return res.status(404).json(formatApiResponse(false, null, { message: "Carte non trouvée" }));
    }
    
    // Vérifier si la carte est à vendre
    if (!card.forSale) {
      return res.status(400).json(formatApiResponse(false, null, { message: "Cette carte n'est pas à vendre" }));
    }
    
    // Vérifier si le prix correspond
    if (card.price !== price) {
      return res.status(400).json(formatApiResponse(false, null, { message: "Le prix ne correspond pas" }));
    }
    
    // Vérifier si l'utilisateur a assez de fonds
    const buyer = await User.findById(req.user.id);
    if (buyer.balance < price) {
      return res.status(400).json(formatApiResponse(false, null, { message: "Solde insuffisant" }));
    }
    
    // Créer la transaction
    const transaction = new Transaction({
      buyer: req.user.id,
      seller: card.owner,
      card: cardId,
      price,
      date: new Date()
    });
    
    // Sauvegarder la transaction
    await transaction.save();
    
    // Mettre à jour la carte (propriétaire et statut)
    card.owner = req.user.id;
    card.forSale = false;
    card.price = 0;
    await card.save();
    
    // Mettre à jour les soldes
    const seller = await User.findById(card.owner);
    buyer.balance -= price;
    seller.balance += price;
    
    await buyer.save();
    await seller.save();
    
    return res.status(201).json(formatApiResponse(true, { transaction }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Statistiques générales
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCards = await Card.countDocuments();
    const totalPlayerCards = await PlayerCard.countDocuments();
    const cardsForSale = await PlayerCard.countDocuments({ forSale: true });
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .populate({
        path: 'card',
        populate: {
          path: 'card',
          select: 'name image'
        }
      });
    
    return res.status(200).json(formatApiResponse(true, {
      stats: {
        totalUsers,
        totalCards,
        totalPlayerCards,
        cardsForSale,
        recentTransactions
      }
    }));
  } catch (error) {
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};
