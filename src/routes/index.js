const express = require('express');
const router = express.Router();

// Middleware d'authentification
const { isAuthenticated } = require('../middleware/auth');

// Modèles
const User = require('../models/User');

// Page d'accueil
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'EpicFactionCommunity - Jeu de cartes à collectionner NFT',
    user: req.session.user || null,
    pageCss: 'styles', // Pour s'assurer que styles.css est bien chargé
    pageJs: 'main', // Pour s'assurer que main.js est bien chargé
    page: 'home' // Indiquer que c'est la page d'accueil pour charger homepage.css
  });
});

// Page de l'application (nécessite authentification)
router.get('/app', isAuthenticated, async (req, res) => {
  try {
    // Récupérer les données complètes de l'utilisateur depuis la base de données
    const fullUser = await User.findById(req.session.user.id).select('username email tokenBalance level experience completedTutorial boosters cards');
    
    if (!fullUser) {
      // Si l'utilisateur n'existe plus en BDD, détruire la session et rediriger
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('app/index', { 
      title: 'EpicFactionCommunity - Votre Collection',
      user: fullUser, // Passer l'utilisateur complet avec tokenBalance
      pageCss: 'app', // Charge app.css
      pageJs: 'app' // Charge app.js
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).render('error', { 
      message: 'Une erreur est survenue lors du chargement de votre profil' 
    });
  }
});

// Page de connexion
router.get('/login', (req, res) => {
  // Rediriger vers l'app si déjà connecté
  if (req.session.user) {
    return res.redirect('/app');
  }
  
  res.render('login', { 
    title: 'EpicFactionCommunity - Connexion',
    user: null,
    pageCss: 'auth', // Charge auth.css
    layout: false // Ne pas utiliser le layout pour la page de login
  });
});

// Page d'inscription
router.get('/register', (req, res) => {
  // Rediriger vers l'app si déjà connecté
  if (req.session.user) {
    return res.redirect('/app');
  }
  
  res.render('register', { 
    title: 'EpicFactionCommunity - Inscription',
    user: null,
    pageCss: 'auth', // Charge auth.css
    layout: false // Ne pas utiliser le layout pour la page d'inscription
  });
});

module.exports = router;