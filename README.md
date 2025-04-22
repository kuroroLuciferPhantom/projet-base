# CryptoCards - Application Web Node.js

Application web pour le jeu de cartes NFT CryptoCards, utilisant Node.js, Express et MongoDB.

## Description

CryptoCards est une plateforme de jeu de cartes à collectionner basée sur la blockchain. Cette application permet aux utilisateurs de collectionner, échanger et jouer avec des cartes NFT.

## Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : MongoDB avec Mongoose
- **Templating** : EJS
- **Authentification** : JWT, bcrypt
- **Frontend** : HTML5, CSS3, JavaScript
- **Blockchain** : Web3.js pour l'intégration des wallets

## Structure du projet

```
.
├── node_modules/
├── public/            # Fichiers statiques
│   ├── css/
│   ├── img/
│   └── js/
├── src/
│   ├── controllers/   # Contrôleurs pour la logique métier
│   ├── models/        # Modèles Mongoose
│   ├── routes/        # Routes Express
│   ├── views/         # Templates EJS
│   │   ├── layouts/
│   │   └── partials/
│   ├── middleware/    # Middlewares Express
│   ├── utils/         # Utilitaires
│   ├── config/        # Configuration
│   └── app.js         # Point d'entrée de l'application
├── tests/             # Tests
├── .env               # Variables d'environnement
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB
- npm ou yarn

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/kuroroLuciferPhantom/projet-base.git
cd projet-base

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos propres valeurs

# Démarrer l'application en mode développement
npm run dev
```

## Utilisation

Une fois l'application démarrée, vous pouvez y accéder via :

- http://localhost:3000 - Page d'accueil
- http://localhost:3000/login - Page de connexion
- http://localhost:3000/register - Page d'inscription
- http://localhost:3000/app - Application principale (nécessite une authentification)

## API REST

L'application expose également une API REST :

- `POST /auth/register` - Inscription d'un nouvel utilisateur
- `POST /auth/login` - Connexion d'un utilisateur existant
- `POST /auth/logout` - Déconnexion
- `POST /api/connect-wallet` - Connexion avec un wallet blockchain
- `GET /api/cards` - Récupérer la collection de cartes de l'utilisateur
- `GET /api/cards/:id` - Récupérer les détails d'une carte spécifique
- `GET /api/market/cards` - Récupérer les cartes disponibles sur le marché
- `POST /api/market/buy` - Acheter une carte
- `POST /api/market/sell` - Mettre une carte en vente

## Commandes npm

- `npm start` : Démarrer l'application en mode production
- `npm run dev` : Démarrer l'application en mode développement avec nodemon
- `npm test` : Exécuter les tests

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
