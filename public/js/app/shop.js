/**
 * Gestion de la boutique et des achats de boosters
 */

// Configuration des types de boosters et leurs caractéristiques
const BOOSTER_TYPES = {
    'standard': {
        name: 'Booster Standard',
        price: 500,
        cardCount: 5,
        rarities: {
            common: 0.70,
            rare: 0.20,
            epic: 0.08,
            legendary: 0.02
        }
    },
    'premium': {
        name: 'Booster Premium',
        price: 1200,
        cardCount: 5,
        rarities: {
            common: 0.55,
            rare: 0.25,
            epic: 0.15,
            legendary: 0.05
        }
    },
    'ultimate': {
        name: 'Booster Ultimate',
        price: 2500,
        cardCount: 7,
        rarities: {
            common: 0.40,
            rare: 0.25,
            epic: 0.25,
            legendary: 0.10
        }
    },
    'ultimate-pack': {
        name: 'Pack Ultimate (3 boosters)',
        price: 6375,
        isBundle: true,
        contains: ['ultimate', 'ultimate', 'ultimate']
    },
    'random': {
        name: 'Booster Aléatoire',
        price: 800,
        isRandom: true,
        possibleTypes: ['standard', 'premium', 'ultimate'],
        weights: [0.7, 0.25, 0.05]
    }
};

// Initialisation des variables globales
let userBalance = 1000; // Solde utilisateur simulé (à remplacer par une requête API)
let distributeurAnimating = false; // Pour éviter les clics multiples

// Au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les gestionnaires d'événements pour les boutons d'achat
    initShopEvents();
    
    // Mettre à jour l'affichage du solde de l'utilisateur
    updateUserBalance();
});

/**
 * Initialise les événements de la boutique
 */
function initShopEvents() {
    // Boutons d'achat de boosters
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo');
    buyButtons.forEach(button => {
        button.addEventListener('click', handleBoosterPurchase);
    });
    
    // Bouton du distributeur automatique
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        distributeurBtn.addEventListener('click', handleDistributeurClick);
    }
    
    // Masquer les notifications lorsqu'on clique dessus
    const notifications = document.querySelectorAll('.purchase-notification');
    notifications.forEach(notification => {
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    });
}

/**
 * Gestionnaire pour l'achat de booster
 */
function handleBoosterPurchase() {
    const boosterType = this.getAttribute('data-booster-type');
    const boosterPrice = parseInt(this.getAttribute('data-booster-price'));
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        showErrorNotification("Vous n'avez pas assez de tokens pour cet achat.");
        return;
    }
    
    // Simuler l'achat (dans une implémentation réelle, cela serait une requête API)
    userBalance -= boosterPrice;
    updateUserBalance();
    
    // Afficher la notification d'achat réussi
    const booster = BOOSTER_TYPES[boosterType];
    showSuccessNotification(booster.name);
    
    // Si c'est un pack/bundle, traiter chaque booster individuellement
    if (booster.isBundle) {
        // Dans une implémentation réelle, on enverrait les boosters au serveur
        console.log(`Achat réussi de ${booster.name} contenant ${booster.contains.length} boosters.`);
        
        // Pour la démo, ouvrir un booster après un délai (simuler le serveur)
        setTimeout(() => {
            // Ouvrir le premier booster du pack
            openBoosterModal(booster.contains[0]);
        }, 1500);
    } else {
        // Pour un booster simple, ouvrir directement la modale d'ouverture
        setTimeout(() => {
            openBoosterModal(boosterType);
        }, 1500);
    }
}

/**
 * Gestionnaire pour le clic sur le distributeur automatique
 */
