const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: {
    attack: {
      type: Number,
      required: true
    },
    defense: {
      type: Number,
      required: true
    },
    magic: {
      type: Number,
      required: true
    },
    speed: {
      type: Number,
      required: true
    }
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Card', CardSchema);