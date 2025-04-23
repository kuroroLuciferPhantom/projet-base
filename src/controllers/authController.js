const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { isValidEthereumAddress, verifySignature, generateNonce, getSignMessage } = require('../utils/web3');

// Inscription traditionnelle (email/password)
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifications des données requises
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet email est déjà associé à un compte' 
      });
    }
    
    // Créer un nouvel utilisateur (mais nécessitera un wallet par la suite)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      walletAddress: null // Sera défini lors de la connexion wallet
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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Veuillez connecter votre wallet.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token,
      requiresWallet: true
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription' 
    });
  }
};

// Connexion traditionnelle (email/password)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
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
    
    // Vérifier si l'utilisateur a un wallet
    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez connecter un wallet pour accéder à votre compte',
        requiresWallet: true,
        userId: user._id
      });
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();
    
    // Créer une session utilisateur
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress
    };
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, walletAddress: user.walletAddress }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        completedTutorial: user.completedTutorial
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

// Obtenir un nonce pour signature wallet
exports.getNonce = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Valider l'adresse Ethereum
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse Ethereum invalide'
      });
    }
    
    // Vérifier si un utilisateur existe déjà avec cette adresse
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    
    if (!user) {
      // Générer un nouveau nonce
      const nonce = generateNonce();
      
      res.status(200).json({
        success: true,
        message: 'Nonce généré',
        nonce,
        signMessage: getSignMessage(nonce),
        userExists: false
      });
    } else {
      // Mettre à jour le nonce existant
      user.nonce = generateNonce();
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Nonce généré',
        nonce: user.nonce,
        signMessage: getSignMessage(user.nonce),
        userExists: true
      });
    }
  } catch (error) {
    console.error('Erreur lors de la génération du nonce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Connexion/inscription avec wallet
exports.connectWallet = async (req, res) => {
  try {
    const { address, signature, nonce, username } = req.body;
    
    // Valider l'adresse Ethereum
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse Ethereum invalide'
      });
    }
    
    // Valider la signature
    const signMessage = getSignMessage(nonce);
    const isValidSignature = await verifySignature(signMessage, signature, address);
    
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Signature invalide'
      });
    }
    
    // Vérifier si un utilisateur existe déjà avec cette adresse
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    
    if (!user) {
      // Si l'utilisateur n'existe pas, créer un nouveau compte
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Un nom d\'utilisateur est requis pour créer un compte'
        });
      }
      
      // Vérifier si le nom d'utilisateur est disponible
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà pris'
        });
      }
      
      // Créer un nouvel utilisateur
      user = new User({
        username,
        walletAddress: address.toLowerCase(),
        nonce: generateNonce() // Générer un nouveau nonce pour la prochaine connexion
      });
      
      await user.save();
    } else {
      // Si l'utilisateur existe, mettre à jour le nonce
      user.nonce = generateNonce();
      await user.save();
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();
    
    // Créer une session utilisateur
    req.session.user = {
      id: user._id,
      username: user.username,
      walletAddress: user.walletAddress
    };
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, walletAddress: user.walletAddress }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: user.completedTutorial ? 'Connexion réussie' : 'Compte créé avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email || null,
        walletAddress: user.walletAddress,
        newUser: !user.completedTutorial,
        completedTutorial: user.completedTutorial
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour le statut du tutoriel
exports.updateTutorialStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { completed } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Mettre à jour le statut du tutoriel
    user.completedTutorial = completed;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Statut du tutoriel mis à jour',
      completedTutorial: user.completedTutorial
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du tutoriel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};