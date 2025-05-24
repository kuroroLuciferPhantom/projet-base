const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['card_purchase', 'card_sale', 'booster_purchase', 'booster_open', 'booster_buy_and_open'],
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Pour les transactions de cartes (marketplace)
  card: {
    type: Schema.Types.ObjectId,
    ref: 'GameCard',
    required: false // Optionnel car pas utilisé pour les boosters
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optionnel car pas utilisé pour les boosters
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optionnel car pas utilisé pour les boosters
  },
  // Pour les transactions de boosters
  boosterType: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: false
  },
  boosterTypes: [{
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary']
  }],
  amount: {
    type: Number,
    default: 1
  },
  cardIds: [{
    type: Schema.Types.ObjectId,
    ref: 'PlayerCard'
  }],
  // Informations générales
  price: {
    type: Number,
    required: false // Optionnel pour certains types de transactions
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  blockchainTxHash: {
    type: String,
    required: false
  }
});

// Index pour optimiser les requêtes
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);