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
  acquiredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlayerCard', PlayerCardSchema);