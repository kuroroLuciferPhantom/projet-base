# Intégration du système de tokens dynamique

## Vue d'ensemble

Cette mise à jour remplace l'affichage statique des tokens dans la sidebar par un système dynamique qui récupère les données depuis la base de données MongoDB.

## Modifications apportées

### 1. Backend (Node.js/Express)

#### Route `/app` modifiée
- **Fichier**: `src/routes/index.js`
- **Changement**: La route récupère maintenant les données utilisateur complètes depuis la BDD
- **Avantage**: L'affichage initial des tokens est correct dès le chargement de la page

#### Nouvelles routes API
- **Fichier**: `src/routes/api.js`
- **Nouvelle route**: `GET /api/v1/users/me/token-balance`
- **Fonctionnalité**: Endpoint léger pour récupérer uniquement le solde de tokens
- **Cache**: Mise en cache de 2 minutes pour optimiser les performances

### 2. Frontend (JavaScript)

#### Service tokenService
- **Fichier**: `public/js/app/tokenService.js`
- **Fonctionnalités**:
  - Récupération automatique du solde depuis l'API
  - Mise à jour en temps réel de l'affichage
  - Animation lors des changements de solde
  - Gestion des événements personnalisés
  - Fonctions utilitaires pour les transactions

#### Template EJS modifié
- **Fichier**: `src/views/app/partials/sidebar.ejs`
- **Changement**: Affichage dynamique basé sur `user.tokenBalance`
- **Fallback**: Affiche "0 $EFC" si l'utilisateur n'est pas chargé

## Utilisation

### Affichage automatique
Le solde de tokens s'affiche automatiquement au chargement de la page et se met à jour selon les besoins.

### Mise à jour programmatique
```javascript
// Rafraîchir le solde depuis l'API
await tokenService.refreshTokenBalance();

// Mettre à jour localement (mise à jour immédiate)
tokenService.incrementBalance(100); // Ajouter 100 tokens
tokenService.decrementBalance(50);  // Retirer 50 tokens

// Vérifier le solde
if (tokenService.hasEnoughTokens(200)) {
    // L'utilisateur a au moins 200 tokens
}

// Émettre un événement de mise à jour
tokenService.emitBalanceUpdate(newBalance);
```

### Événements personnalisés
```javascript
// Écouter les changements de solde
document.addEventListener('tokenBalanceUpdated', (event) => {
    console.log('Nouveau solde:', event.detail.newBalance);
});
```

## Avantages de cette approche

1. **Performance**: Cache côté serveur + requêtes légères
2. **UX**: Affichage correct dès le chargement + animations
3. **Maintenabilité**: Code modulaire et réutilisable
4. **Scalabilité**: Système d'événements pour l'intégration future
5. **Robustesse**: Système de fallback en cas d'erreur

## Intégration dans d'autres modules

### Shop/Marketplace
```javascript
// Avant un achat
if (!tokenService.hasEnoughTokens(price)) {
    alert('Solde insuffisant');
    return;
}

// Mise à jour immédiate (UX)
tokenService.decrementBalance(price);

// Après confirmation serveur
tokenService.updateBalanceAfterTransaction();
```

### Boosters
```javascript
// Après ouverture d'un booster récompensé
tokenService.incrementBalance(reward);
tokenService.updateBalanceAfterTransaction();
```

## Configuration

### Variables d'environnement
Aucune nouvelle variable requise - utilise la configuration MongoDB existante.

### Cache
Le cache est configuré pour 2 minutes sur l'endpoint token-balance. Modifiable dans `src/routes/api.js`:
```javascript
cacheService.middleware(120) // 120 secondes
```

## Dépannage

### Le solde ne s'affiche pas
1. Vérifier que l'utilisateur est bien connecté
2. Contrôler la console pour les erreurs API
3. Vérifier que `tokenService.js` est bien chargé

### Le solde ne se met pas à jour
1. Vérifier que l'API `/api/v1/users/me/token-balance` répond
2. Contrôler que `tokenService.refreshTokenBalance()` est appelé
3. Vérifier la validité du token JWT

### Problèmes de performance
1. Le cache API réduit les requêtes répétées
2. Le service utilise un cache local pour éviter les requêtes inutiles
3. Les animations sont optimisées avec CSS

## Évolutions futures

1. **WebSocket**: Mise à jour en temps réel pour les transactions
2. **Historique**: Tracking des changements de solde
3. **Notifications**: Alertes visuelles pour les gains/pertes
4. **Analytics**: Suivi de l'utilisation des tokens