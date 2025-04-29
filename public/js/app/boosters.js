/**
 * Gestion des boosters et de leur ouverture
 */

// Au chargement du document, configurer les gestionnaires d'événements pour les boosters
document.addEventListener('DOMContentLoaded', function() {
    // Ouverture de booster
    const openBoosterBtn = document.getElementById('open-booster-btn');
    if (openBoosterBtn) {
        openBoosterBtn.addEventListener('click', openBooster);
    }
    
    // Continuer après l'ouverture du booster
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', continueAfterBooster);
    }
});

// Configuration des raretés de cartes et leurs probabilités
const CARD_RARITIES = {
    'common': {
        color: '#3498db',
        displayName: 'Commune',
        probability: 0.6
    },
    'rare': {
        color: '#27ae60',
        displayName: 'Rare',
        probability: 0.25
    },
    'epic': {
        color: '#8e44ad',
        displayName: 'Épique',
        probability: 0.1
    },
    'legendary': {
        color: '#e67e22',
        displayName: 'Légendaire',
        probability: 0.05
    }
};

// Exemples de cartes pour chaque rareté
const CARD_EXAMPLES = {
    'common': ['Guerrier Novice', 'Archer Agile', 'Mage Apprenti', 'Nain Robuste', 'Elfe Sylvain'],
    'rare': ['Chevalier du Crépuscule', 'Maître Archer', 'Mage des Flammes', 'Druidesse Sauvage', 'Paladin Sacré'],
    'epic': ['Dragon de Feu', 'Sorcier des Arcanes', 'Golem de Pierre', 'Licorne Mystique', 'Hydre Venimeuse'],
    'legendary': ['Leviathan des Abysses', 'Phoenix Immortel', 'Roi-Démon', 'Archange Céleste', 'Titan Ancestral']
};

/**
 * Simule l'ouverture d'un booster avec une animation
 */
function openBooster() {
    // Masquer le bouton d'ouverture et animer l'image du booster
    this.classList.add('hidden');
    const boosterImage = document.getElementById('booster-pack-img');
    boosterImage.classList.add('opening');
    
    // Jouer un son d'ouverture (si disponible)
    const openSound = new Audio('/sounds/booster-open.mp3');
    if (openSound) {
        try {
            openSound.play().catch(e => console.log('Erreur de lecture audio:', e));
        } catch (e) {
            console.log('Audio non supporté ou fichier non disponible');
        }
    }
    
    // Simuler l'ouverture du booster
    setTimeout(() => {
        boosterImage.classList.add('hidden');
        document.querySelector('.cards-reveal').classList.remove('hidden');
        document.getElementById('continue-btn').classList.remove('hidden');
        
        // Récupérer le type de booster ouvert
        const boosterType = this.getAttribute('data-booster-type');
        
        // Simuler les cartes obtenues
        const cardsContainer = document.querySelector('.reveal-cards-container');
        cardsContainer.innerHTML = '';
        
        // Déterminer le nombre de cartes et la distribution des raretés en fonction du type de booster
        let cardCount = 5; // Par défaut
        let rarityDistribution = [];
        
        // Configurer en fonction du type de booster
        if (boosterType === 'premium') {
            rarityDistribution = ['common', 'common', 'rare', 'rare', 'epic'];
        } else if (boosterType === 'ultimate') {
            cardCount = 7;
            rarityDistribution = ['common', 'common', 'rare', 'rare', 'epic', 'epic', 'legendary'];
        } else {
            // Booster standard
            rarityDistribution = ['common', 'common', 'common', 'rare', 'epic'];
        }
        
        // Mélanger les raretés pour plus d'aléatoire
        shuffleArray(rarityDistribution);
        
        // Créer chaque carte avec un délai pour une animation progressive
        rarityDistribution.forEach((rarity, index) => {
            setTimeout(() => {
                // Choisir une carte aléatoire pour la rareté
                const cardNames = CARD_EXAMPLES[rarity];
                const randomCardName = cardNames[Math.floor(Math.random() * cardNames.length)];
                
                // Créer l'élément de carte
                const card = document.createElement('div');
                card.className = `reveal-card ${rarity}`;
                
                // Attribuer des statistiques aléatoires en fonction de la rareté
                const rarityMultiplier = rarity === 'common' ? 1 :
                                        rarity === 'rare' ? 1.5 :
                                        rarity === 'epic' ? 2 : 3;
                const baseAttack = Math.floor(Math.random() * 30) + 10;
                const baseDefense = Math.floor(Math.random() * 30) + 10;
                
                // Construire le HTML de la carte
                card.innerHTML = `
                    <div class="card-rarity">${CARD_RARITIES[rarity].displayName}</div>
                    <div class="card-image" style="background-color: ${CARD_RARITIES[rarity].color};"></div>
                    <div class="card-info">
                        <h3>${randomCardName}</h3>
                        <div class="card-stats">
                            <span>ATK: ${Math.floor(baseAttack * rarityMultiplier)}</span>
                            <span>DEF: ${Math.floor(baseDefense * rarityMultiplier)}</span>
                        </div>
                    </div>
                `;
                
                // Ajouter la carte au conteneur avec une animation
                card.style.opacity = 0;
                cardsContainer.appendChild(card);
                
                // Animation de fadeIn
                setTimeout(() => {
                    card.style.opacity = 1;
                    card.style.transition = 'opacity 0.3s ease, transform 0.4s ease';
                    card.style.transform = 'scale(1)';
                }, 50);
                
                // Jouer un son pour chaque carte (si disponible)
                const cardSound = new Audio('/sounds/card-reveal.mp3');
                if (cardSound) {
                    try {
                        cardSound.play().catch(e => console.log('Erreur de lecture audio:', e));
                    } catch (e) {
                        console.log('Audio non supporté ou fichier non disponible');
                    }
                }
            }, index * 300); // Délai progressif pour chaque carte
        });
    }, 1500);
}

