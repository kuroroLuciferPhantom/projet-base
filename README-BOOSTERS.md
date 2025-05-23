# 🎮 Système de Boosters - EpicFactionCommunity

Un système d'achat et d'ouverture de boosters complètement fonctionnel avec vérification des tokens, déduction automatique du solde, distribution des cartes et sauvegarde en base de données.

## 🚀 Fonctionnalités Implémentées

### ✅ Système d'Achat de Boosters
- **Vérification du solde** : Le système vérifie automatiquement si l'utilisateur a suffisamment de tokens
- **Déduction des tokens** : Soustraction automatique du montant lors de l'achat
- **4 types de boosters** disponibles :
  - **Common** (100 $EFC) : 5 cartes - 70% commune, 20% rare, 8% épique, 2% légendaire
  - **Rare** (250 $EFC) : 5 cartes - 55% commune, 25% rare, 15% épique, 5% légendaire
  - **Épique** (500 $EFC) : 7 cartes - 40% commune, 25% rare, 25% épique, 10% légendaire
  - **Légendaire** (1000 $EFC) : 7 cartes - 30% commune, 20% rare, 30% épique, 20% légendaire

### ✅ Système d'Ouverture de Boosters
- **Distribution aléatoire** selon les probabilités définies
- **Génération de cartes** avec statistiques complètes
- **Ajout automatique** à la collection du joueur
- **Interface d'ouverture** avec animations

### ✅ Distributeur Automatique
- **Booster aléatoire** pour 800 $EFC
- **Animations interactives** avec effets visuels
- **Modal "Vous êtes pauvre"** avec suggestions pour gagner des tokens

## 📁 Structure des Fichiers Modifiés/Créés

```
projet-base/
├── src/
│   ├── controllers/
│   │   └── boosterController.js     # ✅ Logique d'achat et ouverture des boosters
│   ├── models/
│   │   └── User.js                  # ✅ Modèle utilisateur avec tokens et boosters
│   ├── routes/
│   │   └── api.js                   # ✅ Routes API pour les boosters
│   ├── views/app/partials/
│   │   └── shop.ejs                 # ✅ Interface de la boutique
│   └── initDatabase.js              # ✅ Script d'initialisation des cartes
├── public/
│   ├── js/app/
│   │   └── shop.js                  # ✅ JavaScript frontend pour la boutique
│   └── css/
│       └── shop.css                 # ✅ Styles pour la boutique
└── README-BOOSTERS.md              # ✅ Ce fichier
```

## 🛠️ Installation et Configuration

### 1. Initialiser la Base de Données

```bash
# Lancer le script d'initialisation
node src/initDatabase.js

# Ou avec force (supprime les données existantes)
node src/initDatabase.js --force
```

Ce script va :
- Créer 20 cartes de démonstration (8 communes, 6 rares, 4 épiques, 2 légendaires)
- Donner 500 tokens et 2 boosters gratuits aux utilisateurs existants
- Afficher les statistiques de la base de données

### 2. Vérifier les Routes API

Les routes suivantes sont disponibles :

```
GET    /api/v1/users/me              # Profil utilisateur avec solde
GET    /api/v1/boosters              # Boosters possédés
POST   /api/v1/boosters/buy          # Acheter un booster
POST   /api/v1/boosters/open         # Ouvrir un booster
GET    /api/v1/boosters/config       # Configuration des boosters
```

## 🎯 Comment Tester le Système

### 1. **Connexion et Navigation**
```bash
# Démarrer le serveur
npm start

# Aller sur http://localhost:3000
# Se connecter avec un compte utilisateur
# Naviguer vers la section "Shop"
```

### 2. **Test d'Achat de Booster**
- Vérifier votre solde de tokens (affiché en haut)
- Cliquer sur "Acheter" pour un booster
- Vérifier que les tokens sont déduits
- Le booster est ajouté à votre inventaire

### 3. **Test d'Ouverture de Booster**
- Après l'achat, une modal s'ouvre automatiquement
- Cliquer sur "Ouvrir le Booster"
- Voir l'animation et les cartes obtenues
- Les cartes sont ajoutées à votre collection

