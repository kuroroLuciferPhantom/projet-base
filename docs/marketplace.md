# Marketplace EpicFactionCommunity

Ce document présente la fonctionnalité de marketplace pour l'application EpicFactionCommunity, permettant aux utilisateurs d'acheter et de vendre leurs cartes NFT.

## Fonctionnalités

La marketplace EpicFactionCommunity offre les fonctionnalités suivantes :

- Affichage de toutes les cartes mises en vente
- Filtrage et recherche des cartes par nom, rareté et prix
- Tri des cartes par différents critères (prix, rareté, date, etc.)
- Affichage détaillé des cartes avec statistiques et historique des transactions
- Mise en vente de cartes avec définition personnalisée du prix
- Achat de cartes mises en vente
- Retrait de cartes du marché
- Historique complet des transactions
- Statistiques du marché (prix moyen, volume, distribution par rareté, etc.)

## Architecture

### Contrôleurs

Le cœur de la marketplace est géré par le fichier `src/controllers/marketController.js`, qui contient les fonctions suivantes :

- **getMarketCards** : Récupère les cartes en vente avec options de filtrage et pagination
- **getMarketCardDetails** : Affiche les détails d'une carte spécifique
- **buyCard** : Gère l'achat d'une carte
- **sellCard** : Gère la mise en vente d'une carte
- **removeFromMarket** : Retire une carte du marché
- **getMarketHistory** : Affiche l'historique des transactions
- **getMarketStats** : Calcule et affiche les statistiques du marché

### Routes

Les routes de la marketplace sont définies dans `src/routes/marketplace.js` :

```javascript
// Routes pour les vues
router.get('/', marketController.getMarketCards);
router.get('/card/:id', marketController.getMarketCardDetails);
router.get('/history', marketController.getMarketHistory);
router.get('/stats', marketController.getMarketStats);

// Routes API
router.post('/api/buy', isAuthenticatedApi, marketController.buyCard);
router.post('/api/sell', isAuthenticatedApi, marketController.sellCard);
router.delete('/api/card/:cardId/listing', isAuthenticatedApi, marketController.removeFromMarket);
```

### Vues

La marketplace utilise les vues EJS suivantes :

- **src/views/marketplace/index.ejs** : Page principale affichant toutes les cartes en vente
- **src/views/marketplace/details.ejs** : Page de détails d'une carte
- **src/views/marketplace/history.ejs** : Historique des transactions
- **src/views/marketplace/stats.ejs** : Statistiques du marché

### Ressources statiques

Les fichiers statiques suivants ont été créés pour la marketplace :

- **public/css/marketplace.css** : Styles spécifiques à la marketplace
- **public/js/marketplace.js** : Script JavaScript pour gérer les interactions utilisateur

## Utilisation

### Naviguer dans la marketplace

Accédez à la marketplace depuis le menu principal en cliquant sur "Marketplace". Sur la page principale, vous pouvez :

- Parcourir toutes les cartes en vente
- Utiliser les filtres pour affiner votre recherche
- Trier les cartes selon différents critères
- Consulter les statistiques ou l'historique des transactions en utilisant les liens en haut de la page

### Consulter une carte

Cliquez sur "Voir les détails" pour consulter les informations complètes d'une carte :

- Image et informations de base
- Statistiques détaillées (attaque, défense, magie, vitesse)
- Prix et statut de vente
- Informations sur le propriétaire
- Historique des transactions pour cette carte spécifique

### Acheter une carte

Pour acheter une carte :

1. Accédez à la page de détails de la carte souhaitée
2. Cliquez sur le bouton "Acheter pour X CRYP"
3. Confirmez votre achat dans la fenêtre de confirmation
4. Une notification de succès s'affichera si l'achat est réussi

Note : Vous devez être connecté et avoir suffisamment de jetons CRYP dans votre solde pour effectuer l'achat.

### Vendre une carte

Pour mettre en vente une de vos cartes :

1. Accédez à la page de détails de votre carte
2. Cliquez sur le bouton "Mettre en vente"
3. Définissez le prix souhaité dans la fenêtre modale
4. Confirmez en cliquant sur "Mettre en vente"
5. Votre carte sera immédiatement disponible sur le marché

### Retirer une carte du marché

Pour retirer une de vos cartes du marché :

1. Accédez à la page de détails de votre carte
2. Cliquez sur le bouton "Retirer du marché"
3. Confirmez dans la fenêtre de confirmation
4. Votre carte sera retirée du marché

### Consulter l'historique des transactions

La page d'historique (`/marketplace/history`) affiche :

- Un tableau de toutes les transactions effectuées sur le marché
- Des statistiques sur le volume des transactions
- Des informations sur chaque achat/vente (date, vendeur, acheteur, prix)

