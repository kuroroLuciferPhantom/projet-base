const express = require('express');
const router = express.Router();

// Middleware d'authentification
const { isAuthenticated } = require('../middleware/auth');

// Page d'accueil
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'CryptoCards - Jeu de cartes à collectionner NFT',
    user: req.session.user || null
  });
});

// Page de l'application (nécessite authentification)
router.get('/app', isAuthenticated, (req, res) => {
  res.render('app', { 
    title: 'CryptoCards - Votre Collection',
    user: req.session.user
  });
});

// Page de connexion
router.get('/login', (req, res) => {
  // Rediriger vers l'app si déjà connecté
  if (req.session.user) {
    return res.redirect('/app');
  }
  
  res.render('login', { 
    title: 'CryptoCards - Connexion',
    user: null
  });
});

// Page d'inscription
router.get('/register', (req, res) => {
  // Rediriger vers l'app si déjà connecté
  if (req.session.user) {
    return res.redirect('/app');
  }
  
  res.render('register', { 
    title: 'CryptoCards - Inscription',
    user: null
  });
});

module.exports = router;