/**
 * Service API pour la communication avec le backend
 * Gère toutes les requêtes HTTP vers l'API
 */
const apiService = {
    // URL de base de l'API
    baseUrl: '/api/v1',
    
    // Token JWT pour l'authentification
    token: null,
    
    // ID de l'utilisateur connecté
    userId: null,
    
    // Initialiser le service avec un token si disponible
    initialize() {
        this.token = localStorage.getItem('token');
        
        // Si un token est stocké, extraire l'ID utilisateur
        if (this.token) {
            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));
                this.userId = payload.id;
            } catch (error) {
                console.error('Erreur lors du décodage du token:', error);
            }
        }
    },
    
    // Définir le token JWT
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
        
        // Extraire l'ID utilisateur du token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.userId = payload.id;
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
        }
    },
    
    // Supprimer le token JWT
    clearToken() {
        this.token = null;
        this.userId = null;
        localStorage.removeItem('token');
    },
    
    // Obtenir l'ID de l'utilisateur connecté
    getUserId() {
        return this.userId;
    },
    
    // Obtenir les en-têtes d'authentification
    getAuthHeaders() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    },
    
    // Récupérer le profil de l'utilisateur
    async getUserProfile() {
        try {
            const response = await fetch(`${this.baseUrl}/users/me`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            throw error;
        }
    },
    
    // Mettre à jour le profil de l'utilisateur
    async updateUserProfile(data) {
        try {
            const response = await fetch(`${this.baseUrl}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            throw error;
        }
    },
    
    // Récupérer les cartes de l'utilisateur avec filtres et pagination
    async getUserCards(filters = {}) {
        try {
            // Construire les paramètres de requête
            const queryParams = new URLSearchParams();
            
            // Filtres
            if (filters.rarity && filters.rarity !== 'all') {
                queryParams.append('rarity', filters.rarity);
            }
            if (filters.search && filters.search.trim()) {
                queryParams.append('search', filters.search.trim());
            }
            if (filters.sale && filters.sale !== 'all') {
                if (filters.sale === 'for-sale') {
                    queryParams.append('isForSale', 'true');
                } else if (filters.sale === 'not-for-sale') {
                    queryParams.append('isForSale', 'false');
                }
            }
            
            // Tri
            if (filters.sortBy) {
                queryParams.append('sort', filters.sortBy);
            }
            if (filters.sortOrder) {
                queryParams.append('order', filters.sortOrder);
            }
            
            // Pagination
            if (filters.page) {
                queryParams.append('page', filters.page);
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit);
            }
            
            const url = `${this.baseUrl}/users/me/cards${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            console.log('[ApiService] Fetching cards with URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            const result = await response.json();
            console.log('[ApiService] Cards response:', result);
            
            return result;
        } catch (error) {
            console.error('Erreur lors de la récupération des cartes:', error);
            throw error;
        }
    },
    
    // Récupérer les détails d'une carte
    async getCardById(cardId) {
        try {
            const response = await fetch(`${this.baseUrl}/cards/${cardId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des détails de la carte:', error);
            throw error;
        }
    },
    
    // Mettre à jour une carte
    async updateCard(cardId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/users/me/cards/${cardId}/sale`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la carte:', error);
            throw error;
        }
    },
    
    // Transférer une carte à un autre utilisateur
    async transferCard(cardId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/cards/${cardId}/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du transfert de la carte:', error);
            throw error;
        }
    },
    
    // Récupérer les boosters de l'utilisateur
    async getUserBoosters() {
        try {
            const response = await fetch(`${this.baseUrl}/boosters`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des boosters:', error);
            throw error;
        }
    },
    
    // Acheter un booster
    async buyBooster(boosterType) {
        try {
            const response = await fetch(`${this.baseUrl}/boosters/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ boosterType })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'achat du booster:', error);
            throw error;
        }
    },
    
    // Ouvrir un booster
    async openBooster(boosterType) {
        try {
            const response = await fetch(`${this.baseUrl}/boosters/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ boosterType })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du booster:', error);
            throw error;
        }
    },
    
    // Acheter et ouvrir un booster automatiquement
    async buyAndOpenBooster(boosterType) {
        try {
            const response = await fetch(`${this.baseUrl}/boosters/buy-and-open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ boosterType })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'achat et ouverture du booster:', error);
            throw error;
        }
    },
    
    // Acheter un booster et créer les NFTs
    async buyBoosterAndMintNFTs(boosterType, walletAddress, transactionHash) {
        try {
            const response = await fetch(`${this.baseUrl}/boosters/buy-and-mint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    boosterType,
                    walletAddress,
                    transactionHash
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'achat et minting des cartes:', error);
            throw error;
        }
    },
    
    // Synchroniser les NFTs avec le backend
    async syncNFTsWithBackend(walletAddress, cardIds, transactionHash) {
        try {
            const response = await fetch(`${this.baseUrl}/blockchain/sync-nfts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    walletAddress,
                    cardIds,
                    transactionHash
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la synchronisation des NFTs:', error);
            throw error;
        }
    },
    
    // Obtenir un nonce pour la signature avec le wallet
    async getWalletNonce(walletAddress) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/wallet/nonce/${walletAddress}`, {
                method: 'GET'
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération du nonce:', error);
            throw error;
        }
    },
    
    // Connecter un wallet blockchain
    async connectWallet(walletAddress, signature) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/wallet/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: walletAddress,
                    signature
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la connexion du wallet:', error);
            throw error;
        }
    },
    
    // Vérifier si l'utilisateur est connecté
    isLoggedIn() {
        return !!this.token;
    }
};

// Initialiser le service au chargement
apiService.initialize();

// Exposer le service pour qu'il soit accessible par d'autres modules
window.apiService = apiService;