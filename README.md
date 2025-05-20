# EpicFactionCommunity - Smart Contracts

Ce projet contient les contrats intelligents pour le jeu de cartes NFT EpicFactionCommunity, déployables sur la blockchain Base.

## Mise à jour importante : Support de Base Sepolia

Base Goerli est en cours de dépréciation et sera remplacé par Base Sepolia. Ce dépôt a été mis à jour pour prendre en charge le déploiement sur Base Sepolia.

🔗 [Guide complet de migration de Base Goerli vers Base Sepolia](docs/MIGRATION_GUIDE.md)

## Technologies utilisées

- **Framework de développement** : Hardhat
- **Langage de contrat** : Solidity 0.8.19
- **Tests** : Mocha, Chai
- **Déploiement** : Scripts Hardhat personnalisés
- **Réseaux supportés** : 
  - Base Sepolia (testnet principal)
  - Base Goerli (déprécié)
  - Base Mainnet
  - Arbitrum Goerli
  - Arbitrum One

## Structure du projet

```
.
├── contracts/           # Contrats Solidity
│   ├── EFCCard.sol      # Contrat de cartes NFT
│   ├── EFCToken.sol     # Token ERC20 du jeu
│   └── EFCBooster.sol   # Gestion des boosters de cartes
├── scripts/             # Scripts de déploiement et tests
│   ├── deploy.js        # Déploiement sur Arbitrum
│   ├── deploy-to-base.js # Déploiement sur Base
│   ├── test-booster.js  # Test local des boosters
│   └── test-booster-on-base.js # Test des boosters sur Base
├── test/                # Tests automatisés
├── docs/                # Documentation
│   └── MIGRATION_GUIDE.md # Guide de migration vers Base Sepolia
├── examples/            # Exemples d'intégration
│   ├── dapp-example.js  # Exemple de dApp
│   └── dapp-example.html # Interface HTML pour l'exemple de dApp
├── .env.example         # Exemple de variables d'environnement
├── hardhat.config.js    # Configuration Hardhat
└── README.md
```

## Prérequis

- Node.js (v14 ou supérieur)
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
# Éditer le fichier .env avec vos propres valeurs, notamment:
# - Votre clé privée pour le déploiement
# - URLs RPC pour les réseaux
# - Clé API pour la vérification des contrats
```

## Configurations des réseaux

### Base Sepolia (Nouveau testnet)
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorateur de blocs**: https://sepolia.basescan.org

### Base Goerli (Déprécié)
- **Chain ID**: 84531
- **RPC URL**: https://goerli.base.org
- **Explorateur de blocs**: https://goerli.basescan.org

### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Explorateur de blocs**: https://basescan.org

## Déploiement

### Déployer sur Base Sepolia (Recommandé)

```bash
npm run deploy:base-sepolia
```

Cette commande va:
1. Déployer les trois contrats (EFCToken, EFCCard, EFCBooster) sur Base Sepolia
2. Configurer les permissions entre les contrats
3. Distribuer des tokens de test (uniquement sur le testnet)
4. Enregistrer les adresses des contrats dans un fichier `deployed-contracts-baseSepolia.json`

### Déployer sur Base Goerli (Déprécié)

```bash
npm run deploy:base-goerli
```

### Déployer sur Base Mainnet

```bash
npm run deploy:base-mainnet
```

## Tester les boosters

### Tester sur Base Sepolia

```bash
npm run test:booster-base-sepolia
```

Cette commande va:
1. Se connecter à Base Sepolia
2. Utiliser les contrats déployés
3. Acheter un booster avec des tokens EFC
4. Vérifier la génération des cartes NFT

### Tester localement

```bash
# Démarrer un nœud Hardhat local
npm run node

# Dans un nouveau terminal, déployer et tester sur le nœud local
npm run deploy:local
npm run test:booster
```

## Vérification des contrats

Après le déploiement, vous pouvez vérifier les contrats sur Basescan:

```bash
# Vérifier sur Base Sepolia
npm run verify:base-sepolia <ADRESSE_CONTRAT> [ARGUMENTS_CONSTRUCTEUR]

# Exemple pour EFCToken:
npm run verify:base-sepolia 0x123...abc 1000000

# Exemple pour EFCCard:
npm run verify:base-sepolia 0x456...def

# Exemple pour EFCBooster:
npm run verify:base-sepolia 0x789...ghi "0x123...abc" "0x456...def" "https://api.epicfactioncommunity.com/metadata/"
```

## Exemple de dApp

Un exemple de dApp est fourni pour vous aider à intégrer vos contrats avec une interface utilisateur:

1. Accédez au dossier examples:
```bash
cd examples
```

2. Ouvrez `dapp-example.html` dans votre navigateur
3. Modifiez `dapp-example.js` pour spécifier les adresses réelles de vos contrats déployés
4. Testez l'interaction avec vos contrats sur Base Sepolia

## Migration de Base Goerli vers Base Sepolia

Si vous avez déjà déployé vos contrats sur Base Goerli, suivez les instructions détaillées dans notre [Guide de Migration](docs/MIGRATION_GUIDE.md) pour migrer vers Base Sepolia.

Le guide couvre:
- Mise à jour de la configuration
- Obtention d'ETH de test sur Base Sepolia
- Déploiement des contrats
- Migration des applications frontales
- FAQ et ressources additionnelles

## Scripts NPM disponibles

- `npm run compile` - Compile les contrats
- `npm run test` - Exécute les tests
- `npm run deploy:local` - Déploie sur un nœud local
- `npm run deploy:base-sepolia` - Déploie sur Base Sepolia
- `npm run deploy:base-goerli` - Déploie sur Base Goerli (déprécié)
- `npm run deploy:base-mainnet` - Déploie sur Base Mainnet
- `npm run test:booster` - Teste les boosters localement
- `npm run test:booster-base-sepolia` - Teste les boosters sur Base Sepolia
- `npm run verify:base-sepolia` - Vérifie les contrats sur Basescan (Base Sepolia)

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.