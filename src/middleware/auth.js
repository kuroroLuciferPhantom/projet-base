const jwt = require('jsonwebtoken');

// Middleware pour vérifier l'authentification via session pour les pages web
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Rediriger vers la page de connexion si non authentifié
  res.redirect('/login');
};

// Middleware pour vérifier l'authentification via JWT pour les API
exports.isAuthenticatedApi = (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé, token manquant' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé, token invalide' 
    });
  }
};