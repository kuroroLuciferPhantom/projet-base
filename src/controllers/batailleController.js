const User = require('../models/User');
const PlayerCard = require('../models/PlayerCard');
const Deck = require('../models/Deck');
const GameStats = require('../models/GameStats');
const logger = require('../utils/logger');

// Middleware pour initialiser les statistiques du joueur s'il n'en a pas
exports.initPlayerStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Vérifier si l'utilisateur a déjà des statistiques
    let gameStats = await GameStats.findOne({ user: userId });
    
    // Si l'utilisateur n'a pas de statistiques, les créer
    if (!gameStats) {
      gameStats = new GameStats({ user: userId });
      await gameStats.save();
      
      logger.info(`Statistiques de jeu initialisées pour l'utilisateur: ${userId}`);
    }
    
    // Ajouter les statistiques à la requête pour les utiliser dans les routes suivantes
    req.gameStats = gameStats;
    next();
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation des statistiques du joueur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de l\'initialisation des statistiques' 
    });
  }
};

// Récupérer les statistiques de jeu du joueur
exports.getPlayerStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const gameStats = await GameStats.findOne({ user: userId });
    
    if (!gameStats) {
      return res.status(404).json({
        success: false,
        message: 'Statistiques de jeu non trouvées'
      });
    }
    
    // Formater les statistiques pour l'affichage
    const formattedStats = {
      wins: gameStats.wins,
      losses: gameStats.losses,
      draws: gameStats.draws,
      winRate: gameStats.wins + gameStats.losses > 0 
              ? Math.round((gameStats.wins / (gameStats.wins + gameStats.losses)) * 100) 
              : 0,
      league: {
        name: gameStats.getLeagueName(),
        tier: gameStats.league.tier,
        division: gameStats.league.division,
        className: `league-${gameStats.league.tier}-${gameStats.league.division}`
      },
      rank: gameStats.leagueRank,
      eloRating: gameStats.eloRating
    };
    
    res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques du joueur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la récupération des statistiques' 
    });
  }
};

// Récupérer les decks du joueur
exports.getPlayerDecks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const decks = await Deck.find({ owner: userId })
                            .populate('cards')
                            .sort({ isActive: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      decks: decks
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des decks du joueur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la récupération des decks' 
    });
  }
};

// Créer un nouveau deck
exports.createDeck = async (req, res) => {
  try {
    const { name, description, cards } = req.body;
    const userId = req.user._id;
    
    // Vérifier que le nom du deck est fourni
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du deck est requis'
      });
    }
    
    // Vérifier que les cartes appartiennent bien au joueur
    if (cards && cards.length > 0) {
      const userCards = await PlayerCard.find({ owner: userId, _id: { $in: cards } });
      
      if (userCards.length !== cards.length) {
        return res.status(400).json({
          success: false,
          message: 'Certaines cartes n\'appartiennent pas au joueur'
        });
      }
    }
    
    // Créer le nouveau deck
    const newDeck = await Deck.createDeck({
      name,
      description,
      owner: userId,
      cards: cards || []
    });
    
    // Renvoyer le deck créé avec les cartes
    const populatedDeck = await Deck.findById(newDeck._id).populate('cards');
    
    res.status(201).json({
      success: true,
      message: 'Deck créé avec succès',
      deck: populatedDeck
    });
  } catch (error) {
    logger.error('Erreur lors de la création du deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la création du deck' 
    });
  }
};

// Mettre à jour un deck existant
exports.updateDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { name, description, cards } = req.body;
    const userId = req.user._id;
    
    // Vérifier que le deck existe et appartient au joueur
    const deck = await Deck.findOne({ _id: deckId, owner: userId });
    
    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck non trouvé ou vous n\'êtes pas le propriétaire'
      });
    }
    
    // Vérifier que les cartes appartiennent bien au joueur
    if (cards && cards.length > 0) {
      const userCards = await PlayerCard.find({ owner: userId, _id: { $in: cards } });
      
      if (userCards.length !== cards.length) {
        return res.status(400).json({
          success: false,
          message: 'Certaines cartes n\'appartiennent pas au joueur'
        });
      }
      
      // Mettre à jour les cartes
      deck.cards = cards;
    }
    
    // Mettre à jour les autres informations
    if (name) deck.name = name;
    if (description !== undefined) deck.description = description;
    
    await deck.save();
    
    // Renvoyer le deck mis à jour avec les cartes
    const updatedDeck = await Deck.findById(deck._id).populate('cards');
    
    res.status(200).json({
      success: true,
      message: 'Deck mis à jour avec succès',
      deck: updatedDeck
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la mise à jour du deck' 
    });
  }
};

// Supprimer un deck
exports.deleteDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user._id;
    
    // Vérifier que le deck existe et appartient au joueur
    const deck = await Deck.findOne({ _id: deckId, owner: userId });
    
    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck non trouvé ou vous n\'êtes pas le propriétaire'
      });
    }
    
    // Si c'est le deck actif, trouver un autre deck à activer
    if (deck.isActive) {
      const anotherDeck = await Deck.findOne({ owner: userId, _id: { $ne: deckId } });
      if (anotherDeck) {
        anotherDeck.isActive = true;
        await anotherDeck.save();
      }
    }
    
    // Supprimer le deck
    await Deck.deleteOne({ _id: deckId });
    
    res.status(200).json({
      success: true,
      message: 'Deck supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la suppression du deck' 
    });
  }
};

