const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlayerCardSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameCard: {
    type: Schema.Types.ObjectId,
    ref: 'GameCard',
    required: true
  },
  tokenId: {
    type: String,
    default: null // Sera généré lorsque la carte sera créée comme NFT
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  isInDeck: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  enhancedStats: {
    attack: {
      type: Number,
      default: 0 // Bonus supplémentaire
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
  acquiredAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode pour obtenir les statistiques totales
PlayerCardSchema.methods.getTotalStats = async function() {
  await this.populate('gameCard');
  
  return {
    attack: this.gameCard.stats.attack + this.enhancedStats.attack,
    defense: this.gameCard.stats.defense + this.enhancedStats.defense,
    magic: this.gameCard.stats.magic + this.enhancedStats.magic,
    speed: this.gameCard.stats.speed + this.enhancedStats.speed
  };
};

// Méthode pour gagner de l'expérience et monter de niveau
PlayerCardSchema.methods.gainExperience = async function(amount) {
  this.experience += amount;
  
  // Calcul de l'expérience nécessaire pour le niveau suivant (formule simple)
  const expNeeded = this.level * 100;
  
  // Si suffisamment d'expérience, monter de niveau
  if (this.experience >= expNeeded) {
    this.level += 1;
    this.experience -= expNeeded;
    
    // Augmenter les statistiques aléatoirement
    const statIncrease = Math.floor(Math.random() * 3) + 1; // Entre 1 et 3
    const statToIncrease = ['attack', 'defense', 'magic', 'speed'][Math.floor(Math.random() * 4)];
    
    this.enhancedStats[statToIncrease] += statIncrease;
    
    await this.save();
    return `La carte est montée au niveau ${this.level} et a gagné +${statIncrease} en ${statToIncrease}!`;
  }
  
  await this.save();
  return `La carte a gagné ${amount} points d'expérience.`;
};

module.exports = mongoose.model('PlayerCard', PlayerCardSchema);