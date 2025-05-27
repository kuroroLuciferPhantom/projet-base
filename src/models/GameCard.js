const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameCardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  type: {
    type: String,
    enum: ['marmotte', 'mask'],
    default: ''
  },
  level: {
    type: String,
    required: true
  },
  stats: {
    attack: {
      type: Number,
      default: 0
    },
    defense: {
      type: Number,
      default: 0
    },
    magic: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    }
  },
  dropRate: {
    common: {
      type: Number,
      default: 0.6
    },
    rare: {
      type: Number,
      default: 0.3
    },
    epic: {
      type: Number,
      default: 0.08
    },
    legendary: {
      type: Number,
      default: 0.02
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode pour générer des cartes aléatoires selon la rareté du booster
GameCardSchema.statics.generateRandomCards = async function(rarityPack, count = 5) {
  try {
    let cards = [];
    
    // Déterminer les probabilités basées sur le type de booster
    let probabilities = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    switch (rarityPack) {
      case 'common':
        probabilities = { common: 0.8, rare: 0.15, epic: 0.04, legendary: 0.01 };
        break;
      case 'rare':
        probabilities = { common: 0.55, rare: 0.35, epic: 0.08, legendary: 0.02 };
        break;
      case 'epic':
        probabilities = { common: 0.30, rare: 0.45, epic: 0.20, legendary: 0.05 };
        break;
      case 'legendary':
        probabilities = { common: 0.15, rare: 0.35, epic: 0.35, legendary: 0.15 };
        break;
      default:
        probabilities = { common: 0.7, rare: 0.2, epic: 0.08, legendary: 0.02 };
    }
    
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
      const availableCards = await this.find({ rarity: targetRarity, isAvailable: true });
      
      if (availableCards.length > 0) {
        // Choisir une carte aléatoire parmi les disponibles
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        cards.push(availableCards[randomIndex]);
      } else {
        // Fallback à la rareté commune si aucune carte n'est disponible dans la rareté cible
        const commonCards = await this.find({ rarity: 'common', isAvailable: true });
        const randomIndex = Math.floor(Math.random() * commonCards.length);
        cards.push(commonCards[randomIndex]);
      }
    }
    
    return cards;
  } catch (error) {
    console.error('Erreur lors de la génération des cartes aléatoires:', error);
    return [];
  }
};

module.exports = mongoose.model('GameCard', GameCardSchema);