### Consulter les statistiques du marché

La page de statistiques (`/marketplace/stats`) propose :

- Des indicateurs clés (nombre de cartes en vente, prix moyen, etc.)
- La distribution des cartes par rareté
- Les gammes de prix
- Des conseils pour acheter/vendre au meilleur moment

## Modèles de données

La marketplace utilise principalement les modèles suivants :

### Card (Carte)

```javascript
{
  name: String,              // Nom de la carte
  description: String,       // Description
  rarity: String,            // Rareté (common, rare, epic, legendary)
  imageUrl: String,          // URL de l'image
  tokenId: String,           // ID unique du token NFT
  owner: ObjectId,           // Référence à l'utilisateur propriétaire
  stats: {                   // Statistiques de la carte
    attack: Number,
    defense: Number,
    magic: Number,
    speed: Number
  },
  isForSale: Boolean,        // Indique si la carte est en vente
  price: Number,             // Prix en tokens CRYP
  isPublic: Boolean,         // Visibilité publique
  createdAt: Date            // Date de création
}
```

### Transaction

```javascript
{
  card: ObjectId,            // Référence à la carte
  seller: ObjectId,          // Vendeur
  buyer: ObjectId,           // Acheteur
  price: Number,             // Prix de la transaction
  timestamp: Date            // Date de la transaction
}
```

## API REST

La marketplace expose les endpoints REST suivants :

### GET `/marketplace`
Affiche toutes les cartes en vente avec options de filtrage.

**Paramètres de requête :**
- `search` : Recherche par nom de carte
- `rarity` : Filtre par rareté
- `minPrice` : Prix minimum
- `maxPrice` : Prix maximum
- `sort` : Tri (price_asc, price_desc, newest, rarity, etc.)
- `page` : Numéro de page pour la pagination
- `limit` : Nombre d'éléments par page

### GET `/marketplace/card/:id`
Affiche les détails d'une carte spécifique.

### GET `/marketplace/history`
Affiche l'historique des transactions.

**Paramètres de requête :**
- `page` : Numéro de page pour la pagination
- `limit` : Nombre d'éléments par page

### GET `/marketplace/stats`
Affiche les statistiques du marché.

### POST `/marketplace/api/buy`
Achète une carte.

**Corps de la requête :**
```json
{
  "cardId": "id_de_la_carte"
}
```

### POST `/marketplace/api/sell`
Met une carte en vente.

**Corps de la requête :**
```json
{
  "cardId": "id_de_la_carte",
  "price": 100
}
```

### DELETE `/marketplace/api/card/:cardId/listing`
Retire une carte du marché.

## Sécurité

Toutes les actions d'achat et de vente sont protégées par le middleware d'authentification `isAuthenticatedApi`. Les utilisateurs doivent être connectés pour effectuer ces opérations.

Des vérifications sont effectuées pour s'assurer que :
- Seul le propriétaire d'une carte peut la mettre en vente ou la retirer du marché
- L'acheteur a suffisamment de fonds pour acheter une carte
- La carte est effectivement en vente lorsqu'un achat est tenté

## Développements futurs

Voici quelques idées d'améliorations futures pour la marketplace :

1. **Enchères** : Permettre aux utilisateurs de faire des enchères sur les cartes au lieu d'un prix fixe
2. **Offres** : Permettre aux utilisateurs de faire des offres aux propriétaires de cartes non mises en vente
3. **Collections** : Regrouper les cartes par collections thématiques
4. **Notifications** : Alerter les utilisateurs lorsqu'une carte qu'ils suivent est mise en vente
5. **Analyses avancées** : Fournir des graphiques d'évolution des prix sur le temps
6. **Recommandations** : Suggérer des cartes basées sur les préférences de l'utilisateur et son historique d'achat
7. **Verrouillage temporaire** : Empêcher les reventes immédiates pour éviter la spéculation excessive

## Dépannage

### Problèmes courants

1. **La carte n'apparaît pas sur le marché après la mise en vente**
   - Vérifiez que vous avez confirmé l'action dans la fenêtre modale
   - Assurez-vous que le prix défini est supérieur à 0

2. **Impossible d'acheter une carte**
   - Vérifiez que vous avez suffisamment de jetons CRYP dans votre solde
   - Assurez-vous que la carte est toujours en vente (elle a pu être achetée par quelqu'un d'autre)

3. **Les filtres ne fonctionnent pas correctement**
   - Essayez de réinitialiser tous les filtres et d'appliquer à nouveau ceux dont vous avez besoin
   - Vérifiez que vous n'avez pas défini des critères contradictoires

### Support

Pour tout problème persistant avec la marketplace, contactez le support à support@EpicFactionCommunity.com ou ouvrez un ticket sur le GitHub du projet.
