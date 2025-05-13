# Smart Contracts EpicFactionCommunity

Ce dossier contient les smart contracts pour le jeu de cartes à collectionner EpicFactionCommunity. Ces contrats permettent l'achat de boosters et la création de cartes NFT sur la blockchain.

## Architecture des contrats

Le système comporte trois contrats principaux:

1. **EFCToken.sol** - Un token ERC20 utilisé comme monnaie du jeu ($EFC)
2. **EFCCard.sol** - Un contrat ERC721 pour représenter les cartes comme NFTs
3. **EFCBooster.sol** - Un contrat qui gère l'achat de boosters et la génération aléatoire de cartes

## Prérequis

- Node.js v14 ou supérieur
- npm ou yarn
- Un réseau Ethereum (local ou testnet) pour le déploiement

## Installation

```bash
# Installer les dépendances
npm install
# ou
yarn install
```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes:

```
PRIVATE_KEY=votre_cle_privee_sans_0x
ARBITRUM_GOERLI_URL=https://goerli-rollup.arbitrum.io/rpc
ARBITRUM_URL=https://arb1.arbitrum.io/rpc
ARBISCAN_API_KEY=votre_cle_api_arbiscan
```

## Déploiement

### Réseau local (Hardhat)

Pour déployer les contrats sur un réseau local:

```bash
# Démarrer un nœud local
npx hardhat node

# Dans un autre terminal, déployer les contrats
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet (Arbitrum Goerli)

Pour déployer sur le testnet Arbitrum Goerli:

```bash
npx hardhat run scripts/deploy.js --network arbitrumGoerli
```

### Mainnet (Arbitrum One)

Pour déployer sur Arbitrum One:

```bash
npx hardhat run scripts/deploy.js --network arbitrumOne
```

## Test du système

Après avoir déployé les contrats, vous pouvez tester l'achat d'un booster et la création de cartes NFT:

```bash
npx hardhat run scripts/test-booster.js --network localhost
```

Ce script effectuera les opérations suivantes:
1. Vérifier le solde de tokens
2. Approuver les tokens pour l'achat
3. Acheter un booster
4. Récupérer les cartes générées
5. Afficher les détails des cartes NFT

## Interaction avec l'application

### Côté client

Pour interagir avec les contracts depuis le frontend, l'application utilise:
- `blockchainService.js`: Pour l'interaction avec les contrats via Web3/ethers.js
- `booster-nft.js`: Pour la gestion de l'achat de boosters et l'affichage des cartes NFT

### Côté serveur

Le backend synchronise les NFTs avec la base de données via:
- `boosterController.js`: Fonctions pour l'achat et la synchronisation des NFTs
- `api.js`: Routes API pour interagir avec la blockchain

## Adresses des contrats déployés

Après le déploiement, un fichier `deployed-contracts.json` est créé avec les adresses des contrats déployés. Utilisez ces adresses pour configurer l'application frontend et backend.

## Vérification des contrats

Pour vérifier les contrats sur Arbiscan (après déploiement sur Arbitrum):

```bash
npx hardhat verify --network arbitrumGoerli ADRESSE_DU_TOKEN SUPPLY_INITIALE
npx hardhat verify --network arbitrumGoerli ADRESSE_DU_CARD
npx hardhat verify --network arbitrumGoerli ADRESSE_DU_BOOSTER ADRESSE_DU_TOKEN ADRESSE_DU_CARD BASE_URI
```

## Intégration avec l'application web

Pour intégrer les contrats avec l'application web:

1. Copiez les adresses des contrats depuis `deployed-contracts.json`
2. Mettez à jour les variables d'environnement ou les fichiers de configuration de l'application
3. L'application pourra alors interagir avec les contrats pour acheter des boosters et créer des cartes NFT

## Notes de sécurité

- Les clés privées ne doivent jamais être exposées en production
- Utilisez un service comme Infura ou Alchemy pour les connexions RPC
- Implémentez un mécanisme de re-tentative pour les transactions qui échouent