/**
 * Service de cache en mémoire pour l'application
 * Permet de mettre en cache des données fréquemment utilisées et de réduire les requêtes à la base de données
 */
const logger = require('./logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
    this.defaultTTL = 60 * 5; // 5 minutes en secondes
  }

  /**
   * Récupère une valeur du cache
   * @param {String} key - Clé de l'élément à récupérer
   * @returns {*} La valeur associée à la clé ou undefined si elle n'existe pas
   */
  get(key) {
    const cacheItem = this.cache.get(key);
    
    // Si l'élément n'existe pas dans le cache
    if (!cacheItem) {
      this.stats.misses++;
      return undefined;
    }
    
    // Si l'élément est expiré, le supprimer et retourner undefined
    if (cacheItem.expiresAt && cacheItem.expiresAt < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // Incrémenter le compteur de hits
    this.stats.hits++;
    
    return cacheItem.value;
  }

  /**
   * Met une valeur en cache
   * @param {String} key - Clé de l'élément à mettre en cache
   * @param {*} value - Valeur à mettre en cache
   * @param {Number} ttl - Durée de vie en secondes (time to live)
   * @returns {Boolean} true si l'opération a réussi
   */
  set(key, value, ttl = this.defaultTTL) {
    // Calculer la date d'expiration
    const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    
    // Stocker l'élément dans le cache
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
    
    // Mettre à jour les statistiques
    if (!this.cache.has(key)) {
      this.stats.keys++;
    }
    
    return true;
  }

  /**
   * Supprime une valeur du cache
   * @param {String} key - Clé de l'élément à supprimer
   * @returns {Boolean} true si l'élément a été supprimé, false sinon
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.keys--;
    }
    
    return deleted;
  }

  /**
   * Vide le cache
   * @returns {Boolean} true si l'opération a réussi
   */
  clear() {
    this.cache.clear();
    this.stats.keys = 0;
    return true;
  }

  /**
   * Retourne les statistiques d'utilisation du cache
   * @returns {Object} Statistiques du cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.stats.keys,
      size: this.cache.size,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }

  /**
   * Nettoie les entrées expirées du cache
   * @returns {Number} Nombre d'entrées supprimées
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cache: ${cleaned} entrée(s) expirée(s) supprimée(s)`);
    }
    
    return cleaned;
  }

  /**
   * Configure un nettoyage automatique périodique du cache
   * @param {Number} interval - Intervalle de nettoyage en secondes
   * @returns {NodeJS.Timeout} Référence du timer pour pouvoir l'annuler
   */
  startPeriodicCleanup(interval = 60) {
    // Nettoyer les entrées expirées périodiquement
    const timer = setInterval(() => {
      this.cleanExpired();
    }, interval * 1000);
    
    return timer;
  }

  /**
   * Crée un middleware Express pour mettre en cache les réponses API
   * @param {Number} ttl - Durée de vie en secondes
   * @returns {Function} Middleware Express
   */
  middleware(ttl = this.defaultTTL) {
    return (req, res, next) => {
      // Ne mettre en cache que les requêtes GET
      if (req.method !== 'GET') {
        return next();
      }
      
      // Générer une clé de cache basée sur l'URL et les paramètres de requête
      const key = `${req.originalUrl || req.url}`;
      
      // Vérifier si la réponse est dans le cache
      const cachedResponse = this.get(key);
      
      if (cachedResponse) {
        // Ajouter un en-tête pour indiquer que la réponse vient du cache
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cachedResponse);
      }
      
      // Si la réponse n'est pas dans le cache, stocker la méthode originale send
      const originalSend = res.json;
      
      // Remplacer la méthode send pour mettre en cache la réponse
      res.json = (body) => {
        // Ne mettre en cache que les réponses réussies
        if (res.statusCode === 200 || res.statusCode === 201) {
          this.set(key, body, ttl);
        }
        
        // Ajouter un en-tête pour indiquer que la réponse n'est pas mise en cache
        res.set('X-Cache', 'MISS');
        
        // Appeler la méthode originale send
        return originalSend.call(res, body);
      };
      
      next();
    };
  }
}

// Créer une instance du service de cache
const cacheService = new CacheService();

// Démarrer le nettoyage périodique (toutes les 5 minutes)
cacheService.startPeriodicCleanup(300);

module.exports = cacheService;