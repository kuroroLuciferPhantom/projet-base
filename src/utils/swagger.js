/**
 * Configuration Swagger pour documenter l'API
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const packageInfo = require('../../package.json');

// Options de configuration Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Jeu de Cartes NFT',
      version: packageInfo.version,
      description: 'Documentation de l\'API pour le jeu de cartes NFT',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: packageInfo.author,
        url: 'https://github.com/kuroroLuciferPhantom/projet-base',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.votredomaine.com/api/v1',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Modèles de données pour la documentation
        Card: {
          type: 'object',
          required: ['name', 'rarity', 'type'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de la carte',
            },
            name: {
              type: 'string',
              description: 'Nom de la carte',
            },
            description: {
              type: 'string',
              description: 'Description de la carte',
            },
            image: {
              type: 'string',
              description: 'URL de l\'image de la carte',
            },
            rarity: {
              type: 'string',
              enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
              description: 'Rareté de la carte',
            },
            type: {
              type: 'string',
              description: 'Type de la carte',
            },
            stats: {
              type: 'object',
              description: 'Statistiques de la carte',
              properties: {
                attack: {
                  type: 'number',
                  description: 'Valeur d\'attaque de la carte',
                },
                defense: {
                  type: 'number',
                  description: 'Valeur de défense de la carte',
                },
                health: {
                  type: 'number',
                  description: 'Points de vie de la carte',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création de la carte',
            },
          },
        },
        User: {
          type: 'object',
          required: ['username', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de l\'utilisateur',
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur',
            },
            walletAddress: {
              type: 'string',
              description: 'Adresse du portefeuille blockchain',
            },
            avatar: {
              type: 'string',
              description: 'URL de l\'avatar de l\'utilisateur',
            },
            balance: {
              type: 'number',
              description: 'Solde de jetons de l\'utilisateur',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
            },
          },
        },
        PlayerCard: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de la carte du joueur',
            },
            card: {
              type: 'string',
              description: 'Référence à l\'ID de la carte de base',
            },
            owner: {
              type: 'string',
              description: 'Référence à l\'ID du propriétaire',
            },
            forSale: {
              type: 'boolean',
              description: 'Indique si la carte est à vendre',
            },
            price: {
              type: 'number',
              description: 'Prix de vente de la carte',
            },
            tokenId: {
              type: 'string',
              description: 'ID du jeton NFT associé',
            },
            level: {
              type: 'number',
              description: 'Niveau de la carte',
            },
            acquiredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date d\'acquisition de la carte',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de la transaction',
            },
            buyer: {
              type: 'string',
              description: 'Référence à l\'ID de l\'acheteur',
            },
            seller: {
              type: 'string',
              description: 'Référence à l\'ID du vendeur',
            },
            card: {
              type: 'string',
              description: 'Référence à l\'ID de la carte échangée',
            },
            price: {
              type: 'number',
              description: 'Prix de la transaction',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Date de la transaction',
            },
            txHash: {
              type: 'string',
              description: 'Hash de la transaction blockchain',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Description de l\'erreur',
                },
                status: {
                  type: 'number',
                  example: 400,
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Accès non autorisé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Authentification requise',
                  status: 401,
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Ressource non trouvée',
                  status: 404,
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  errors: {
                    type: 'object',
                    example: {
                      field1: 'Message d\'erreur pour le champ 1',
                      field2: 'Message d\'erreur pour le champ 2',
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Données invalides',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Erreur serveur',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Erreur interne du serveur',
                  status: 500,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'],
};

// Générer la spécification Swagger
const specs = swaggerJsdoc(options);

// Fonction pour configurer Swagger dans Express
const setupSwagger = (app) => {
  // Route pour la documentation Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API NFT Card Game Documentation',
  }));

  // Route pour le JSON de la spécification
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  return app;
};

module.exports = setupSwagger;