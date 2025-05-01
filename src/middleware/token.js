/**
 * Middleware pour gérer le token JWT
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Vérifie le token JWT et ajoute les informations d'utilisateur à la requête
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Vérifier si un token est présent dans les en-têtes, les cookies ou la session
    let token = null;
    
    // Chercher dans les en-têtes Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Si pas de token dans les en-têtes, chercher dans la session
    if (!token && req.session && req.session.token) {
      token = req.session.token;
    }
    
    // Si pas de token, passer au middleware suivant
    if (!token) {
      return next();
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Vérifier l'utilisateur dans la base de données
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next();
    }
    
    // Ajouter les informations à la requête
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    // En cas d'erreur de token, ne pas interrompre mais logger
    logger.debug('Erreur de vérification du token:', error.message);
    next();
  }
};

/**
 * Transmet le token et les informations utilisateur aux templates
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
exports.passTokenToViews = (req, res, next) => {
  // Transmettre les données utilisateur et token aux templates
  res.locals.user = req.user || null;
  res.locals.token = req.token || null;
  res.locals.isAuthenticated = !!req.user;
  
  next();
};

/**
 * Middleware complet pour la gestion des tokens
 * Combine la vérification et la transmission aux vues
 */
exports.tokenMiddleware = [
  exports.verifyToken,
  exports.passTokenToViews
];