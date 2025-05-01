/**
 * Middleware de validation des requêtes
 * Permet de valider les données entrantes selon des schémas définis
 */

// Fonction de validation générique
const validateRequest = (schema) => {
  return (req, res, next) => {
    // Si aucun schéma n'est fourni, passer au middleware suivant
    if (!schema) return next();

    // Déterminer quelles données valider en fonction de la méthode HTTP
    let dataToValidate = {};
    
    if (req.method === 'GET') {
      dataToValidate = req.query;
    } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      dataToValidate = req.body;
    }

    // Extraire les règles de validation pour ce schéma
    const rules = schema;
    const errors = {};

    // Vérifier chaque champ selon les règles
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = dataToValidate[field];

      // Vérifier si le champ est requis
      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `Le champ ${field} est requis`;
        return;
      }

      // Si la valeur est vide et le champ n'est pas requis, ne pas continuer la validation
      if (value === undefined || value === null || value === '') return;

      // Vérifier le type
      if (fieldRules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== fieldRules.type) {
          errors[field] = `Le champ ${field} doit être de type ${fieldRules.type}`;
          return;
        }
      }

      // Vérifier la longueur minimale (pour les chaînes et les tableaux)
      if (fieldRules.minLength !== undefined) {
        if ((typeof value === 'string' || Array.isArray(value)) && value.length < fieldRules.minLength) {
          errors[field] = `Le champ ${field} doit avoir au moins ${fieldRules.minLength} caractères`;
          return;
        }
      }

      // Vérifier la longueur maximale (pour les chaînes et les tableaux)
      if (fieldRules.maxLength !== undefined) {
        if ((typeof value === 'string' || Array.isArray(value)) && value.length > fieldRules.maxLength) {
          errors[field] = `Le champ ${field} doit avoir au maximum ${fieldRules.maxLength} caractères`;
          return;
        }
      }

      // Vérifier la valeur minimale (pour les nombres)
      if (fieldRules.min !== undefined && typeof value === 'number') {
        if (value < fieldRules.min) {
          errors[field] = `Le champ ${field} doit être supérieur ou égal à ${fieldRules.min}`;
          return;
        }
      }

      // Vérifier la valeur maximale (pour les nombres)
      if (fieldRules.max !== undefined && typeof value === 'number') {
        if (value > fieldRules.max) {
          errors[field] = `Le champ ${field} doit être inférieur ou égal à ${fieldRules.max}`;
          return;
        }
      }

      // Vérifier le format email
      if (fieldRules.isEmail && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field] = `Le champ ${field} doit être une adresse email valide`;
          return;
        }
      }

      // Vérifier les valeurs énumérées
      if (fieldRules.enum && Array.isArray(fieldRules.enum)) {
        if (!fieldRules.enum.includes(value)) {
          errors[field] = `Le champ ${field} doit être l'une des valeurs suivantes: ${fieldRules.enum.join(', ')}`;
          return;
        }
      }

      // Validation personnalisée
      if (fieldRules.custom && typeof fieldRules.custom === 'function') {
        const customValidationResult = fieldRules.custom(value, dataToValidate);
        if (customValidationResult !== true) {
          errors[field] = customValidationResult || `Le champ ${field} n'est pas valide`;
          return;
        }
      }
    });

    // S'il y a des erreurs, renvoyer une réponse avec les erreurs
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors,
        message: 'Données invalides'
      });
    }

    // Si tout est bon, passer au middleware suivant
    next();
  };
};

// Schémas de validation pour différentes routes
const schemas = {
  // Schéma pour la connexion
  login: {
    email: {
      required: true,
      type: 'string',
      isEmail: true
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6
    }
  },

  // Schéma pour l'inscription
  register: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 30
    },
    email: {
      required: true,
      type: 'string',
      isEmail: true
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6
    },
    confirmPassword: {
      required: true,
      type: 'string',
      custom: (value, data) => value === data.password || 'Les mots de passe ne correspondent pas'
    }
  },

  // Schéma pour la mise en vente d'une carte
  sellCard: {
    cardId: {
      required: true,
      type: 'string'
    },
    price: {
      required: true,
      type: 'number',
      min: 1
    }
  },

  // Schéma pour l'achat d'une carte
  buyCard: {
    cardId: {
      required: true,
      type: 'string'
    }
  },

  // Schéma pour l'ouverture d'un booster
  openBooster: {
    boosterId: {
      required: true,
      type: 'string'
    }
  },

  // Schéma pour la mise à jour du profil
  updateProfile: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 30
    },
    email: {
      type: 'string',
      isEmail: true
    },
    avatar: {
      type: 'string'
    }
  },

  // Schéma pour la recherche sur le marché
  marketSearch: {
    page: {
      type: 'number',
      min: 1
    },
    limit: {
      type: 'number',
      min: 1,
      max: 50
    },
    rarity: {
      type: 'string',
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
    },
    type: {
      type: 'string'
    },
    sortBy: {
      type: 'string',
      enum: ['price', 'name', 'rarity', 'createdAt']
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc']
    }
  }
};

// Exporter les fonctions de validation pour chaque schéma
module.exports = {
  validateLogin: validateRequest(schemas.login),
  validateRegister: validateRequest(schemas.register),
  validateSellCard: validateRequest(schemas.sellCard),
  validateBuyCard: validateRequest(schemas.buyCard),
  validateOpenBooster: validateRequest(schemas.openBooster),
  validateUpdateProfile: validateRequest(schemas.updateProfile),
  validateMarketSearch: validateRequest(schemas.marketSearch),
  validate: validateRequest // Pour créer de nouvelles validations sur mesure
};
