const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const expressLayouts = require('express-ejs-layouts');
const logger = require('./utils/logger');
const setupSwagger = require('./utils/swagger');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données MongoDB
connectDB();

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la sécurité et des middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://placehold.co"],
      connectSrc: ["'self'", "https://api.etherscan.io"]
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utilisation de morgan avec notre logger
app.use(morgan('combined', { stream: logger.stream }));

// Middleware pour la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-temporaire',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Configuration des vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuration du layout EJS
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware pour mesurer les performances
app.use((req, res, next) => {
  const start = Date.now();
  
  // Fonction à exécuter après que la réponse soit envoyée au client
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logApiAccess(req, res, duration);
    
    // Log des performances si la requête est lente (plus de 1000ms)
    if (duration > 1000) {
      logger.logPerformance(req.originalUrl, duration, {
        method: req.method,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
});

// Configuration de Swagger
setupSwagger(app);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Route spéciale pour rediriger /market vers /marketplace
app.get('/market', (req, res) => {
  res.redirect('/marketplace');
});

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/marketplace', require('./routes/marketplace')); // Routes de la marketplace

// Middleware de gestion des erreurs
app.use((req, res, next) => {
  const error = new Error('Page non trouvée');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  // Journaliser l'erreur
  logger.logError(err, req);
  
  // Définir le statut de la réponse
  res.status(err.status || 500);
  
  // Si c'est une requête API, renvoyer une erreur JSON
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.json({
      success: false,
      error: {
        message: err.message,
        status: err.status
      }
    });
  }
  
  // Sinon, afficher un message d'erreur simple
  res.send(`<h1>Erreur ${err.status || 500}</h1><p>${err.message}</p>`);
});

// Démarrer le serveur
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
  logger.info(`Documentation API disponible sur http://localhost:${PORT}/api/docs`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Erreur non capturée:', { error: error.stack });
  // Arrêter le processus en cas d'erreur critique
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée:', { 
    reason: reason, 
    promise: promise 
  });
});

module.exports = app;