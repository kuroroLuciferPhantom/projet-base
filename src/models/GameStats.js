const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameStatsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  eloRating: {
    type: Number,
    default: 1000
  },
  winStreak: {
    type: Number,
    default: 0
  },
  bestWinStreak: {
    type: Number,
    default: 0
  },
  cardsUsed: [{
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card'
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    games: {
      type: Number,
      default: 0
    }
  }],
  lastPlayed: {
    type: Date,
    default: null
  },
  league: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold'],
      default: 'bronze'
    },
    division: {
      type: Number,
      enum: [1, 2, 3],
      default: 3
    }
  },
  leagueRank: {
    type: Number,
    default: 0
  },
  lastSeasonRank: {
    type: Number,
    default: 0
  }
});

// Méthode pour obtenir le nom complet de la ligue (ex: "Or 1")
GameStatsSchema.methods.getLeagueName = function() {
  const tierNames = {
    'bronze': 'Bronze',
    'silver': 'Argent',
    'gold': 'Or'
  };
  
  return `${tierNames[this.league.tier]} ${this.league.division}`;
};

// Méthode pour mettre à jour les statistiques après un match
GameStatsSchema.methods.updateAfterMatch = function(result, cardsUsed) {
  // Mettre à jour les statistiques de base
  if (result === 'win') {
    this.wins += 1;
    this.winStreak += 1;
    if (this.winStreak > this.bestWinStreak) {
      this.bestWinStreak = this.winStreak;
    }
  } else if (result === 'loss') {
    this.losses += 1;
    this.winStreak = 0;
  } else if (result === 'draw') {
    this.draws += 1;
    // Les matchs nuls ne modifient pas la série de victoires
  }
  
  // Mettre à jour les statistiques des cartes utilisées
  if (cardsUsed && Array.isArray(cardsUsed)) {
    cardsUsed.forEach(cardId => {
      let cardStats = this.cardsUsed.find(cs => cs.card.toString() === cardId.toString());
      
      if (!cardStats) {
        cardStats = {
          card: cardId,
          wins: 0,
          losses: 0,
          games: 0
        };
        this.cardsUsed.push(cardStats);
      }
      
      cardStats.games += 1;
      if (result === 'win') {
        cardStats.wins += 1;
      } else if (result === 'loss') {
        cardStats.losses += 1;
      }
    });
  }
  
  // Mettre à jour la date du dernier match
  this.lastPlayed = new Date();
  
  return this.save();
};

// Méthode pour calculer et mettre à jour l'ELO après un match
GameStatsSchema.methods.updateElo = function(opponentElo, result) {
  const K = 32; // Facteur K pour déterminer l'impact du match
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - this.eloRating) / 400));
  
  let actualScore;
  if (result === 'win') {
    actualScore = 1;
  } else if (result === 'loss') {
    actualScore = 0;
  } else { // draw
    actualScore = 0.5;
  }
  
  const eloChange = Math.round(K * (actualScore - expectedScore));
  this.eloRating += eloChange;
  
  // Assurer que l'ELO ne descend pas en dessous d'un minimum
  if (this.eloRating < 600) {
    this.eloRating = 600;
  }
  
  return this.save();
};

// Méthode pour promouvoir ou rétrograder dans les ligues
GameStatsSchema.methods.updateLeague = function() {
  const leagueTiers = ['bronze', 'silver', 'gold'];
  const leagueDivisions = [3, 2, 1]; // Du plus bas au plus haut
  
  // Déterminer la ligue en fonction de l'ELO
  let newTier, newDivision;
  
  if (this.eloRating < 1000) {
    newTier = 'bronze';
    if (this.eloRating < 800) {
      newDivision = 3;
    } else if (this.eloRating < 900) {
      newDivision = 2;
    } else {
      newDivision = 1;
    }
  } else if (this.eloRating < 1400) {
    newTier = 'silver';
    if (this.eloRating < 1200) {
      newDivision = 3;
    } else if (this.eloRating < 1300) {
      newDivision = 2;
    } else {
      newDivision = 1;
    }
  } else {
    newTier = 'gold';
    if (this.eloRating < 1600) {
      newDivision = 3;
    } else if (this.eloRating < 1800) {
      newDivision = 2;
    } else {
      newDivision = 1;
    }
  }
  
  // Mise à jour de la ligue si nécessaire
  if (this.league.tier !== newTier || this.league.division !== newDivision) {
    this.league.tier = newTier;
    this.league.division = newDivision;
    return true; // Indique qu'il y a eu un changement de ligue
  }
  
  return false; // Pas de changement de ligue
};

module.exports = mongoose.model('GameStats', GameStatsSchema);
