/**
 * Gestion de la machine à sous style casino
 */

// Configuration des éléments de la machine à sous et leurs probabilités
const SLOT_ITEMS = [
    {
        id: 'booster-common',
        name: 'Booster Commun',
        image: '/img/booster/booster-commun.png',
        probability: 0.30,
        type: 'win',
        category: 'booster'
    },
    {
        id: 'booster-rare',
        name: 'Booster Rare',
        image: '/img/booster/booster-rare.png',
        probability: 0.10,
        type: 'win',
        category: 'booster'
    },
    {
        id: 'booster-epic',
        name: 'Booster Épique',
        image: '/img/booster/booster-epic.png',
        probability: 0.05,
        type: 'win',
        category: 'booster'
    },
    {
        id: 'tokens',
        name: '200 $CCARD',
        image: '/img/gift.svg',
        probability: 0.05,
        type: 'win',
        category: 'token',
        amount: 200
    },
    {
        id: 'lose',
        name: 'Perdu',
        image: '/img/illustrations/rekt.png',
        probability: 0.50,
        type: 'lose',
        category: 'none'
    }
];

// Variables globales pour la machine à sous
let slotMachineAnimating = false;
let dailyFreePlayAvailable = true;
let lastPlayTime = localStorage.getItem('lastSlotPlayTime') || null;
const PLAY_COST = 100;

// Au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la machine à sous
    initSlotMachine();
    
    // Vérifier la disponibilité de l'essai gratuit
    checkDailyFreePlay();
    
    // Initialiser le compte à rebours
    startFreePlayCountdown();
});

/**
 * Initialise la machine à sous et ses événements
 */
function initSlotMachine() {
    // Préparer les éléments de la machine
    generateSlotItems();
    
    // Bouton de jeu
    const playButton = document.getElementById('play-slot-button');
    if (playButton) {
        playButton.addEventListener('click', handleSlotPlay);
    }
    
    // Levier de la machine
    const slotLever = document.getElementById('slot-lever');
    if (slotLever) {
        slotLever.addEventListener('click', function() {
            // Simuler un clic sur le bouton de jeu
            const playButton = document.getElementById('play-slot-button');
            if (playButton && !playButton.disabled) {
                slotLever.classList.add('pulled');
                setTimeout(() => {
                    playButton.click();
                    
                    // Réinitialiser le levier après un délai
                    setTimeout(() => {
                        slotLever.classList.remove('pulled');
                    }, 1000);
                }, 300);
            } else {
                // Animation de refus si le bouton est désactivé
                slotLever.classList.add('denied');
                setTimeout(() => {
                    slotLever.classList.remove('denied');
                }, 500);
            }
        });
    }
    
    // Modal de résultat
    initResultModalEvents();
}

/**
 * Génère les éléments visuels de la machine à sous
 */
function generateSlotItems() {
    const slotReel = document.getElementById('slot-reel');
    if (!slotReel) return;
    
    // Vider le contenu existant
    slotReel.innerHTML = '';
    
    // Créer une séquence aléatoire d'éléments
    // Nous créons une séquence plus longue pour donner l'impression d'un rouleau infini
    const sequence = [];
    
    // Ajouter 20 éléments aléatoires
    for (let i = 0; i < 20; i++) {
        // Choisir un élément aléatoire parmi tous les items
        const randomIndex = Math.floor(Math.random() * SLOT_ITEMS.length);
        sequence.push(SLOT_ITEMS[randomIndex]);
    }
    
    // Créer les éléments HTML
    sequence.forEach((item, index) => {
        const slotItem = document.createElement('div');
        slotItem.className = 'slot-item';
        slotItem.setAttribute('data-id', item.id);
        slotItem.setAttribute('data-index', index);
        
        const itemImage = document.createElement('img');
        itemImage.src = item.image;
        itemImage.alt = item.name;
        itemImage.onerror = function() {
            // Image de remplacement en cas d'erreur
            this.src = '/img/gift.svg';
        };
        
        slotItem.appendChild(itemImage);
        slotReel.appendChild(slotItem);
    });
    
    // Positionner le rouleau au milieu
    const middleIndex = Math.floor(sequence.length / 2);
    const middleItemHeight = 120; // Hauteur d'un item en pixels
    slotReel.style.transform = `translateY(${-middleIndex * middleItemHeight + middleItemHeight/2}px)`;
}