### 4. **Test du Distributeur Automatique**
- Cliquer sur le bouton rouge du distributeur
- Si vous n'avez pas assez de tokens → Modal "Vous êtes pauvre"
- Sinon → Animation + booster aléatoire

## 📊 API Endpoints Détaillés

### POST /api/v1/boosters/buy
```json
{
  "boosterType": "common|rare|epic|legendary",
  "quantity": 1
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "1 booster(s) Booster Common acheté(s) avec succès",
  "boosters": {
    "common": 3,
    "rare": 0,
    "epic": 0,
    "legendary": 0
  },
  "tokenBalance": 400,
  "transaction": {
    "id": "...",
    "amount": 100,
    "type": "common",
    "quantity": 1
  }
}
```

### POST /api/v1/boosters/open
```json
{
  "boosterType": "common"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Booster common ouvert avec succès",
  "cards": [
    {
      "id": "...",
      "gameCard": {
        "name": "Gobelin Guerrier",
        "rarity": "common",
        "stats": { "attack": 25, "defense": 20, "magic": 5, "speed": 30 },
        "imageUrl": "/img/cards/gobelin-guerrier.jpg"
      }
    }
    // ... 4 autres cartes
  ],
  "remainingBoosters": 2
}
```

## 🔧 Configuration des Boosters

Les prix et probabilités sont configurés dans `boosterController.js` :

```javascript
const BOOSTER_CONFIG = {
  common: {
    name: 'Booster Common',
    price: 100,
    cardCount: 5,
    probabilities: {
      common: 0.70,
      rare: 0.20,
      epic: 0.08,
      legendary: 0.02
    }
  },
  // ... autres configurations
};
```

## 🎨 Personnalisation de l'Interface

### Modifier les Styles
Éditez `public/css/shop.css` pour personnaliser :
- Couleurs des cartes par rareté
- Animations du distributeur
- Effets de notifications

### Ajouter des Animations
Dans `public/js/app/shop.js`, vous pouvez modifier :
- Durée des animations d'ouverture
- Effets du distributeur automatique
- Transitions entre les états

## 🐛 Résolution de Problèmes

### Problème : "Vous n'avez pas de booster de type X"
**Solution :** Vérifiez que l'utilisateur a bien acheté le booster avant d'essayer de l'ouvrir.

### Problème : "Erreur lors de la génération des cartes"
**Solution :** Lancez `node src/initDatabase.js` pour créer les cartes de démonstration.

### Problème : Solde de tokens non mis à jour
**Solution :** Vérifiez que l'API retourne le nouveau solde et que le frontend l'affiche correctement.

## 🔮 Fonctionnalités Futures

- [ ] **Système d'enchères** pour les boosters rares
- [ ] **Boosters saisonniers** avec cartes limitées
- [ ] **Packs spéciaux** avec garanties de cartes rares
- [ ] **Intégration blockchain** pour les NFT (préparé dans le code)
- [ ] **Système de craft** pour combiner des cartes
- [ ] **Marketplace** pour échanger des boosters entre joueurs

## 📈 Statistiques et Analytics

Le système enregistre automatiquement :
- Historique des achats de boosters
- Types de cartes obtenues
- Revenus générés par type de booster
- Fréquence d'utilisation du distributeur

Pour voir les statistiques :
```bash
node src/initDatabase.js
# Affiche un résumé des données
```

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. **Nouvelles cartes** : Modifier `demoCards` dans `initDatabase.js`
2. **Nouveaux types de boosters** : Ajouter dans `BOOSTER_CONFIG`
3. **Nouvelles animations** : Modifier `shop.js` et `shop.css`
4. **Nouvelles routes API** : Ajouter dans `api.js` et `boosterController.js`

---

🎉 **Le système de boosters est maintenant complètement fonctionnel !** 

Votre plateforme de jeu de cartes NFT dispose d'un système économique robuste où les joueurs peuvent acheter des boosters avec leurs tokens, les ouvrir pour obtenir des cartes aléatoires, et voir leur collection s'enrichir automatiquement.