function handleDistributeurClick() {
    // Éviter les clics multiples pendant l'animation
    if (distributeurAnimating) return;
    
    // Prix du distributeur aléatoire
    const boosterPrice = BOOSTER_TYPES['random'].price;
    
    // Vérifier si l'utilisateur a assez de tokens
    if (userBalance < boosterPrice) {
        showErrorNotification("Vous n'avez pas assez de tokens pour utiliser le distributeur.");
        return;
    }
    
    // Marquer le début de l'animation
    distributeurAnimating = true;
    
    // Animation du distributeur
    const distributeur = document.querySelector('.distributeur');
    const bouton = document.querySelector('.bouton');
    
    // Ajouter des classes d'animation
    distributeur.classList.add('active');
    bouton.classList.add('pressed');
    
    // Simuler l'achat (dans une implémentation réelle, cela serait une requête API)
    userBalance -= boosterPrice;
    updateUserBalance();
    
    // Afficher la notification d'achat réussi
    showSuccessNotification(BOOSTER_TYPES['random'].name);
    
    // Simuler le processus aléatoire
    setTimeout(() => {
        // Déterminer quel type de booster l'utilisateur obtient
        const randomBoosterType = getRandomBoosterType();
        
        // Afficher à l'utilisateur ce qu'il a obtenu
        const randomBooster = BOOSTER_TYPES[randomBoosterType];
        showSuccessNotification(`Vous avez obtenu un ${randomBooster.name} !`);
        
        // Ouvrir la modale d'ouverture pour ce booster
        setTimeout(() => {
            // Réinitialiser l'animation
            distributeur.classList.remove('active');
            bouton.classList.remove('pressed');
            distributeurAnimating = false;
            
            // Ouvrir le booster obtenu
            openBoosterModal(randomBoosterType);
        }, 1000);
    }, 3000);
}

/**
 * Détermine aléatoirement le type de booster à donner
 */
function getRandomBoosterType() {
    const randomConfig = BOOSTER_TYPES['random'];
    const types = randomConfig.possibleTypes;
    const weights = randomConfig.weights;
    
    // Calculer la somme des poids
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Générer un nombre aléatoire entre 0 et la somme des poids
    const random = Math.random() * totalWeight;
    
    // Déterminer le type en fonction de ce nombre
    let cumulativeWeight = 0;
    for (let i = 0; i < types.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
            return types[i];
        }
    }
    
    // Fallback sur le premier type
    return types[0];
}

/**
 * Ouvre la modale d'ouverture de booster
 */
function openBoosterModal(boosterType) {
    // Récupérer les détails du booster
    const booster = BOOSTER_TYPES[boosterType];
    
    // Mettre à jour l'image du booster dans la modale
    const boosterImg = document.getElementById('booster-pack-img');
    boosterImg.src = `/img/booster-${boosterType}.svg`;
    boosterImg.alt = booster.name;
    boosterImg.classList.remove('hidden', 'opening');
    
    // Réinitialiser l'état de la modale
    document.querySelector('.cards-reveal').classList.add('hidden');
    document.getElementById('continue-btn').classList.add('hidden');
    document.getElementById('open-booster-btn').classList.remove('hidden');
    
    // Afficher la modale
    const modal = document.getElementById('booster-opening-modal');
    modal.style.display = 'flex';
    
    // Ajouter des données spécifiques au booster à la modale
    document.getElementById('open-booster-btn').setAttribute('data-booster-type', boosterType);
}

/**
 * Affiche une notification de succès
 */
function showSuccessNotification(boosterName) {
    const notification = document.getElementById('purchase-notification');
    document.getElementById('purchased-booster-type').textContent = boosterName;
    notification.classList.add('show');
    
    // Masquer la notification après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

/**
 * Affiche une notification d'erreur
 */
function showErrorNotification(message) {
    const notification = document.getElementById('error-notification');
    document.getElementById('error-message').textContent = message;
    notification.classList.add('show');
    
    // Masquer la notification après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

/**
 * Met à jour l'affichage du solde utilisateur
 */
function updateUserBalance() {
    // Mettre à jour l'affichage du solde dans la boutique
    const balanceElements = document.querySelectorAll('.balance-amount');
    balanceElements.forEach(element => {
        element.textContent = userBalance;
    });
    
    // Mettre à jour l'affichage du solde dans la sidebar
    const sidebarTokenAmount = document.querySelector('.token-amount');
    if (sidebarTokenAmount) {
        sidebarTokenAmount.textContent = `${userBalance} $CCARD`;
    }
    
    // Désactiver les boutons si le solde est insuffisant
    const buyButtons = document.querySelectorAll('.btn-buy-booster, .btn-promo');
    buyButtons.forEach(button => {
        const price = parseInt(button.getAttribute('data-booster-price'));
        if (userBalance < price) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    });
    
    // Vérifier si le solde est suffisant pour le distributeur
    const distributeurBtn = document.getElementById('distributeur-bouton');
    if (distributeurBtn) {
        if (userBalance < BOOSTER_TYPES['random'].price) {
            distributeurBtn.classList.add('disabled');
            distributeurBtn.style.pointerEvents = 'none';
        } else {
            distributeurBtn.classList.remove('disabled');
            distributeurBtn.style.pointerEvents = 'auto';
        }
    }
}