/**
 * Service API
 * Gère toutes les communications avec le serveur API
 */
class ApiService {
  constructor() {
    this.baseUrl = '/api/v1';
    this.token = localStorage.getItem('token');
  }

  /**
   * Configure le token d'authentification
   * @param {string} token - Token JWT
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * Supprime le token d'authentification
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * Obtient les en-têtes pour les requêtes
   * @returns {Object} - En-têtes HTTP
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Traite la réponse de l'API
   * @param {Response} response - Réponse Fetch
   * @returns {Promise} - Données de l'API
   */
  async handleResponse(response) {
    const data = await response.json();

    // Si la réponse contient un token, le sauvegarder
    if (data.token) {
      this.setToken(data.token);
    }

    // Si la réponse est 401, supprimer le token et rediriger vers la page de connexion
    if (response.status === 401) {
      this.clearToken();
      
      // Ne rediriger que si on n'est pas déjà sur la page de connexion ou d'inscription
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }

    return data;
  }

  /**
   * Effectue une requête GET
   * @param {string} endpoint - Chemin de l'endpoint
   * @param {Object} params - Paramètres de requête (optionnel)
   * @returns {Promise} - Données de l'API
   */
  async get(endpoint, params = {}) {
    // Convertir les paramètres en query string
    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : '';

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}${queryString}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Error (GET):', error);
      throw error;
    }
  }

  /**
   * Effectue une requête POST
   * @param {string} endpoint - Chemin de l'endpoint
   * @param {Object} data - Données à envoyer
   * @returns {Promise} - Données de l'API
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Error (POST):', error);
      throw error;
    }
  }

  /**
   * Effectue une requête PUT
   * @param {string} endpoint - Chemin de l'endpoint
   * @param {Object} data - Données à envoyer
   * @returns {Promise} - Données de l'API
   */
  async put(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Error (PUT):', error);
      throw error;
    }
  }

  /**
   * Effectue une requête DELETE
   * @param {string} endpoint - Chemin de l'endpoint
   * @returns {Promise} - Données de l'API
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Error (DELETE):', error);
      throw error;
    }
  }

  // Services de carte
  
  /**
   * Récupère toutes les cartes
   * @param {Object} params - Paramètres de filtrage (optionnel)
   * @returns {Promise} - Liste des cartes
   */
  async getAllCards(params = {}) {
    return this.get('/cards', params);
  }

  /**
   * Récupère les détails d'une carte
   * @param {string} cardId - ID de la carte
   * @returns {Promise} - Détails de la carte
   */
  async getCardById(cardId) {
    return this.get(`/cards/${cardId}`);
  }

  /**
   * Récupère les cartes de l'utilisateur connecté
   * @returns {Promise} - Liste des cartes de l'utilisateur
   */
  async getUserCards() {
    return this.get('/users/me/cards');
  }

  // Services de marché
  
  /**
   * Récupère les cartes en vente sur le marché
   * @param {Object} params - Paramètres de filtrage (optionnel)
   * @returns {Promise} - Liste des cartes en vente
   */
  async getMarketListings(params = {}) {
    return this.get('/market', params);
  }

  /**
   * Achète une carte
   * @param {string} cardId - ID de la carte à acheter
   * @returns {Promise} - Résultat de la transaction
   */
  async buyCard(cardId) {
    return this.post('/market/transactions', { cardId });
  }

  /**
   * Met une carte en vente
   * @param {string} cardId - ID de la carte à vendre
   * @param {number} price - Prix de vente
   * @returns {Promise} - Résultat de la mise en vente
   */
  async sellCard(cardId, price) {
    return this.post('/market/sell', { cardId, price });
  }

  /**
   * Retire une carte du marché
   * @param {string} cardId - ID de la carte à retirer
   * @returns {Promise} - Résultat du retrait
   */
  async removeFromMarket(cardId) {
    return this.delete(`/market/cards/${cardId}/listing`);
  }

  // Services d'utilisateur
  
  /**
   * Récupère le profil de l'utilisateur connecté
   * @returns {Promise} - Données du profil
   */
  async getUserProfile() {
    return this.get('/users/me');
  }

  /**
   * Met à jour le profil de l'utilisateur
   * @param {Object} profileData - Données de profil à mettre à jour
   * @returns {Promise} - Profil mis à jour
   */
  async updateUserProfile(profileData) {
    return this.put('/users/me', profileData);
  }

  /**
   * Met à jour le statut du tutoriel
   * @param {boolean} completed - État d'achèvement du tutoriel
   * @returns {Promise} - Résultat de la mise à jour
   */
  async updateTutorialStatus(completed) {
    return this.put('/users/me/tutorial', { completed });
  }

  // Services d'authentification
  
  /**
   * Connecte un utilisateur avec son portefeuille
   * @param {string} address - Adresse du portefeuille
   * @param {string} signature - Signature du message
   * @returns {Promise} - Données de connexion
   */
  async connectWallet(address, signature) {
    return this.post('/auth/wallet/connect', { address, signature });
  }

  /**
   * Récupère un nonce pour la connexion par portefeuille
   * @param {string} address - Adresse du portefeuille
   * @returns {Promise} - Nonce à signer
   */
  async getWalletNonce(address) {
    return this.get(`/auth/wallet/nonce/${address}`);
  }

  // Services de boosters
  
  /**
   * Récupère les boosters de l'utilisateur
   * @returns {Promise} - Liste des boosters
   */
  async getUserBoosters() {
    return this.get('/boosters');
  }

  /**
   * Achète un booster
   * @param {string} boosterType - Type de booster
   * @returns {Promise} - Résultat de l'achat
   */
  async buyBooster(boosterType) {
    return this.post('/boosters/buy', { type: boosterType });
  }

  /**
   * Ouvre un booster
   * @param {string} boosterId - ID du booster à ouvrir
   * @returns {Promise} - Cartes obtenues
   */
  async openBooster(boosterId) {
    return this.post('/boosters/open', { boosterId });
  }

  // Statistiques
  
  /**
   * Récupère les statistiques générales
   * @returns {Promise} - Données statistiques
   */
  async getStats() {
    return this.get('/stats');
  }
}

// Créer une instance unique du service
const apiService = new ApiService();

// Exporter le service pour l'utiliser dans d'autres fichiers
window.apiService = apiService;