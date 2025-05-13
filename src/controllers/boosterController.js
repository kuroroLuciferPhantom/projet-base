const User = require('../models/User');
const GameCard = require('../models/GameCard');
const PlayerCard = require('../models/PlayerCard');
const Transaction = require('../models/Transaction');
const ethers = require('ethers');
const web3Utils = require('../utils/web3');

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
    if (!['common', 'rare', 'epic', 'legendary'].includes(boosterType)) {
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
    
    // Générer les cartes aléatoires
    const cards = await GameCard.generateRandomCards(boosterType, 5);
    
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
      type: 'booster_purchase',
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
      // Ici, nous supposons que le tokenId est unique et correspond à un NFT valide
      // Dans une implémentation réelle, il faudrait vérifier que le tokenId appartient bien à l'utilisateur
      // et récupérer les métadonnées du NFT via l'URI associé
      
      // Générer une carte de jeu aléatoire pour ce NFT
      // Dans une implémentation réelle, cela serait basé sur les métadonnées du NFT
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
    // en utilisant un fournisseur comme Infura, Alchemy, etc.
    
    // Exemple avec ethers.js:
    /*
    const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    
    // Récupérer la transaction
    const tx = await provider.getTransaction(transactionHash);
    
    // Vérifier que la transaction est confirmée
    if (!tx || !tx.blockNumber) {
      return false;
    }
    
    // Vérifier que l'émetteur est bien le wallet fourni
    if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
      return false;
    }
    
    // Vérifier que la transaction concerne bien l'achat d'un booster
    // Cela dépend de la structure du smart contract
    const boosterContract = new ethers.Contract(
      process.env.BOOSTER_CONTRACT_ADDRESS,
      BOOSTER_ABI,
      provider
    );
    
    // Décoder les logs pour vérifier l'événement d'achat de booster
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const eventSignature = ethers.utils.id("BoosterPurchased(address,string,uint256)");
    
    const log = receipt.logs.find(log => 
      log.topics[0] === eventSignature && 
      log.address.toLowerCase() === process.env.BOOSTER_CONTRACT_ADDRESS.toLowerCase()
    );
    
    if (!log) {
      return false;
    }
    
    // Décoder les paramètres de l'événement
    const decodedLog = boosterContract.interface.parseLog(log);
    
    // Vérifier que l'acheteur correspond au wallet fourni
    const buyer = decodedLog.args.buyer.toLowerCase();
    if (buyer !== walletAddress.toLowerCase()) {
      return false;
    }
    
    // Vérifier que le type de booster correspond
    const purchasedBoosterType = decodedLog.args.boosterType;
    if (purchasedBoosterType !== boosterType) {
      return false;
    }
    */
    
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
    // Comme pour verifyBoosterPurchaseTransaction, mais en vérifiant les événements de création de NFT
    
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
  // Ici, on simule la génération d'un tokenId unique
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