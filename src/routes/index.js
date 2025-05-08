const express = require('express');
const router = express.Router();

// Middleware d'authentification
const { isAuthenticated } = require('../middleware/auth');

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
router.get('/app', isAuthenticated, (req, res) => {
  res.render('app', { 
    title: 'EpicFactionCommunity - Votre Collection',
    user: req.session.user,
    pageCss: 'app', // Charge app.css
    pageJs: 'app' // Charge app.js
  });
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