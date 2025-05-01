/**
 * Service de journalisation (logging) pour l'application
 * Centralise la gestion des logs et offre plusieurs niveaux de journalisation
 */
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;

// Création du dossier de logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Format personnalisé pour les logs console
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0) {
    metaStr = JSON.stringify(metadata, null, 2);
  }
  
  return `[${timestamp}] ${level}: ${message} ${metaStr}`;
});

// Création du logger avec différents transports
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'api-server' },
  transports: [
    // Logs d'erreur dans un fichier séparé
    new transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Tous les logs dans un fichier combined
    new transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false
});

// Ajouter le transport console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Création d'un stream pour Morgan (middleware HTTP logger)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Méthode pour enregistrer les erreurs avec des détails supplémentaires
logger.logError = (error, req = null) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    }
  };

  // Ajouter des détails sur la requête si disponible
  if (req) {
    logData.request = {
      url: req.url,
      method: req.method,
      ip: req.ip,
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
      userId: req.user ? req.user.id : 'anonymous'
    };
  }

  logger.error(`Une erreur est survenue: ${error.message}`, logData);
};

// Méthode pour enregistrer les performances
logger.logPerformance = (label, duration, details = {}) => {
  logger.info(`Performance - ${label}: ${duration}ms`, { 
    type: 'performance', 
    duration, 
    ...details 
  });
};

// Méthode pour enregistrer les accès à l'API
logger.logApiAccess = (req, res, duration = null) => {
  const data = {
    type: 'api-access',
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
    userAgent: req.get('user-agent')
  };

  if (duration) {
    data.duration = `${duration}ms`;
  }

  logger.info(`API ${req.method} ${req.originalUrl} - ${res.statusCode}`, data);
};

// Méthode pour enregistrer les événements importants (achats, ventes, etc.)
logger.logBusinessEvent = (type, data = {}) => {
  logger.info(`Événement: ${type}`, { 
    type: 'business-event', 
    eventType: type, 
    ...data 
  });
};

// Méthode pour enregistrer les actions utilisateur
logger.logUserAction = (userId, action, details = {}) => {
  logger.info(`Action utilisateur: ${action}`, { 
    type: 'user-action', 
    userId, 
    action, 
    ...details 
  });
};

// Méthode pour enregistrer les transactions blockchain
logger.logBlockchainTx = (txHash, type, details = {}) => {
  logger.info(`Transaction blockchain: ${type}`, { 
    type: 'blockchain-tx', 
    txHash, 
    txType: type, 
    ...details 
  });
};

// Exporter le logger
module.exports = logger;