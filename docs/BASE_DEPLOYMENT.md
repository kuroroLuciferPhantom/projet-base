# Déploiement des Smart Contracts sur Base

Ce document explique comment déployer les smart contracts EpicFactionCommunity sur la blockchain Base.

## Qu'est-ce que Base?

Base est une blockchain Layer 2 d'Ethereum créée par Coinbase, offrant des frais de transaction réduits et une compatibilité complète avec l'écosystème Ethereum.

## Prérequis

- Node.js v14 ou supérieur
- npm ou yarn
- Un compte Base avec des ETH pour les frais de gas (testnet ou mainnet)
- Une clé API Basescan pour la vérification des contrats

## Configuration

1. Créez un fichier `.env` à partir du template `.env.example` :

```bash
cp .env.example .env
```

2. Modifiez le fichier `.env` avec vos informations :

```
# Clé privée (sans le préfixe 0x)
PRIVATE_KEY=votre_cle_privee_sans_0x

# URLs RPC pour Base
BASE_GOERLI_URL=https://goerli.base.org
BASE_MAINNET_URL=https://mainnet.base.org

# Clé API Basescan pour la vérification des contrats
BASESCAN_API_KEY=votre_cle_api_basescan
```

## Déploiement

### Testnet (Base Goerli)

```bash
# Compiler les contrats
npx hardhat compile

# Déployer sur Base Goerli testnet
npx hardhat run scripts/deploy-to-base.js --network baseGoerli
```

### Mainnet (Base)

```bash
# Compiler les contrats
npx hardhat compile

# Déployer sur Base mainnet
npx hardhat run scripts/deploy-to-base.js --network baseMainnet
```

## Vérification des contrats

Après le déploiement, vous pouvez vérifier les contrats sur Basescan en utilisant les commandes fournies dans la sortie du script de déploiement :

```bash
# Vérifier EFCToken
npx hardhat verify --network baseGoerli ADRESSE_TOKEN SUPPLY_INITIALE

# Vérifier EFCCard
npx hardhat verify --network baseGoerli ADRESSE_CARD

# Vérifier EFCBooster
npx hardhat verify --network baseGoerli ADRESSE_BOOSTER ADRESSE_TOKEN ADRESSE_CARD BASE_URI
```

## Test des boosters

Après le déploiement, vous pouvez tester l'achat de boosters et la génération de NFTs :

```bash
# Tester sur Base Goerli
npx hardhat run scripts/test-booster-on-base.js --network baseGoerli
```

## Information sur les adresses déployées

Les adresses des contrats déployés sont automatiquement sauvegardées dans un fichier JSON :

- `deployed-contracts-baseGoerli.json` pour le testnet
- `deployed-contracts-baseMainnet.json` pour le mainnet

Vous pouvez utiliser ces fichiers pour configurer votre frontend et backend.

## Notes importantes

- Les contrats déployés sur Base sont compatibles avec l'écosystème Ethereum et peuvent être visualisés dans la plupart des interfaces Web3 prenant en charge Base.
- Base a généralement des frais de transaction (gas) moins élevés qu'Ethereum mainnet, ce qui le rend idéal pour des applications NFT comme EpicFactionCommunity.
- Pour obtenir des ETH de test sur Base Goerli, vous pouvez utiliser le faucet officiel: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Mise à jour des scripts du frontend

Après le déploiement sur Base, vous devez mettre à jour les scripts frontend pour pointer vers les contrats déployés sur Base. Modifiez le fichier `public/js/app/blockchainService.js` en remplaçant les adresses des contrats et en configurant le fournisseur RPC pour Base.

Exemple:

```javascript
// Configuration pour Base
const networks = {
    base: {
        chainId: '0x2105', // 8453 en hexadécimal pour Base Mainnet
        chainName: 'Base Mainnet',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org/']
    },
    baseGoerli: {
        chainId: '0x14a33', // 84531 en hexadécimal pour Base Goerli
        chainName: 'Base Goerli Testnet',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://goerli.base.org'],
        blockExplorerUrls: ['https://goerli.basescan.org/']
    }
};

// Adresses des smart contracts sur Base
const contractAddresses = {
    token: '0x...', // Adresse de EFCToken sur Base
    booster: '0x...', // Adresse de EFCBooster sur Base
    card: '0x...' // Adresse de EFCCard sur Base
};
```

## Intégration avec l'explorateur Basescan

Pour aider les utilisateurs à explorer leurs NFTs sur Base, ajoutez des liens vers Basescan dans l'interface utilisateur:

```javascript
// Fonction pour générer un lien Basescan pour un NFT
function getBasescanNftLink(tokenId) {
    const baseUrl = network === 'baseGoerli' 
        ? 'https://goerli.basescan.org/token' 
        : 'https://basescan.org/token';
    
    return `${baseUrl}/${contractAddresses.card}?a=${tokenId}`;
}
```

## Avantages de Base pour EpicFactionCommunity

1. **Frais réduits**: Les transactions sur Base coûtent beaucoup moins cher que sur Ethereum mainnet, ce qui est idéal pour un jeu de cartes NFT avec des transactions fréquentes.

2. **Sécurité Ethereum**: Base hérite de la sécurité d'Ethereum tout en offrant de meilleures performances.

3. **Écosystème Coinbase**: En tant que L2 de Coinbase, Base bénéficie d'une intégration étroite avec l'écosystème Coinbase, ce qui peut faciliter l'onboarding des utilisateurs.

4. **Compatibilité EVM**: Les contrats déployés sur Base sont entièrement compatibles avec les outils Ethereum existants.