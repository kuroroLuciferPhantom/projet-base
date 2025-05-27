/**
 * Service API
 * Gère toutes les communications avec le serveur API
 * Préparé pour l'intégration blockchain
 */
class ApiService {
  constructor() {
    this.baseUrl = '/api/v1';
    this.token = localStorage.getItem('token');
    this.userId = null; // ID de l'utilisateur connecté
    
    // Essayer de récupérer l'ID utilisateur depuis le token JWT
    if (this.token) {
      try {
        const tokenData = JSON.parse(atob(this.token.split('.')[1]));
        if (tokenData && tokenData.id) {
          this.userId = tokenData.id;
        }
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT:', error);
      }
    }
  }

  /**
   * Configure le token d'authentification
   * @param {string} token - Token JWT
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
    
    // Mettre à jour l'ID utilisateur
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData && tokenData.id) {
        this.userId = tokenData.id;
      }
    } catch (error) {
      console.error('Erreur lors du décodage du token JWT:', error);
    }
  }

  /**
   * Supprime le token d'authentification
   */
  clearToken() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('token');
  }

  /**
   * Retourne l'ID de l'utilisateur connecté
   * @returns {string|null} - ID de l'utilisateur
   */
  getUserId() {
    return this.userId;
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
  
  /**
   * Met à jour une carte
   * @param {string} cardId - ID de la carte
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise} - Carte mise à jour
   */
  async updateCard(cardId, data) {
    return this.put(`/cards/${cardId}`, data);
  }
  
  /**
   * Transfère une carte à un autre utilisateur/wallet
   * @param {string} cardId - ID de la carte
   * @param {Object} data - Données de transfert (toAddress, etc.)
   * @returns {Promise} - Résultat du transfert
   */
  async transferCard(cardId, data) {
    return this.post(`/cards/${cardId}/transfer`, data);
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
    return this.post('/market/buy', { cardId });
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
  
  /**
   * Synchronise l'état du wallet blockchain avec le backend
   * @param {string} address - Adresse du wallet
   * @param {Object} data - Données blockchain à synchroniser
   * @returns {Promise} - Résultat de la synchronisation
   */
  async syncBlockchainState(address, data) {
    return this.post(`/blockchain/sync/${address}`, data);
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
   * @param {number} quantity - Quantité (optionnel, défaut: 1)
   * @returns {Promise} - Résultat de l'achat
   */
  async buyBooster(boosterType, quantity = 1) {
    return this.post('/boosters/buy', { type: boosterType, quantity });
  }

  /**
   * Ouvre un booster
   * @param {string} boosterType - Type du booster à ouvrir
   * @returns {Promise} - Cartes obtenues
   */
  async openBooster(boosterType) {
    return this.post('/boosters/open', { boosterType });
  }

  // Statistiques
  
  /**
   * Récupère les statistiques générales
   * @returns {Promise} - Données statistiques
   */
  async getStats() {
    return this.get('/stats');
  }
  
  // Transactions blockchain
  
  /**
   * Enregistre une transaction blockchain
   * @param {Object} transaction - Données de la transaction
   * @returns {Promise} - Transaction enregistrée
   */
  async recordBlockchainTransaction(transaction) {
    return this.post('/blockchain/transactions', transaction);
  }
  
  /**
   * Vérifie le statut d'une transaction blockchain
   * @param {string} txHash - Hash de la transaction
   * @returns {Promise} - Statut de la transaction
   */
  async checkTransactionStatus(txHash) {
    return this.get(`/blockchain/transactions/${txHash}`);
  }
  
  /**
   * Récupère l'historique des transactions blockchain
   * @param {Object} params - Paramètres de filtrage (optionnel)
   * @returns {Promise} - Liste des transactions
   */
  async getBlockchainTransactions(params = {}) {
    return this.get('/blockchain/transactions', params);
  }
  
  /**
   * Récupère la configuration blockchain
   * @returns {Promise} - Configuration blockchain
   */
  async getBlockchainConfig() {
    return this.get('/blockchain/config');
  }
  
  /**
   * Vérifie si un NFT appartient à l'utilisateur
   * @param {string} tokenId - ID du token NFT
   * @returns {Promise} - Résultat de la vérification
   */
  async verifyNFTOwnership(tokenId) {
    return this.get(`/blockchain/nft/${tokenId}/verify`);
  }
  
  /**
   * Crée un NFT à partir d'une carte
   * @param {string} cardId - ID de la carte
   * @param {Object} metadata - Métadonnées du NFT
   * @returns {Promise} - Résultat de la création
   */
  async mintCardAsNFT(cardId, metadata) {
    return this.post(`/blockchain/nft/mint`, { cardId, metadata });
  }
  
  /**
   * Transfert un NFT de l'utilisateur vers une autre adresse
   * @param {string} tokenId - ID du token NFT
   * @param {string} toAddress - Adresse de destination
   * @returns {Promise} - Résultat du transfert
   */
  async transferNFT(tokenId, toAddress) {
    return this.post(`/blockchain/nft/${tokenId}/transfer`, { toAddress });
  }
  
  /**
   * Récupère les événements blockchain récents
   * @param {Object} params - Paramètres de filtrage (optionnel)
   * @returns {Promise} - Liste des événements
   */
  async getBlockchainEvents(params = {}) {
    return this.get('/blockchain/events', params);
  }
  
  /**
   * Récupère le solde de tokens de l'utilisateur sur la blockchain
   * @returns {Promise} - Solde de tokens
   */
  async getBlockchainTokenBalance() {
    return this.get('/blockchain/balance');
  }
  
  /**
   * Génère un rapport de réconciliation entre la base de données et la blockchain
   * @returns {Promise} - Rapport de réconciliation
   */
  async getBlockchainReconciliationReport() {
    return this.get('/blockchain/reconciliation');
  }
  
  /**
   * Achète des tokens avec de la cryptomonnaie
   * @param {number} amount - Montant de tokens à acheter
   * @param {string} paymentMethod - Méthode de paiement (eth, matic, etc.)
   * @returns {Promise} - Résultat de l'achat
   */
  async buyTokensWithCrypto(amount, paymentMethod = 'eth') {
    return this.post('/blockchain/tokens/buy', { amount, paymentMethod });
  }
  
  /**
   * Vend des tokens contre de la cryptomonnaie
   * @param {number} amount - Montant de tokens à vendre
   * @param {string} paymentMethod - Méthode de paiement (eth, matic, etc.)
   * @returns {Promise} - Résultat de la vente
   */
  async sellTokensForCrypto(amount, paymentMethod = 'eth') {
    return this.post('/blockchain/tokens/sell', { amount, paymentMethod });
  }
  
  /**
   * Récupère les taux de change actuels entre tokens et cryptomonnaies
   * @returns {Promise} - Taux de change
   */
  async getTokenExchangeRates() {
    return this.get('/blockchain/tokens/rates');
  }
  
  /**
   * Ajoute un nouveau réseau blockchain au wallet
   * @param {Object} networkParams - Paramètres du réseau
   * @returns {Promise} - Résultat de l'ajout
   */
  async addBlockchainNetwork(networkParams) {
    return this.post('/blockchain/networks', networkParams);
  }
  
  /**
   * Récupère la liste des réseaux blockchain supportés
   * @returns {Promise} - Liste des réseaux
   */
  async getSupportedNetworks() {
    return this.get('/blockchain/networks');
  }
  
  /**
   * Vérifie si le service blockchain est disponible
   * @returns {Promise} - Statut du service
   */
  async checkBlockchainServiceStatus() {
    return this.get('/blockchain/status');
  }
}

// Créer une instance unique du service
const apiService = new ApiService();

// Exporter le service pour l'utiliser dans d'autres fichiers
window.apiService = apiService;