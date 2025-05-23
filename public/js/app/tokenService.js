/**
 * Service pour la gestion des tokens
 * Gère l'affichage et la mise à jour du solde de tokens dans la sidebar
 */
const tokenService = {
    // Cache du solde de tokens
    currentBalance: null,
    
    // Élément DOM pour afficher le solde
    balanceElement: null,
    
    // Initialiser le service
    initialize() {
        this.balanceElement = document.getElementById('user-token-balance');
        
        // Charger le solde initial si l'utilisateur est connecté
        if (apiService.isLoggedIn()) {
            this.refreshTokenBalance();
        }
        
        // Écouter les événements de mise à jour de tokens
        this.setupEventListeners();
    },
    
    // Configurer les écouteurs d'événements
    setupEventListeners() {
        // Écouter les événements personnalisés de mise à jour de solde
        document.addEventListener('tokenBalanceUpdated', (event) => {
            if (event.detail && event.detail.newBalance !== undefined) {
                this.updateBalanceDisplay(event.detail.newBalance);
            }
        });
        
        // Écouter les événements de connexion/déconnexion
        document.addEventListener('userLoggedIn', () => {
            this.refreshTokenBalance();
        });
        
        document.addEventListener('userLoggedOut', () => {
            this.currentBalance = null;
            this.updateBalanceDisplay(0);
        });
    },
    
    // Récupérer le solde de tokens depuis l'API
    async refreshTokenBalance() {
        try {
            // Utiliser l'endpoint spécifique pour le solde de tokens
            const response = await fetch('/api/v1/users/me/token-balance', {
                method: 'GET',
                headers: apiService.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success && data.tokenBalance !== undefined) {
                const newBalance = data.tokenBalance;
                this.currentBalance = newBalance;
                this.updateBalanceDisplay(newBalance);
            } else {
                console.warn('Impossible de récupérer le solde de tokens:', data.message);
                // Fallback vers getUserProfile si la route spécifique échoue
                this.fallbackToUserProfile();
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du solde de tokens:', error);
            // Fallback vers getUserProfile en cas d'erreur
            this.fallbackToUserProfile();
        }
    },
    
    // Méthode de fallback utilisant getUserProfile
    async fallbackToUserProfile() {
        try {
            const response = await apiService.getUserProfile();
            
            if (response.success && response.user) {
                const newBalance = response.user.tokenBalance || 0;
                this.currentBalance = newBalance;
                this.updateBalanceDisplay(newBalance);
            }
        } catch (error) {
            console.error('Erreur lors du fallback getUserProfile:', error);
        }
    },
    
    // Mettre à jour l'affichage du solde dans la sidebar
    updateBalanceDisplay(balance) {
        if (this.balanceElement) {
            // Mettre à jour le texte avec le nouveau solde
            this.balanceElement.textContent = `${balance} $EFC`;
            
            // Ajouter une animation de mise à jour si le solde a changé
            if (this.currentBalance !== null && this.currentBalance !== balance) {
                this.animateBalanceUpdate();
            }
            
            this.currentBalance = balance;
        }
    },
    
    // Animation lors de la mise à jour du solde
    animateBalanceUpdate() {
        if (this.balanceElement) {
            // Ajouter une classe d'animation
            this.balanceElement.classList.add('balance-updated');
            
            // Supprimer la classe après l'animation
            setTimeout(() => {
                this.balanceElement.classList.remove('balance-updated');
            }, 1000);
        }
    },
    
    // Obtenir le solde actuel en cache
    getCurrentBalance() {
        return this.currentBalance;
    },
    
    // Décrémenter le solde localement (pour une mise à jour immédiate avant confirmation serveur)
    decrementBalance(amount) {
        if (this.currentBalance !== null && this.currentBalance >= amount) {
            const newBalance = this.currentBalance - amount;
            this.updateBalanceDisplay(newBalance);
            return true;
        }
        return false;
    },
    
    // Incrémenter le solde localement
    incrementBalance(amount) {
        if (this.currentBalance !== null) {
            const newBalance = this.currentBalance + amount;
            this.updateBalanceDisplay(newBalance);
            return true;
        }
        return false;
    },
    
    // Vérifier si l'utilisateur a suffisamment de tokens
    hasEnoughTokens(amount) {
        return this.currentBalance !== null && this.currentBalance >= amount;
    },
    
    // Émettre un événement personnalisé pour notifier d'un changement de solde
    emitBalanceUpdate(newBalance) {
        const event = new CustomEvent('tokenBalanceUpdated', {
            detail: { newBalance }
        });
        document.dispatchEvent(event);
    },
    
    // Fonction utilitaire pour mettre à jour le solde après une transaction
    async updateBalanceAfterTransaction() {
        // Attendre un peu pour que la transaction soit confirmée côté serveur
        setTimeout(() => {
            this.refreshTokenBalance();
        }, 500);
    },
    
    // Fonction utilitaire pour formater l'affichage du solde
    formatBalance(balance) {
        if (balance >= 1000000) {
            return `${(balance / 1000000).toFixed(1)}M $EFC`;
        } else if (balance >= 1000) {
            return `${(balance / 1000).toFixed(1)}K $EFC`;
        } else {
            return `${balance} $EFC`;
        }
    }
};

// CSS pour l'animation de mise à jour du solde (à ajouter au CSS)
const tokenAnimationCSS = `
.token-amount.balance-updated {
    animation: balanceGlow 1s ease-in-out;
}

@keyframes balanceGlow {
    0% { 
        color: var(--color-yellow, #ffd700); 
        transform: scale(1);
    }
    50% { 
        color: var(--color-yellow, #ffd700); 
        transform: scale(1.05);
        text-shadow: 0 0 10px var(--color-yellow, #ffd700);
    }
    100% { 
        color: inherit; 
        transform: scale(1);
        text-shadow: none;
    }
}

.token-amount {
    transition: all 0.3s ease;
    font-weight: 600;
}
`;

// Ajouter le CSS d'animation
if (!document.querySelector('#token-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'token-animation-styles';
    style.textContent = tokenAnimationCSS;
    document.head.appendChild(style);
}

// Initialiser le service quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tokenService.initialize();
    });
} else {
    tokenService.initialize();
}

// Exposer le service pour qu'il soit accessible par d'autres modules
window.tokenService = tokenService;