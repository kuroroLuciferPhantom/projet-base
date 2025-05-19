# Guide de Migration de Base Goerli vers Base Sepolia

Ce document fournit des instructions détaillées pour migrer vos contrats et applications de Base Goerli (qui sera bientôt déprécié) vers Base Sepolia, le nouveau réseau de test officiel pour Base.

## Pourquoi migrer vers Base Sepolia?

Base Goerli utilise le réseau de test Goerli d'Ethereum comme couche 1, qui est en cours de dépréciation. Base Sepolia est le nouveau réseau de test officiel, basé sur Sepolia, qui est recommandé par la fondation Ethereum et continuera d'être maintenu.

## Étapes de migration

### 1. Mise à jour de l'environnement

#### Modification du fichier .env

Ajoutez la nouvelle URL RPC pour Base Sepolia dans votre fichier `.env`:

```
# URLs RPC pour les réseaux Base (testnet et mainnet)
BASE_SEPOLIA_URL=https://sepolia.base.org
BASE_GOERLI_URL=https://goerli.base.org
BASE_MAINNET_URL=https://mainnet.base.org
```

### 2. Mise à jour de la configuration Hardhat

Si vous utilisez Hardhat, ajoutez la configuration pour Base Sepolia dans votre fichier `hardhat.config.js`:

```javascript
networks: {
  // Configuration pour Base Sepolia (testnet)
  baseSepolia: {
    url: process.env.BASE_SEPOLIA_URL || "https://sepolia.base.org",
    accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    chainId: 84532,
    gasPrice: "auto",
    gas: "auto",
    timeout: 60000
  },
  // Autres configurations...
}
```

Dans la section `etherscan` de votre configuration, ajoutez également:

```javascript
etherscan: {
  apiKey: {
    // Pour vérifier les contrats sur Basescan
    baseSepolia: process.env.BASESCAN_API_KEY || "",
    // Autres configurations...
  },
  customChains: [
    {
      network: "baseSepolia",
      chainId: 84532,
      urls: {
        apiURL: "https://api-sepolia.basescan.org/api",
        browserURL: "https://sepolia.basescan.org"
      }
    },
    // Autres configurations...
  ]
}
```

### 3. Obtenir des ETH de test sur Base Sepolia

Pour interagir avec Base Sepolia, vous aurez besoin d'ETH de test. Voici comment en obtenir:

1. D'abord, obtenez des ETH sur le Sepolia Ethereum testnet depuis un faucet comme:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

2. Ensuite, utilisez le [Bridge officiel de Base](https://bridge.base.org/deposit) pour envoyer ces ETH de Sepolia vers Base Sepolia.

### 4. Déploiement des contrats sur Base Sepolia

Utilisez le script de déploiement mis à jour pour déployer vos contrats sur Base Sepolia:

```bash
npm run deploy:base-sepolia
```

Le script va:
1. Déployer tous vos contrats sur Base Sepolia
2. Configurer les interactions entre les contrats
3. Enregistrer les adresses des contrats déployés dans un fichier JSON

### 5. Vérification des contrats sur Basescan

Une fois les contrats déployés, vérifiez-les sur l'explorateur de blocs Base Sepolia:

```bash
npm run verify:base-sepolia <ADRESSE_CONTRAT> [ARGUMENTS_CONSTRUCTEUR]
```

### 6. Mise à jour des applications frontales

Si vous avez des applications frontales qui interagissent avec vos contrats, vous devrez mettre à jour leurs configurations:

#### Mises à jour des informations de réseau

```javascript
// Ancien réseau Base Goerli
const oldNetworkConfig = {
  chainId: '0x14A33', // 84531 en hexadécimal
  chainName: 'Base Goerli',
  rpcUrls: ['https://goerli.base.org'],
  blockExplorerUrls: ['https://goerli.basescan.org'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Nouveau réseau Base Sepolia
const newNetworkConfig = {
  chainId: '0x14A34', // 84532 en hexadécimal
  chainName: 'Base Sepolia',
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};
```

#### Mise à jour des adresses de contrats

Remplacez les adresses des contrats déployés sur Base Goerli par celles des contrats déployés sur Base Sepolia:

```javascript
// Adresses des contrats sur Base Sepolia (à remplacer par vos propres adresses)
const contractAddresses = {
  EFCToken: '0x123...abc',
  EFCCard: '0x456...def',
  EFCBooster: '0x789...ghi'
};
```

### 7. Tests après migration

Testez minutieusement votre application après la migration:

```bash
npm run test:booster-base-sepolia
```

Assurez-vous que toutes les fonctionnalités marchent comme prévu:
- Authentification
- Achat et vente de cartes
- Ouverture de boosters
- Transactions blockchain

## Différences techniques entre Base Goerli et Base Sepolia

- **Chain ID**: 
  - Base Goerli: 84531
  - Base Sepolia: 84532

- **RPC URL**:
  - Base Goerli: https://goerli.base.org
  - Base Sepolia: https://sepolia.base.org

- **Explorateur de blocs**:
  - Base Goerli: https://goerli.basescan.org
  - Base Sepolia: https://sepolia.basescan.org

## FAQ sur la migration

**Q: Dois-je migrer immédiatement de Base Goerli vers Base Sepolia?**

R: Base Goerli est en cours de dépréciation, donc il est recommandé de migrer dès que possible pour éviter des problèmes futurs.

**Q: Puis-je conserver mes applications sur Base Goerli pour l'instant?**

R: Oui, Base Goerli fonctionne toujours, mais il est recommandé de commencer à planifier votre migration car le réseau sera éventuellement désactivé.

**Q: Comment puis-je transférer mes NFTs et tokens de Base Goerli vers Base Sepolia?**

R: Il n'existe pas de pont direct entre Base Goerli et Base Sepolia. La meilleure approche est de redéployer vos contrats sur Base Sepolia et de recréer les données si nécessaire.

**Q: Les utilisateurs doivent-ils faire quelque chose pour utiliser mon application sur Base Sepolia?**

R: Oui, les utilisateurs devront:
1. Ajouter le réseau Base Sepolia à leur wallet (MetaMask, etc.)
2. Obtenir des ETH de test pour Base Sepolia
3. Interagir avec les nouveaux contrats déployés

## Ressources additionnelles

- [Documentation officielle de Base](https://docs.base.org)
- [Explorateur de blocs Base Sepolia](https://sepolia.basescan.org)
- [Bridge Base officiel](https://bridge.base.org)
- [Faucet Sepolia](https://sepoliafaucet.com/)

## Support

Si vous rencontrez des problèmes lors de la migration, n'hésitez pas à ouvrir une issue sur le dépôt GitHub du projet.