/**
 * Continue après l'ouverture du booster et ajoute les cartes à la collection
 */
function continueAfterBooster() {
    // Fermer la modale
    document.getElementById('booster-opening-modal').style.display = 'none';
    
    // Mettre à jour l'interface pour afficher les cartes dans la collection
    const noCardsPrompt = document.querySelector('.no-cards-prompt');
    if (noCardsPrompt) {
        noCardsPrompt.classList.add('hidden');
    }
    
    const cardsGrid = document.querySelector('.cards-grid');
    if (cardsGrid) {
        cardsGrid.classList.remove('hidden');
        
        // Dans une implémentation réelle, il faudrait charger les cartes depuis le serveur
        // Pour cette démo, simuler l'ajout des cartes à la collection en utilisant celles déjà révélées
        const revealedCards = document.querySelectorAll('.reveal-card');
        
        // Vérifier s'il n'y a pas déjà des cartes avant de copier
        if (cardsGrid.querySelectorAll('.card-item').length === 0) {
            revealedCards.forEach(card => {
                // Cloner les informations importantes
                const rarity = card.className.split(' ')[1]; // 'common', 'rare', etc.
                const cardName = card.querySelector('h3').textContent;
                const stats = card.querySelectorAll('.card-stats span');
                const atk = stats[0].textContent;
                const def = stats[1].textContent;
                
                // Créer une nouvelle carte dans la collection
                const newCard = document.createElement('div');
                newCard.className = `card-item ${rarity}`;
                newCard.innerHTML = `
                    <div class="card-rarity">${card.querySelector('.card-rarity').textContent}</div>
                    <div class="card-image" style="${card.querySelector('.card-image').getAttribute('style')}"></div>
                    <div class="card-info">
                        <h3>${cardName}</h3>
                        <div class="card-stats">
                            <span>${atk}</span>
                            <span>${def}</span>
                        </div>
                    </div>
                `;
                
                cardsGrid.appendChild(newCard);
            });
        }
    }
    
    // Mettre à jour les statistiques
    const statValue = document.querySelector('.collection-stats .stat-value');
    if (statValue) {
        const currentCount = parseInt(statValue.textContent) || 0;
        const newCards = document.querySelectorAll('.reveal-card').length;
        statValue.textContent = currentCount + newCards;
    }
}

/**
 * Mélange un tableau de façon aléatoire (algorithm de Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}