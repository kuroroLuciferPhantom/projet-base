const User = require('../models/User');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');

// Obtenir les boosters d'un utilisateur
exports.getUserBoosters = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      boosters: user.boosters
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des boosters:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ouvrir un booster
exports.openBooster = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boosterType } = req.body;
    
    // Valider le type de booster
    if (!['common', 'rare', 'epic', 'legendary'].includes(boosterType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de booster invalide'
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur a ce type de booster
    if (user.boosters[boosterType] <= 0) {
      return res.status(400).json({
        success: false,
        message: `Vous n'avez pas de booster de type ${boosterType}`
      });
    }
    
    // Générer les cartes aléatoires (5 cartes par booster)
    const cards = await GameCard.generateRandomCards(boosterType, 5);
    
    if (cards.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des cartes'
      });
    }
    
    // Créer les cartes du joueur
    const playerCards = [];
    for (const card of cards) {
      const playerCard = new PlayerCard({
        owner: userId,
        gameCard: card._id
      });
      
      await playerCard.save();
      
      // Ajouter la référence à la carte dans le tableau des cartes de l'utilisateur
      user.cards.push(playerCard._id);
      
      // Préparer les données pour la réponse
      playerCards.push({
        id: playerCard._id,
        gameCard: card
      });
    }
    
    // Décrémenter le nombre de boosters de ce type
    user.boosters[boosterType] -= 1;
    
    // Sauvegarder les modifications
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Booster ${boosterType} ouvert avec succès`,
      cards: playerCards,
      remainingBoosters: user.boosters[boosterType]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du booster:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Acheter un booster
exports.buyBooster = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boosterType, quantity = 1 } = req.body;
    
    // Valider le type de booster
    if (!['common', 'rare', 'epic', 'legendary'].includes(boosterType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de booster invalide'
      });
    }
    
    // Valider la quantité
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide'
      });
    }
    
    // Prix des boosters
    const prices = {
      common: 100,
      rare: 250,
      epic: 500,
      legendary: 1000
    };
    
    const totalPrice = prices[boosterType] * quantity;
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur a assez de tokens
    if (user.tokenBalance < totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant'
      });
    }
    
    // Effectuer la transaction
    user.tokenBalance -= totalPrice;
    user.boosters[boosterType] += quantity;
    
    // Sauvegarder les modifications
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} booster(s) ${boosterType} acheté(s) avec succès`,
      boosters: user.boosters,
      tokenBalance: user.tokenBalance
    });
  } catch (error) {
    console.error('Erreur lors de l\'achat du booster:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récompense de premier booster (pour les nouveaux utilisateurs)
exports.getFirstBooster = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si c'est un nouvel utilisateur
    if (user.completedTutorial) {
      return res.status(400).json({
        success: false,
        message: 'Cette récompense est réservée aux nouveaux utilisateurs'
      });
    }
    
    // Ajouter un booster commun
    user.boosters.common += 1;
    
    // Marquer le tutoriel comme terminé
    user.completedTutorial = true;
    
    // Sauvegarder les modifications
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Booster de bienvenue attribué avec succès',
      boosters: user.boosters
    });
  } catch (error) {
    console.error('Erreur lors de l\'attribution du booster de bienvenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = exports;