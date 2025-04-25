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

/**
 * Simule l'ouverture d'un booster avec une animation
 */
function openBooster() {
    // Masquer le bouton d'ouverture et l'image du booster
    this.classList.add('hidden');
    document.getElementById('booster-pack-img').classList.add('opening');
    
    // Simuler l'ouverture du booster
    setTimeout(() => {
        document.getElementById('booster-pack-img').classList.add('hidden');
        document.querySelector('.cards-reveal').classList.remove('hidden');
        document.getElementById('continue-btn').classList.remove('hidden');
        
        // Simuler les cartes obtenues
        const cardsContainer = document.querySelector('.reveal-cards-container');
        cardsContainer.innerHTML = '';
        
        // Créer 5 cartes aléatoires (dans une implémentation réelle, ces données viendraient du serveur)
        const rarities = ['common', 'common', 'common', 'rare', 'epic'];
        const cardNames = ['Guerrier Novice', 'Archer Agile', 'Mage Apprenti', 'Dragon de Feu', 'Licorne Mystique'];
        
        rarities.forEach((rarity, index) => {
            const card = document.createElement('div');
            card.className = `reveal-card ${rarity}`;
            card.innerHTML = `
                <div class="card-rarity">${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</div>
                <div class="card-image" style="background-color: var(--color-${rarity === 'common' ? 'orange' : rarity === 'rare' ? 'green' : rarity === 'epic' ? 'blue' : 'purple'});"></div>
                <div class="card-info">
                    <h3>${cardNames[index]}</h3>
                    <div class="card-stats">
                        <span>ATK: ${Math.floor(Math.random() * 50) + 20}</span>
                        <span>DEF: ${Math.floor(Math.random() * 50) + 20}</span>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
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
    document.querySelector('.no-cards-prompt').classList.add('hidden');
    document.querySelector('.cards-grid').classList.remove('hidden');
    
    // Dans une implémentation réelle, il faudrait charger les cartes depuis le serveur
    // Pour cette démo, simuler l'ajout des cartes à la collection
    const cardsGrid = document.querySelector('.cards-grid');
    cardsGrid.innerHTML = '';
    
    // Ajouter les 5 cartes à la collection
    const rarities = ['common', 'common', 'common', 'rare', 'epic'];
    const cardNames = ['Guerrier Novice', 'Archer Agile', 'Mage Apprenti', 'Dragon de Feu', 'Licorne Mystique'];
    
    rarities.forEach((rarity, index) => {
        const card = document.createElement('div');
        card.className = `card-item ${rarity}`;
        card.innerHTML = `
            <div class="card-rarity">${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</div>
            <div class="card-image" style="background-color: var(--color-${rarity === 'common' ? 'orange' : rarity === 'rare' ? 'green' : rarity === 'epic' ? 'blue' : 'purple'});"></div>
            <div class="card-info">
                <h3>${cardNames[index]}</h3>
                <div class="card-stats">
                    <span>ATK: ${Math.floor(Math.random() * 50) + 20}</span>
                    <span>DEF: ${Math.floor(Math.random() * 50) + 20}</span>
                </div>
            </div>
        `;
        cardsGrid.appendChild(card);
    });
    
    // Mettre à jour les statistiques
    document.querySelector('.collection-stats .stat-value').textContent = '5';
}