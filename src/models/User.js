const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true  // Permet aux utilisateurs sans email d'exister
  },
  password: {
    type: String,
    sparse: true  // Permet aux utilisateurs sans password d'exister
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,  // Permet aux utilisateurs sans wallet d'exister
    lowercase: true
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  tokenBalance: {
    type: Number,
    default: 100  // Balance initiale de tokens pour les nouveaux utilisateurs
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  completedTutorial: {
    type: Boolean,
    default: false
  },
  cards: [{
    type: Schema.Types.ObjectId,
    ref: 'Card'
  }],
  boosters: {
    common: { type: Number, default: 1 },  // Un booster gratuit pour commencer
    rare: { type: Number, default: 0 },
    epic: { type: Number, default: 0 },
    legendary: { type: Number, default: 0 }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);