/**
 * Gère les événements de la modal de résultat
 */
function initResultModalEvents() {
    const resultModal = document.getElementById('slot-result-modal');
    const closeBtn = resultModal.querySelector('.close-modal');
    const resultCloseBtn = document.getElementById('slot-result-close-btn');
    const playAgainBtn = document.getElementById('slot-play-again-btn');
    
    // Fermer la modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            resultModal.classList.remove('show');
        });
    }
    
    if (resultCloseBtn) {
        resultCloseBtn.addEventListener('click', () => {
            resultModal.classList.remove('show');
        });
    }
    
    // Rejouer
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            resultModal.classList.remove('show');
            
            // Vérifier si l'utilisateur a assez de tokens
            if (userBalance >= PLAY_COST) {
                setTimeout(() => {
                    handleSlotPlay(false);
                }, 500);
            } else {
                // Afficher la modal "Vous êtes pauvre"
                const brokeModal = document.getElementById('broke-modal');
                if (brokeModal) {
                    brokeModal.classList.add('show');
                    
                    // Mettre à jour le montant requis
                    const requiredAmount = brokeModal.querySelector('.required-amount');
                    if (requiredAmount) {
                        requiredAmount.textContent = PLAY_COST;
                    }
                }
            }
        });
    }
    
    // Fermer la modal en cliquant à l'extérieur
    window.addEventListener('click', (event) => {
        if (event.target === resultModal) {
            resultModal.classList.remove('show');
        }
    });
}

/**
 * Vérifie si l'essai gratuit quotidien est disponible
 */
function checkDailyFreePlay() {
    // Si aucune dernière date de jeu n'est enregistrée, l'essai gratuit est disponible
    if (!lastPlayTime) {
        setFreePlayAvailable(true);
        return;
    }
    
    // Convertir la chaîne en date
    const lastPlay = new Date(lastPlayTime);
    const now = new Date();
    
    // Vérifier si la dernière partie a été jouée un jour différent
    if (now.toDateString() !== lastPlay.toDateString()) {
        setFreePlayAvailable(true);
    } else {
        setFreePlayAvailable(false);
    }
}

/**
 * Met à jour l'interface en fonction de la disponibilité de l'essai gratuit
 */
function setFreePlayAvailable(available) {
    dailyFreePlayAvailable = available;
    
    // Mettre à jour le texte du bouton
    const playButton = document.getElementById('play-slot-button');
    const priceSpan = playButton.querySelector('.slot-price');
    
    if (available) {
        priceSpan.textContent = 'GRATUIT';
        playButton.classList.remove('disabled');
        playButton.disabled = false;
    } else {
        priceSpan.textContent = `${PLAY_COST} $CCARD`;
        
        // Vérifier si l'utilisateur a assez de tokens
        if (userBalance < PLAY_COST) {
            playButton.classList.add('disabled');
            playButton.disabled = true;
        } else {
            playButton.classList.remove('disabled');
            playButton.disabled = false;
        }
    }
    
    // Mettre à jour l'affichage de l'essai gratuit
    const dailyFreePlay = document.querySelector('.daily-free-play');
    const dailyFreeText = document.querySelector('.daily-free-text');
    
    if (available) {
        dailyFreePlay.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        dailyFreePlay.style.borderColor = '#2ecc71';
        dailyFreeText.style.color = '#2ecc71';
        dailyFreeText.textContent = 'Essai gratuit disponible';
    } else {
        dailyFreePlay.style.backgroundColor = 'rgba(149, 165, 166, 0.1)';
        dailyFreePlay.style.borderColor = '#95a5a6';
        dailyFreeText.style.color = '#95a5a6';
        dailyFreeText.textContent = 'Prochain essai gratuit dans';
    }
}