// Activer un deck
exports.activateDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user._id;
    
    // Vérifier que le deck existe et appartient au joueur
    const deck = await Deck.findOne({ _id: deckId, owner: userId });
    
    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck non trouvé ou vous n\'êtes pas le propriétaire'
      });
    }
    
    // Désactiver tous les autres decks
    await Deck.updateMany(
      { owner: userId, _id: { $ne: deckId } },
      { isActive: false }
    );
    
    // Activer le deck sélectionné
    deck.isActive = true;
    await deck.save();
    
    res.status(200).json({
      success: true,
      message: 'Deck activé avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de l\'activation du deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de l\'activation du deck' 
    });
  }
};

// Récupérer le leaderboard pour la ligue du joueur
exports.getLeagueLeaderboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Récupérer les statistiques du joueur pour connaître sa ligue
    const playerStats = await GameStats.findOne({ user: userId });
    
    if (!playerStats) {
      return res.status(404).json({
        success: false,
        message: 'Statistiques du joueur non trouvées'
      });
    }
    
    const { tier, division } = playerStats.league;
    
    // Récupérer les joueurs de la même ligue
    const leagueLeaderboard = await GameStats.find({
      'league.tier': tier,
      'league.division': division
    })
    .sort({ eloRating: -1 })
    .populate('user', 'username')
    .limit(100);
    
    // Calculer le seuil pour les 10% supérieurs et inférieurs
    const totalPlayers = leagueLeaderboard.length;
    const topThreshold = Math.max(1, Math.floor(totalPlayers * 0.1));
    const bottomThreshold = Math.max(1, Math.floor(totalPlayers * 0.9));
    
    // Formater les données pour l'affichage
    const formattedLeaderboard = leagueLeaderboard.map((stats, index) => {
      return {
        rank: index + 1,
        username: stats.user.username,
        eloRating: stats.eloRating,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        winRate: stats.wins + stats.losses > 0 
                ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) 
                : 0,
        isCurrentPlayer: stats.user._id.toString() === userId.toString(),
        promotionZone: index < topThreshold,
        demotionZone: index >= bottomThreshold,
        leagueRank: stats.leagueRank
      };
    });
    
    res.status(200).json({
      success: true,
      leaderboard: formattedLeaderboard,
      leagueInfo: {
        name: playerStats.getLeagueName(),
        tier,
        division,
        totalPlayers,
        promotionThreshold: topThreshold,
        demotionThreshold: bottomThreshold
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de la récupération du leaderboard' 
    });
  }
};

// Lancer un combat
exports.startBattle = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deckId } = req.body;
    
    // Vérifier que le joueur a des statistiques
    const playerStats = await GameStats.findOne({ user: userId });
    
    if (!playerStats) {
      return res.status(404).json({
        success: false,
        message: 'Statistiques du joueur non trouvées'
      });
    }
    
    // Vérifier que le deck existe et appartient au joueur
    let deck;
    
    if (deckId) {
      deck = await Deck.findOne({ _id: deckId, owner: userId }).populate('cards');
      
      if (!deck) {
        return res.status(404).json({
          success: false,
          message: 'Deck non trouvé ou vous n\'êtes pas le propriétaire'
        });
      }
    } else {
      // Utiliser le deck actif
      deck = await Deck.findOne({ owner: userId, isActive: true }).populate('cards');
      
      if (!deck) {
        return res.status(404).json({
          success: false,
          message: 'Aucun deck actif trouvé. Veuillez créer un deck.'
        });
      }
    }
    
    // Vérifier que le deck contient exactement 10 cartes
    if (deck.cards.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Le deck doit contenir exactement 10 cartes pour participer à une bataille'
      });
    }
    
    // Préparer les données de la bataille
    // En attendant l'implémentation complète du système de combat,
    // nous retournons simplement les informations du deck et des statistiques
    
    res.status(200).json({
      success: true,
      message: 'Combat initialisé avec succès',
      battleData: {
        deck: {
          id: deck._id,
          name: deck.name,
          cards: deck.cards
        },
        playerStats: {
          wins: playerStats.wins,
          losses: playerStats.losses,
          draws: playerStats.draws,
          eloRating: playerStats.eloRating,
          league: {
            name: playerStats.getLeagueName(),
            tier: playerStats.league.tier,
            division: playerStats.league.division
          }
        }
      }
    });
  } catch (error) {
    logger.error('Erreur lors du lancement du combat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors du lancement du combat' 
    });
  }
};

// Rendu de la page bataille
exports.renderBataillePage = async (req, res) => {
  try {
    // Pas besoin de vérifier l'authentification ici car ce sera fait par le middleware isAuthenticated
    
    res.render('app/bataille', {
      title: 'EpicFactionCommunity - Mode Bataille',
      user: req.user,
      pageCss: 'bataille',
      pageJs: 'bataille'
    });
  } catch (error) {
    logger.error('Erreur lors du rendu de la page bataille:', error);
    res.status(500).render('error', {
      message: 'Une erreur est survenue lors du chargement de la page bataille'
    });
  }
};

module.exports = exports;