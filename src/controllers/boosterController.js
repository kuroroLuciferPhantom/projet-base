const User = require('../models/User');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');
const Transaction = require('../models/Transaction');
const ethers = require('ethers');
const web3Utils = require('../utils/web3');

// Configuration des boosters - Prix unique et probabilités de rareté
const BOOSTER_CONFIG = {
  purchase: {
    price: 100, // Prix fixe pour tout achat
    cardCount: 3 // Nombre de cartes par booster
  },
  rarityWeights: [0.82, 0.14, 0.04], // Probabilités : commun, rare, épique
  rarityTypes: ['common', 'rare', 'epic'],
  rarityProbabilities: {
    common: { common: 0.80, rare: 0.15, epic: 0.04, legendary: 0.01 },
    rare: { common: 0.55, rare: 0.35, epic: 0.08, legendary: 0.02 },
    epic: { common: 0.30, rare: 0.45, epic: 0.20, legendary: 0.05 }
  }
};

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
      boosters: user.boosters,
      tokenBalance: user.tokenBalance
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
    if (!['common', 'rare', 'epic'].includes(boosterType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de booster invalide. Types disponibles: common, rare, epic'
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
    
    // Générer les cartes aléatoires (3 cartes par booster)
    const cards = await generateRandomCards(BOOSTER_CONFIG.rarityProbabilities[boosterType], BOOSTER_CONFIG.purchase.cardCount);
    
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
    
    // Créer une transaction pour l'historique
    const transaction = new Transaction({
      type: 'booster_open',
      user: userId,
      boosterType,
      amount: 1,
      cardIds: playerCards.map(card => card.id),
      status: 'completed'
    });
    
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: `Booster ${boosterType} ouvert avec succès`,
      cards: playerCards,
      remainingBoosters: user.boosters,
      tokenBalance: user.tokenBalance
    });
  } catch (error) {
    console.error("Erreur lors de l'ouverture du booster:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Acheter un booster (prix fixe, rareté aléatoire)
exports.buyBooster = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity = 1 } = req.body;
    
    // Valider la quantité
    if (quantity <= 0 || !Number.isInteger(quantity) || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide (1-10 boosters maximum)'
      });
    }
    
    const totalPrice = BOOSTER_CONFIG.purchase.price * quantity;
    
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
        message: `Solde insuffisant. Vous avez ${user.tokenBalance} tokens mais il en faut ${totalPrice}`,
        required: totalPrice,
        current: user.tokenBalance
      });
    }
    
    // Effectuer la transaction
    user.tokenBalance -= totalPrice;
    
    // Ajouter les boosters selon la rareté aléatoire
    const purchasedBoosters = [];
    for (let i = 0; i < quantity; i++) {
      const randomBoosterType = getRandomBoosterType();
      user.boosters[randomBoosterType] += 1;
      purchasedBoosters.push(randomBoosterType);
    }
    
    // Sauvegarder les modifications
    await user.save();
    
    // Créer une transaction pour l'historique
    const transaction = new Transaction({
      type: 'booster_purchase',
      user: userId,
      amount: quantity,
      price: totalPrice,
      boosterTypes: purchasedBoosters,
      status: 'completed'
    });
    
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} booster(s) acheté(s) avec succès pour ${totalPrice} tokens`,
      boosters: user.boosters,
      tokenBalance: user.tokenBalance,
      purchasedBoosters,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: quantity,
        price: totalPrice
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'achat du booster:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Achat et ouverture automatique d'un booster
exports.buyAndOpenBooster = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🎮 Début achat et ouverture booster pour utilisateur:', userId);
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', userId);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const price = BOOSTER_CONFIG.purchase.price;
    console.log(`💰 Prix du booster: ${price}, Solde utilisateur: ${user.tokenBalance}`);
    
    // Vérifier si l'utilisateur a assez de tokens
    if (user.tokenBalance < price) {
      console.log('❌ Solde insuffisant');
      return res.status(400).json({
        success: false,
        message: `Solde insuffisant. Vous avez ${user.tokenBalance} tokens mais il en faut ${price}`,
        required: price,
        current: user.tokenBalance
      });
    }
    
    // Déduire le prix du booster
    user.tokenBalance -= price;
    
    // Déterminer la rareté du booster aléatoirement
    const boosterType = getRandomBoosterType();
    console.log(`🎲 Type de booster déterminé: ${boosterType}`);
    
    // Générer les cartes aléatoires selon la rareté du booster
    console.log('🃏 Génération des cartes...');
    const cards = await generateRandomCards(BOOSTER_CONFIG.rarityProbabilities[boosterType], BOOSTER_CONFIG.purchase.cardCount);
    
    if (cards.length === 0) {
      console.log('❌ Aucune carte générée');
      // Rembourser en cas d'erreur
      user.tokenBalance += price;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des cartes'
      });
    }
    
    console.log(`✅ ${cards.length} cartes générées:`, cards.map(c => `${c.name} (${c.rarity})`));
    
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
    
    // Sauvegarder les modifications de l'utilisateur
    await user.save();
    
    // Créer une transaction pour l'historique
    const transaction = new Transaction({
      type: 'booster_buy_and_open',
      user: userId,
      boosterType,
      amount: 1,
      price,
      cardIds: playerCards.map(card => card.id),
      status: 'completed'
    });
    
    await transaction.save();
    
    console.log('✅ Achat et ouverture réussis !');
    
    res.status(200).json({
      success: true,
      message: `Booster ${boosterType} acheté et ouvert avec succès !`,
      boosterType,
      cards: playerCards,
      tokenBalance: user.tokenBalance,
      boosters: user.boosters,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        price
      }
    });
  } catch (error) {
    console.error("💥 Erreur lors de l'achat et ouverture du booster:", error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir la configuration des boosters
exports.getBoosterConfig = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      config: {
        price: BOOSTER_CONFIG.purchase.price,
        cardCount: BOOSTER_CONFIG.purchase.cardCount,
        rarityWeights: BOOSTER_CONFIG.rarityWeights,
        rarityTypes: BOOSTER_CONFIG.rarityTypes,
        rarityProbabilities: BOOSTER_CONFIG.rarityProbabilities
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration:', error);
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
    
    // Ajouter un booster commun gratuit
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
    console.error("Erreur lors de l'attribution du booster de bienvenue:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Fonction pour déterminer la rareté d'un booster aléatoirement
function getRandomBoosterType() {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < BOOSTER_CONFIG.rarityTypes.length; i++) {
    cumulativeWeight += BOOSTER_CONFIG.rarityWeights[i];
    if (random < cumulativeWeight) {
      return BOOSTER_CONFIG.rarityTypes[i];
    }
  }
  
  return 'common'; // Par défaut
}

// Fonction pour générer des cartes aléatoires selon les probabilités - VERSION CORRIGÉE
async function generateRandomCards(probabilities, count = 3) {
  try {
    console.log('🎯 Génération de cartes avec probabilités:', probabilities);
    console.log('🔢 Nombre de cartes à générer:', count);
    
    let cards = [];
    
    // Vérifier d'abord qu'il y a des cartes disponibles
    const totalCards = await GameCard.countDocuments({ isAvailable: true });
    console.log(`📊 Total de cartes disponibles dans la DB: ${totalCards}`);
    
    if (totalCards === 0) {
      console.log('❌ Aucune carte disponible dans la base de données');
      return [];
    }
    
    // Vérifier par rareté
    const rarityCheck = {};
    for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
      const count = await GameCard.countDocuments({ rarity, isAvailable: true });
      rarityCheck[rarity] = count;
      console.log(`📈 Cartes ${rarity}: ${count}`);
    }
    
    // Générer les cartes
    for (let i = 0; i < count; i++) {
      console.log(`🎲 Génération carte ${i + 1}/${count}`);
      const random = Math.random();
      let targetRarity;
      
      // Déterminer la rareté basée sur la probabilité
      if (random < probabilities.legendary) {
        targetRarity = 'legendary';
      } else if (random < probabilities.legendary + probabilities.epic) {
        targetRarity = 'epic';
      } else if (random < probabilities.legendary + probabilities.epic + probabilities.rare) {
        targetRarity = 'rare';
      } else {
        targetRarity = 'common';
      }
      
      console.log(`🎯 Rareté ciblée: ${targetRarity} (random: ${random})`);
      
      // Obtenir toutes les cartes disponibles de cette rareté
      const availableCards = await GameCard.find({ rarity: targetRarity, isAvailable: true });
      console.log(`📦 Cartes disponibles pour ${targetRarity}: ${availableCards.length}`);
      
      if (availableCards.length > 0) {
        // Choisir une carte aléatoire parmi les disponibles
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const selectedCard = availableCards[randomIndex];
        cards.push(selectedCard);
        console.log(`✅ Carte sélectionnée: ${selectedCard.name} (${selectedCard.rarity})`);
      } else {
        // Fallback vers une rareté qui a des cartes disponibles
        console.log(`⚠️ Aucune carte ${targetRarity} disponible, fallback...`);
        
        // Essayer dans l'ordre: common, rare, epic, legendary
        const fallbackOrder = ['common', 'rare', 'epic', 'legendary'];
        let fallbackCard = null;
        
        for (const fallbackRarity of fallbackOrder) {
          if (rarityCheck[fallbackRarity] > 0) {
            const fallbackCards = await GameCard.find({ rarity: fallbackRarity, isAvailable: true });
            if (fallbackCards.length > 0) {
              const randomIndex = Math.floor(Math.random() * fallbackCards.length);
              fallbackCard = fallbackCards[randomIndex];
              console.log(`🔄 Fallback réussi: ${fallbackCard.name} (${fallbackCard.rarity})`);
              break;
            }
          }
        }
        
        if (fallbackCard) {
          cards.push(fallbackCard);
        } else {
          console.log('❌ Aucune carte de fallback trouvée');
        }
      }
    }
    
    console.log(`✅ Génération terminée: ${cards.length} cartes générées`);
    return cards;
  } catch (error) {
    console.error('💥 Erreur lors de la génération des cartes aléatoires:', error);
    console.error('Stack trace:', error.stack);
    return [];
  }
}

// Fonctions blockchain (placeholders pour future implémentation)
exports.buyBoosterAndMintNFTs = async (req, res) => {
  // Implémentation future pour l'intégration blockchain
  res.status(501).json({
    success: false,
    message: 'Fonctionnalité blockchain non encore implémentée'
  });
};

exports.syncNFTsWithBackend = async (req, res) => {
  // Implémentation future pour l'intégration blockchain
  res.status(501).json({
    success: false,
    message: 'Fonctionnalité blockchain non encore implémentée'
  });
};

module.exports = exports;