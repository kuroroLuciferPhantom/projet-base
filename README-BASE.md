# Intégration avec la blockchain Base

Cette branche ajoute le support pour déployer les smart contracts EpicFactionCommunity sur la blockchain [Base](https://base.org), un Layer 2 d'Ethereum créé par Coinbase.

## Modifications apportées

1. **Configuration Hardhat pour Base**: 
   - Ajout des réseaux Base Goerli (testnet) et Base Mainnet dans `hardhat.config.js`
   - Configuration de l'explorateur Basescan pour la vérification des contrats

2. **Scripts de déploiement**:
   - Nouveau script `deploy-to-base.js` optimisé pour Base
   - Script de test `test-booster-on-base.js` pour tester l'achat de boosters sur Base

3. **Variables d'environnement**:
   - Mise à jour du fichier `.env.example` avec les variables spécifiques à Base
   - Ajout des URLs RPC et des clés API pour Basescan

4. **Documentation**:
   - Ajout d'un guide détaillé pour le déploiement sur Base dans `docs/BASE_DEPLOYMENT.md`
   - Instructions pour la vérification des contrats sur Basescan

5. **Scripts npm**:
   - Nouvelles commandes pour faciliter le déploiement et les tests sur Base
   - Support pour la vérification des contrats sur les réseaux Base

## Comment utiliser

### Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement et le configurer
cp .env.example .env
# Éditer le fichier .env avec vos informations
```

### Déploiement sur Base Testnet

```bash
# Compiler les contrats
npm run compile

# Déployer sur Base Goerli Testnet
npm run deploy:base-goerli

# Tester les boosters sur Base Goerli
npm run test:booster-base
```

### Déploiement sur Base Mainnet

```bash
# Compiler les contrats
npm run compile

# Déployer sur Base Mainnet
npm run deploy:base-mainnet
```

### Vérification des contrats sur Basescan

```bash
# Vérifier un contrat sur Base Goerli
npm run verify:base-goerli -- ADRESSE_CONTRAT ARGUMENTS_CONSTRUCTEUR

# Exemple pour EFCToken
npm run verify:base-goerli -- 0x123... 1000000
```

## Avantages de Base pour EpicFactionCommunity

- **Frais réduits**: Les transactions sur Base coûtent significativement moins cher que sur Ethereum Mainnet
- **Vitesse de transaction**: Temps de confirmation plus rapides pour une meilleure expérience utilisateur
- **Sécurité Ethereum**: Base hérite de la sécurité d'Ethereum tout en améliorant les performances
- **Support de Coinbase**: Écosystème robuste soutenu par Coinbase

## Documentation complète

Pour plus d'informations sur l'intégration avec Base, consultez le document [BASE_DEPLOYMENT.md](docs/BASE_DEPLOYMENT.md).