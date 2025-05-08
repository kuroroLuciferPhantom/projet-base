const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeckSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cards: [{
    type: Schema.Types.ObjectId,
    ref: 'Card'
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour limiter le nombre de cartes à 10
DeckSchema.pre('save', function(next) {
  if (this.cards.length > 10) {
    this.cards = this.cards.slice(0, 10);
  }
  this.updatedAt = Date.now();
  next();
});

// Validation pour s'assurer qu'un utilisateur ne peut avoir qu'un seul deck actif
DeckSchema.pre('save', async function(next) {
  if (this.isActive) {
    try {
      // Désactiver tous les autres decks de l'utilisateur
      await this.constructor.updateMany(
        { owner: this.owner, _id: { $ne: this._id }, isActive: true },
        { isActive: false }
      );
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Méthode pour ajouter une carte au deck
DeckSchema.methods.addCard = function(cardId) {
  if (this.cards.length >= 10) {
    throw new Error('Le deck ne peut pas contenir plus de 10 cartes');
  }
  
  // Vérifier si la carte existe déjà dans le deck
  if (this.cards.some(card => card.toString() === cardId.toString())) {
    throw new Error('Cette carte est déjà dans le deck');
  }
  
  this.cards.push(cardId);
  return this.save();
};

// Méthode pour retirer une carte du deck
DeckSchema.methods.removeCard = function(cardId) {
  const cardIndex = this.cards.findIndex(card => card.toString() === cardId.toString());
  
  if (cardIndex === -1) {
    throw new Error('Cette carte n\'est pas dans le deck');
  }
  
  this.cards.splice(cardIndex, 1);
  return this.save();
};

// Méthode pour activer le deck
DeckSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Méthode pour mettre à jour les statistiques après un match
DeckSchema.methods.updateStats = function(result) {
  this.stats.gamesPlayed += 1;
  
  if (result === 'win') {
    this.stats.wins += 1;
  } else if (result === 'loss') {
    this.stats.losses += 1;
  } else if (result === 'draw') {
    this.stats.draws += 1;
  }
  
  return this.save();
};

// Méthode statique pour trouver le deck actif d'un utilisateur
DeckSchema.statics.findActiveDeck = function(userId) {
  return this.findOne({ owner: userId, isActive: true }).populate('cards');
};

// Méthode statique pour créer un nouveau deck
DeckSchema.statics.createDeck = async function(deckData) {
  const deck = new this(deckData);
  
  // Si c'est le premier deck de l'utilisateur, le marquer comme actif
  const deckCount = await this.countDocuments({ owner: deckData.owner });
  if (deckCount === 0) {
    deck.isActive = true;
  }
  
  return deck.save();
};

module.exports = mongoose.model('Deck', DeckSchema);
