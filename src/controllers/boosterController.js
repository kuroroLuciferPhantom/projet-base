const User = require('../models/User');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');
const Transaction = require('../models/Transaction');
const ethers = require('ethers');
const web3Utils = require('../utils/web3');

// Configuration des boosters - Prix et probabilités
const BOOSTER_CONFIG = {
  common: {
    price: 100,
    cardCount: 3,
    probabilities: { common: 0.80, rare: 0.15, epic: 0.04, legendary: 0.01 }
  },
  rare: {
    price: 300,
    cardCount: 3,
    probabilities: { common: 0.55, rare: 0.35, epic: 0.08, legendary: 0.02 }
  },
  epic: {
    price: 600,
    cardCount: 3,
    probabilities: { common: 0.30, rare: 0.45, epic: 0.20, legendary: 0.05 }
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
    
    // Valider le type de booster (seulement common, rare, epic)
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
    
    // Obtenir la configuration du booster
    const config = BOOSTER_CONFIG[boosterType];
    
    // Générer les cartes aléatoires (3 cartes par booster)
    const cards = await generateRandomCards(config.probabilities, config.cardCount);
    
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
    
    // Valider le type de booster (seulement common, rare, epic)
    if (!['common', 'rare', 'epic'].includes(boosterType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de booster invalide. Types disponibles: common, rare, epic'
      });
    }
    
    // Valider la quantité
    if (quantity <= 0 || !Number.isInteger(quantity) || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide (1-10 boosters maximum)'
      });
    }
    
    // Obtenir la configuration du booster
    const config = BOOSTER_CONFIG[boosterType];
    const totalPrice = config.price * quantity;
    
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
    user.boosters[boosterType] += quantity;
    
    // Sauvegarder les modifications
    await user.save();
    
    // Créer une transaction pour l'historique
    const transaction = new Transaction({
      type: 'booster_purchase',
      user: userId,
      boosterType,
      amount: quantity,
      price: totalPrice,
      status: 'completed'
    });
    
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} booster(s) ${boosterType} acheté(s) avec succès pour ${totalPrice} tokens`,
      boosters: user.boosters,
      tokenBalance: user.tokenBalance,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: quantity,
        price: totalPrice
      }
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

// Achat et ouverture automatique d'un booster
exports.buyAndOpenBooster = async (req, res) => {
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
    
    // Obtenir la configuration du booster
    const config = BOOSTER_CONFIG[boosterType];
    
    // Vérifier si l'utilisateur a assez de tokens
    if (user.tokenBalance < config.price) {
      return res.status(400).json({
        success: false,
        message: `Solde insuffisant. Vous avez ${user.tokenBalance} tokens mais il en faut ${config.price}`,
        required: config.price,
        current: user.tokenBalance
      });
    }
    
    // Déduire le prix du booster
    user.tokenBalance -= config.price;
    
    // Générer les cartes aléatoires (3 cartes par booster)
    const cards = await generateRandomCards(config.probabilities, config.cardCount);
    
    if (cards.length === 0) {
      // Rembourser en cas d'erreur
      user.tokenBalance += config.price;
      await user.save();
      
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
    
    // Sauvegarder les modifications de l'utilisateur
    await user.save();
    
    // Créer une transaction pour l'historique
    const transaction = new Transaction({
      type: 'booster_buy_and_open',
      user: userId,
      boosterType,
      amount: 1,
      price: config.price,
      cardIds: playerCards.map(card => card.id),
      status: 'completed'
    });
    
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: `Booster ${boosterType} acheté et ouvert avec succès !`,
      cards: playerCards,
      tokenBalance: user.tokenBalance,
      boosters: user.boosters,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        price: config.price
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'achat et ouverture du booster:', error);
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
      boosters: BOOSTER_CONFIG
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Fonction pour générer des cartes aléatoires selon les probabilités
async function generateRandomCards(probabilities, count = 3) {
  try {
    let cards = [];
    
    // Générer les cartes
    for (let i = 0; i < count; i++) {
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
      
      // Obtenir toutes les cartes disponibles de cette rareté
      const availableCards = await GameCard.find({ rarity: targetRarity, isAvailable: true });
      
      if (availableCards.length > 0) {
        // Choisir une carte aléatoire parmi les disponibles
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        cards.push(availableCards[randomIndex]);
      } else {
        // Fallback à la rareté commune si aucune carte n'est disponible dans la rareté cible
        const commonCards = await GameCard.find({ rarity: 'common', isAvailable: true });
        if (commonCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * commonCards.length);
          cards.push(commonCards[randomIndex]);
        }
      }
    }
    
    return cards;
  } catch (error) {
    console.error('Erreur lors de la génération des cartes aléatoires:', error);
    return [];
  }
}

// Nouvelle fonction pour acheter un booster et créer des NFTs
exports.buyBoosterAndMintNFTs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boosterType, walletAddress, transactionHash } = req.body;
    
    // Valider les paramètres
    if (!boosterType || !walletAddress || !transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }
    
    // Valider le type de booster
    if (!['common', 'rare', 'epic'].includes(boosterType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de booster invalide'
      });
    }
    
    // Valider l'adresse du wallet
    if (!web3Utils.isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse wallet invalide'
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
    
    // Vérifier si l'adresse du wallet correspond à celle de l'utilisateur
    if (user.walletAddress && user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse du wallet ne correspond pas à celle de l\'utilisateur'
      });
    }
    
    // Si l'utilisateur n'a pas d'adresse de wallet, la mettre à jour
    if (!user.walletAddress) {
      user.walletAddress = walletAddress.toLowerCase();
      await user.save();
    }
    
    // Vérifier la transaction sur la blockchain
    const isValidTransaction = await verifyBoosterPurchaseTransaction(
      walletAddress, 
      boosterType, 
      transactionHash
    );
    
    if (!isValidTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction blockchain invalide'
      });
    }
    
    // Obtenir la configuration du booster
    const config = BOOSTER_CONFIG[boosterType];
    
    // Générer les cartes aléatoires
    const cards = await generateRandomCards(config.probabilities, config.cardCount);
    
    if (cards.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des cartes'
      });
    }
    
    // Créer les cartes du joueur avec tokenIds pour les NFTs
    const playerCards = [];
    const tokenIds = [];
    
    for (const card of cards) {
      // Générer un tokenId unique pour cette carte
      const tokenId = await generateUniqueTokenId(card._id);
      tokenIds.push(tokenId);
      
      const playerCard = new PlayerCard({
        owner: userId,
        gameCard: card._id,
        tokenId: tokenId
      });
      
      await playerCard.save();
      
      // Ajouter la référence à la carte dans le tableau des cartes de l'utilisateur
      user.cards.push(playerCard._id);
      
      // Préparer les données pour la réponse
      playerCards.push({
        id: playerCard._id,
        gameCard: card,
        tokenId: tokenId
      });
    }
    
    // Enregistrer la transaction
    const transaction = new Transaction({
      type: 'booster_purchase_nft',
      user: userId,
      amount: 1,
      boosterType,
      transactionHash,
      cardIds: playerCards.map(card => card.id),
      tokenIds,
      status: 'completed',
      isBlockchainTransaction: true
    });
    
    await transaction.save();
    
    // Sauvegarder les modifications de l'utilisateur
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Booster ${boosterType} acheté et NFTs créés avec succès`,
      cards: playerCards,
      transaction: {
        id: transaction._id,
        transactionHash
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'achat du booster et mint NFTs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Synchroniser les NFTs avec le backend
exports.syncNFTsWithBackend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletAddress, cardIds, transactionHash } = req.body;
    
    // Valider les paramètres
    if (!walletAddress || !cardIds || !Array.isArray(cardIds) || !transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants ou invalides'
      });
    }
    
    // Valider l'adresse du wallet
    if (!web3Utils.isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse wallet invalide'
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
    
    // Vérifier si l'adresse du wallet correspond à celle de l'utilisateur
    if (user.walletAddress && user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse du wallet ne correspond pas à celle de l\'utilisateur'
      });
    }
    
    // Si l'utilisateur n'a pas d'adresse de wallet, la mettre à jour
    if (!user.walletAddress) {
      user.walletAddress = walletAddress.toLowerCase();
      await user.save();
    }
    
    // Vérifier si la transaction existe déjà pour éviter les doublons
    const existingTransaction = await Transaction.findOne({ transactionHash });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Cette transaction a déjà été traitée'
      });
    }
    
    // Vérifier la transaction sur la blockchain
    const isValidTransaction = await verifyNFTMintTransaction(
      walletAddress, 
      cardIds, 
      transactionHash
    );
    
    if (!isValidTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction blockchain invalide'
      });
    }
    
    // Créer les entrées pour les cartes NFT
    const playerCards = [];
    
    for (const tokenId of cardIds) {
      // Générer une carte de jeu aléatoire pour ce NFT
      const randomRarity = getRandomRarity();
      const gameCard = await GameCard.findOne({ 
        rarity: randomRarity,
        isAvailable: true 
      });
      
      if (!gameCard) {
        continue; // Passer au tokenId suivant si aucune carte disponible
      }
      
      // Créer une carte joueur liée au NFT
      const playerCard = new PlayerCard({
        owner: userId,
        gameCard: gameCard._id,
        tokenId: tokenId
      });
      
      await playerCard.save();
      
      // Ajouter la référence à la carte dans le tableau des cartes de l'utilisateur
      user.cards.push(playerCard._id);
      
      // Préparer les données pour la réponse
      playerCards.push({
        id: playerCard._id,
        gameCard,
        tokenId
      });
    }
    
    // Créer une transaction pour enregistrer l'opération
    const transaction = new Transaction({
      type: 'nft_sync',
      user: userId,
      amount: playerCards.length,
      cardIds: playerCards.map(card => card.id),
      tokenIds: cardIds,
      transactionHash,
      status: 'completed',
      isBlockchainTransaction: true
    });
    
    await transaction.save();
    
    // Sauvegarder les modifications de l'utilisateur
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `${playerCards.length} cartes NFT synchronisées avec succès`,
      cards: playerCards,
      transaction: {
        id: transaction._id,
        transactionHash
      }
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des NFTs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Fonction pour vérifier une transaction de booster sur la blockchain
async function verifyBoosterPurchaseTransaction(walletAddress, boosterType, transactionHash) {
  try {
    // Dans une implémentation réelle, on vérifierait la transaction sur la blockchain
    // Pour cette démo, on retourne true
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la transaction blockchain:', error);
    return false;
  }
}

// Fonction pour vérifier une transaction de minting de NFT sur la blockchain
async function verifyNFTMintTransaction(walletAddress, tokenIds, transactionHash) {
  try {
    // Dans une implémentation réelle, on vérifierait la transaction sur la blockchain
    // Pour cette démo, on retourne true
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la transaction NFT:', error);
    return false;
  }
}

// Fonction pour générer un tokenId unique pour une carte
async function generateUniqueTokenId(cardId) {
  // Dans une implémentation réelle, ces tokenIds seraient générés par le smart contract
  const prefix = "EFC"; // Préfixe pour le jeu Epic Faction Community
  const timestamp = Date.now().toString();
  const uniqueId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // Le format est EFC-[timestamp]-[cardId]-[random]
  return `${prefix}-${timestamp}-${cardId.toString().substring(0, 8)}-${uniqueId}`;
}

// Fonction utilitaire pour obtenir une rareté aléatoire
function getRandomRarity() {
  const rarities = ['common', 'rare', 'epic', 'legendary'];
  const weights = [0.6, 0.25, 0.1, 0.05]; // Probabilités pour chaque rareté
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < rarities.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return rarities[i];
    }
  }
  
  return 'common'; // Par défaut
}

module.exports = exports;