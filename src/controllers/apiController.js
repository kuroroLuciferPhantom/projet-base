/**
 * Contrôleur principal pour les API REST
 * Permet de centraliser la logique de traitement des requêtes API
 */
const Card = require('../models/Card');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

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

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Récupère toutes les cartes du jeu
 *     description: Renvoie la liste des cartes disponibles dans le jeu triées par date de création
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre maximum de cartes à retourner
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, uncommon, rare, epic, legendary]
 *         description: Filtrer par rareté de carte
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de carte
 *     responses:
 *       200:
 *         description: Liste des cartes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     cards:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Card'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         pages:
 *                           type: integer
 *                           example: 5
 *                         current:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.getAllCards = async (req, res) => {
  try {
    const { page = 1, limit = 20, rarity, type } = req.query;
    const skip = (page - 1) * limit;
    
    // Construire les filtres
    const filter = {};
    if (rarity) filter.rarity = rarity;
    if (type) filter.type = type;
    
    // Requête avec pagination
    const cards = await Card.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Compter le total pour la pagination
    const total = await Card.countDocuments(filter);
    
    return res.status(200).json(formatApiResponse(true, { 
      cards,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page),
        limit: parseInt(limit)
      }
    }));
  } catch (error) {
    logger.logError(error);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Récupère une carte par son ID
 *     description: Renvoie les détails d'une carte spécifique
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la carte à récupérer
 *     responses:
 *       200:
 *         description: Détails de la carte récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     card:
 *                       $ref: '#/components/schemas/Card'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json(formatApiResponse(false, null, { message: "Carte non trouvée" }));
    }
    return res.status(200).json(formatApiResponse(true, { card }));
  } catch (error) {
    logger.logError(error);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Contrôleurs pour les utilisateurs
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Récupère le profil de l'utilisateur connecté
 *     description: Renvoie les informations du profil de l'utilisateur authentifié
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
    logger.logError(error);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Met à jour le profil de l'utilisateur
 *     description: Permet à l'utilisateur de mettre à jour son profil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: newUsername
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
    
    logger.logUserAction(req.user.id, 'profile_update', { fields: Object.keys(updateFields) });
    
    return res.status(200).json(formatApiResponse(true, { user }));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Contrôleurs pour le marketplace et les transactions
 */

/**
 * @swagger
 * /market:
 *   get:
 *     summary: Récupère les cartes disponibles sur le marché
 *     description: Renvoie la liste des cartes à vendre sur le marché avec options de filtrage et pagination
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, uncommon, rare, epic, legendary]
 *         description: Filtrer par rareté
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de carte
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, createdAt]
 *           default: price
 *         description: Champ par lequel trier les résultats
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordre de tri (ascendant ou descendant)
 *     responses:
 *       200:
 *         description: Liste des cartes du marché récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     cards:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlayerCard'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                           example: 1
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         count:
 *                           type: integer
 *                           example: 10
 *                         totalItems:
 *                           type: integer
 *                           example: 42
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
    logger.logError(error, req);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * @swagger
 * /market/transactions:
 *   post:
 *     summary: Crée une nouvelle transaction
 *     description: Permet à un utilisateur d'acheter une carte sur le marché
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardId
 *               - price
 *             properties:
 *               cardId:
 *                 type: string
 *                 description: ID de la carte à acheter
 *               price:
 *                 type: number
 *                 description: Prix de la carte
 *     responses:
 *       201:
 *         description: Transaction créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Paramètres invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notForSale:
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Cette carte n'est pas à vendre"
 *                     status: 400
 *               wrongPrice:
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Le prix ne correspond pas"
 *                     status: 400
 *               insufficientFunds:
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Solde insuffisant"
 *                     status: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
    
    // Journaliser l'événement
    logger.logBusinessEvent('card_purchase', {
      transactionId: transaction._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      cardId: card._id,
      price
    });
    
    return res.status(201).json(formatApiResponse(true, { transaction }));
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};

/**
 * Statistiques générales
 */

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Récupère les statistiques générales
 *     description: Renvoie les statistiques globales de la plateforme
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           example: 150
 *                         totalCards:
 *                           type: integer
 *                           example: 300
 *                         totalPlayerCards:
 *                           type: integer
 *                           example: 1200
 *                         cardsForSale:
 *                           type: integer
 *                           example: 75
 *                         recentTransactions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Transaction'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
    logger.logError(error, req);
    return res.status(500).json(formatApiResponse(false, null, { message: error.message }));
  }
};