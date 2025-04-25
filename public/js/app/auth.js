/**
 * Gestion de l'authentification et de l'état utilisateur
 */

// Variables globales
let userId = null;
let showTutorial = false;

/**
 * Initialise l'authentification et vérifie l'état de connexion
 */
function initAuth() {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token');
    
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tutorial') === 'true') {
        showTutorial = true;
    }
    
    // Si un token existe, vérifier l'authentification
    if (token) {
        // Mettre à jour l'interface
        document.querySelector('.wallet-not-connected').classList.add('hidden');
        document.querySelector('#section-collection').classList.remove('hidden');
        
        // Charger les informations de l'utilisateur
        fetchUserInfo();
    }
    
    // Connecter Wallet (pour la démo)
    document.querySelector('.connect-wallet').addEventListener('click', function() {
        // Simuler une connexion réussie
        setTimeout(() => {
            // Rediriger vers la page d'inscription
            window.location.href = '/register';
        }, 500);
    });
    
    // Menu utilisateur
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function(e) {
            const dropdownMenu = this.querySelector('.dropdown-menu');
            dropdownMenu.classList.toggle('show');
        });
        
        // Cliquer ailleurs pour fermer le menu
        document.addEventListener('click', function(e) {
            if (!userMenu.contains(e.target)) {
                userMenu.querySelector('.dropdown-menu').classList.remove('show');
            }
        });
    }
    
    // Déconnexion
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Supprimer le token
            localStorage.removeItem('token');
            
            // Rediriger vers la page d'accueil
            window.location.href = '/';
        });
    }
}

/**
 * Récupère les informations de l'utilisateur
 */
async function fetchUserInfo() {
    try {
        // Mettre à jour l'interface avec vérification
        const usernameElement = document.querySelector('.username');
        if (usernameElement) usernameElement.textContent = 'Joueur';
        
        const tokenAmountElement = document.querySelector('.token-amount');
        if (tokenAmountElement) tokenAmountElement.textContent = '100 $CCARD';
        
        const networkNameElement = document.querySelector('.network-name');
        if (networkNameElement) networkNameElement.textContent = 'Arbitrum Goerli';
        
        const networkStatusElement = document.querySelector('.network-status');
        if (networkStatusElement) networkStatusElement.classList.add('connected');
        
        // Charger les cartes de l'utilisateur
        await loadUserCards();
        
        // Si c'est un nouveau utilisateur, afficher le tutoriel
        if (showTutorial) {
            setTimeout(() => {
                document.getElementById('tutorial-welcome').style.display = 'flex';
            }, 1000);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
    }
}