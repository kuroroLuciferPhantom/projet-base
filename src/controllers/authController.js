const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Inscription
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet email est déjà associé à un compte' 
      });
    }
    
    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Créer une session utilisateur
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription' 
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Créer une session utilisateur
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion' 
    });
  }
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la déconnexion' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Déconnexion réussie' 
    });
  });
};

// Connexion wallet
exports.connectWallet = (req, res) => {
  try {
    const { address } = req.body;
    
    // Pour l'instant, on simule simplement la connexion du wallet
    // Dans une implémentation réelle, il faudrait vérifier la signature, etc.
    
    // On pourrait lier ce wallet à un compte utilisateur existant
    // ou créer un nouvel utilisateur si nécessaire
    
    res.status(200).json({
      success: true,
      message: 'Wallet connecté avec succès',
      wallet: {
        address,
        network: 'Arbitrum Goerli',
        connected: true
      }
    });
  } catch (error) {
    console.error('Erreur de connexion wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion du wallet' 
    });
  }
};