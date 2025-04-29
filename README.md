# EpicFactionCommunity - Application Web Node.js

Application web pour le jeu de cartes NFT EpicFactionCommunity, utilisant Node.js, Express et MongoDB.

## Description

EpicFactionCommunity est une plateforme de jeu de cartes à collectionner basée sur la blockchain. Cette application permet aux utilisateurs de collectionner, échanger et jouer avec des cartes NFT.

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
- http://localhost:3000/marketplace - Marketplace de cartes

### Initialiser la marketplace avec des données de test

Pour avoir des cartes à acheter/vendre sur la marketplace dès le départ, lancez le script d'initialisation :

```bash
npm run init-marketplace
```

Ce script va :
1. Créer un utilisateur administrateur (si ce n'est pas déjà fait)
2. Créer 10 cartes de test avec différentes raretés et statistiques
3. Mettre ces cartes en vente sur la marketplace
4. Générer quelques transactions fictives pour simuler un historique

Une fois le script exécuté, vous pourrez accéder à la marketplace et voir les cartes disponibles à l'achat.

### Fonctionnalités de la marketplace

La marketplace offre les fonctionnalités suivantes :

- **Parcourir les cartes** : Affichage de toutes les cartes en vente
- **Filtrer et rechercher** : Filtrer par nom, rareté et prix
- **Voir les détails** : Affichage détaillé des caractéristiques d'une carte
- **Acheter** : Possibilité d'acheter des cartes mises en vente
- **Vendre** : Mettre ses propres cartes en vente avec un prix personnalisé
- **Historique** : Consulter l'historique des transactions
- **Statistiques** : Voir les statistiques du marché

Pour plus d'informations sur la marketplace, consultez la [documentation dédiée](docs/marketplace.md).

## API REST

L'application expose également une API REST :

- `POST /auth/register` - Inscription d'un nouvel utilisateur
- `POST /auth/login` - Connexion d'un utilisateur existant
- `POST /auth/logout` - Déconnexion
- `POST /api/connect-wallet` - Connexion avec un wallet blockchain
- `GET /api/cards` - Récupérer la collection de cartes de l'utilisateur
- `GET /api/cards/:id` - Récupérer les détails d'une carte spécifique
- `GET /marketplace` - Récupérer les cartes disponibles sur le marché
- `GET /marketplace/card/:id` - Détails d'une carte sur le marché
- `POST /marketplace/api/buy` - Acheter une carte
- `POST /marketplace/api/sell` - Mettre une carte en vente
- `DELETE /marketplace/api/card/:cardId/listing` - Retirer une carte du marché

## Commandes npm

- `npm start` : Démarrer l'application en mode production
- `npm run dev` : Démarrer l'application en mode développement avec nodemon
- `npm run init-marketplace` : Initialiser la marketplace avec des données de test
- `npm test` : Exécuter les tests

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