/**
 * Démarre le compte à rebours pour l'essai gratuit
 */
function startFreePlayCountdown() {
    const countdownTimer = document.getElementById('free-play-timer');
    if (!countdownTimer) return;
    
    function updateCountdown() {
        // Si l'essai gratuit est disponible, ne pas afficher le compte à rebours
        if (dailyFreePlayAvailable) {
            countdownTimer.textContent = '';
            return;
        }
        
        // Calculer le temps restant jusqu'à minuit
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeRemaining = tomorrow - now;
        
        // Formater le temps restant
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        countdownTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Mettre à jour toutes les secondes
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/**
 * Gère le jeu sur la machine à sous
 * @param {boolean} useFreePlay - Indique si on utilise l'essai gratuit
 */
function handleSlotPlay(useFreePlay = true) {
    // Éviter les clics multiples pendant l'animation
    if (slotMachineAnimating) return;
    
    // Vérifier si c'est un essai gratuit ou payant
    const isFreePlay = useFreePlay && dailyFreePlayAvailable;
    
    // Si ce n'est pas un essai gratuit, vérifier le solde
    if (!isFreePlay && userBalance < PLAY_COST) {
        // Afficher la modal "Vous êtes pauvre"
        const brokeModal = document.getElementById('broke-modal');
        if (brokeModal) {
            brokeModal.classList.add('show');
            
            // Mettre à jour le montant requis
            const requiredAmount = brokeModal.querySelector('.required-amount');
            if (requiredAmount) {
                requiredAmount.textContent = PLAY_COST;
            }
        }
        return;
    }
    
    // Marquer le début de l'animation
    slotMachineAnimating = true;
    
    // Si ce n'est pas un essai gratuit, déduire les tokens
    if (!isFreePlay) {
        userBalance -= PLAY_COST;
        updateUserBalance(); // Fonction définie dans shop.js
    } else {
        // Marquer l'essai gratuit comme utilisé
        dailyFreePlayAvailable = false;
        localStorage.setItem('lastSlotPlayTime', new Date().toISOString());
        setFreePlayAvailable(false);
    }
    
    // Récupérer l'élément du rouleau
    const slotReel = document.getElementById('slot-reel');
    if (!slotReel) return;
    
    // Phase 1 : Animation rapide
    slotReel.classList.add('spinning');
    
    // Déterminer à l'avance le résultat en fonction des probabilités
    const result = determineSlotResult();
    
    // Phase 2 : Ralentissement et arrêt sur le résultat après 2-3 secondes
    setTimeout(() => {
        slotReel.classList.remove('spinning');
        slotReel.classList.add('slow-down');
        
        // Trouver un élément correspondant au résultat
        const resultItems = document.querySelectorAll(`.slot-item[data-id="${result.id}"]`);
        
        // S'il y a au moins un élément correspondant
        if (resultItems.length > 0) {
            // Choisir un élément aléatoire parmi ceux qui correspondent
            const randomIndex = Math.floor(Math.random() * resultItems.length);
            const selectedItem = resultItems[randomIndex];
            
            // Calculer la position pour centrer cet élément
            const itemHeight = 120; // Hauteur d'un item en pixels
            const itemIndex = parseInt(selectedItem.getAttribute('data-index'));
            const targetPosition = -itemIndex * itemHeight + itemHeight/2;
            
            // Animer jusqu'à cette position
            setTimeout(() => {
                slotReel.classList.remove('slow-down');
                slotReel.style.transition = 'transform 1s ease-out';
                slotReel.style.transform = `translateY(${targetPosition}px)`;
                
                // Mettre en évidence l'élément sélectionné
                setTimeout(() => {
                    selectedItem.classList.add('highlighted');
                    
                    // Réinitialiser l'animation
                    slotMachineAnimating = false;
                    
                    // Afficher le résultat
                    setTimeout(() => {
                        showSlotResult(result);
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    }, 2000 + Math.random() * 1000); // Durée aléatoire pour plus de suspense
}

/**
 * Détermine le résultat du jeu en fonction des probabilités
 */
function determineSlotResult() {
    // Calculer la somme des probabilités
    const totalProbability = SLOT_ITEMS.reduce((sum, item) => sum + item.probability, 0);
    
    // Générer un nombre aléatoire entre 0 et la somme des probabilités
    const random = Math.random() * totalProbability;
    
    // Déterminer l'élément en fonction de ce nombre
    let cumulativeProbability = 0;
    for (const item of SLOT_ITEMS) {
        cumulativeProbability += item.probability;
        if (random < cumulativeProbability) {
            return item;
        }
    }
    
    // Fallback sur le premier élément
    return SLOT_ITEMS[0];
}

/**
 * Affiche le résultat du jeu
 */
function showSlotResult(result) {
    const resultModal = document.getElementById('slot-result-modal');
    if (!resultModal) return;
    
    // Récupérer les éléments de la modal
    const modalHeader = document.getElementById('slot-result-header');
    const resultTitle = document.getElementById('slot-result-title');
    const resultImage = document.getElementById('slot-result-image');
    const resultMessage = document.getElementById('slot-result-message');
    const resultDetails = document.getElementById('slot-result-details');
    const resultImageContainer = document.querySelector('.result-image-container');
    const playAgainBtn = document.getElementById('slot-play-again-btn');
    
    // Configurer la modal en fonction du résultat
    if (result.type === 'win') {
        // C'est une victoire
        modalHeader.className = 'modal-header win';
        resultTitle.textContent = 'Félicitations !';
        resultImageContainer.className = 'result-image-container win';
        
        // Affichage du résultat
        if (result.category === 'booster') {
            resultMessage.textContent = 'Vous avez gagné un booster !';
            resultDetails.textContent = `Vous avez obtenu un ${result.name}.`;
        } else if (result.category === 'token') {
            resultMessage.textContent = 'Vous avez gagné des tokens !';
            resultDetails.textContent = `Vous avez obtenu ${result.amount} $CCARD.`;
            
            // Ajouter les tokens au solde
            userBalance += result.amount;
            updateUserBalance();
        }
    } else {
        // C'est une défaite
        modalHeader.className = 'modal-header lose';
        resultTitle.textContent = 'Dommage !';
        resultImageContainer.className = 'result-image-container lose';
        resultMessage.textContent = 'Vous vous êtes fait REKT !';
        resultDetails.textContent = 'Retentez votre chance plus tard ou achetez un autre essai.';
    }
    
    // Mettre à jour l'image
    resultImage.src = result.image;
    resultImage.alt = result.name;
    resultImage.onerror = function() {
        // Image de remplacement en cas d'erreur
        this.src = '/img/gift.svg';
    };
    
    // Mettre à jour le texte du bouton "Rejouer"
    if (dailyFreePlayAvailable) {
        playAgainBtn.textContent = 'Rejouer (Gratuit)';
    } else {
        playAgainBtn.textContent = `Rejouer (${PLAY_COST} $CCARD)`;
    }
    
    // Afficher la modal
    resultModal.classList.add('show');
    
    // Jouer un son en fonction du résultat
    playResultSound(result.type);
}

/**
 * Joue un son en fonction du résultat
 */
function playResultSound(resultType) {
    let soundFile = '';
    
    if (resultType === 'win') {
        soundFile = '/sounds/win.mp3';
    } else {
        soundFile = '/sounds/lose.mp3';
    }
    
    // Créer et jouer le son
    const sound = new Audio(soundFile);
    sound.volume = 0.5;
    sound.play().catch(error => {
        console.log('Impossible de jouer le son:', error);
    });
}

/**
 * Génère une animation de confettis pour les gros gains
 */
function generateConfetti() {
    // Créer une fonction pour créer et animer des confettis
    // Pour une implémentation ultérieure
}