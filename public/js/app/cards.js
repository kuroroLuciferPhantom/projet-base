/**
 * Gestion des cartes de l'utilisateur
 */

/**
 * Charge et affiche les cartes de l'utilisateur
 */
async function loadUserCards() {
    try {
        // Masquer le message "collection vide"
        document.querySelector('.no-cards-prompt').classList.add('hidden');
        
        // Afficher la grille de cartes
        const cardsGrid = document.querySelector('.cards-grid');
        cardsGrid.classList.remove('hidden');
        cardsGrid.innerHTML = '';
        
        // Définition des cartes avec leurs images correspondantes
        const cardsData = [
            {
                name: 'Guerrier à poils',
                rarity: 'common',
                image: '/img/cards/3.jpg',
                attack: 2,
                defense: 3,
                energy: 1
            },
            {
                name: 'Bambo',
                rarity: 'uncommon',
                image: '/img/cards/4.jpg',
                attack: 4,
                defense: 4,
                energy: 2
            },
            {
                name: 'Sursumot',
                rarity: 'uncommon',
                image: '/img/cards/5.jpg',
                attack: 5,
                defense: 2,
                energy: 2
            },
            {
                name: 'RIG',
                rarity: 'epic',
                image: '/img/cards/1.jpg',
                attack: 6,
                defense: 8,
                energy: 2
            },
            {
                name: 'Mulk',
                rarity: 'legendary',
                image: '/img/cards/2.jpg',
                attack: 8,
                defense: 8,
                energy: 3
            }
        ];
        
        // Ajouter chaque carte à la grille
        cardsData.forEach(cardData => {
            const card = document.createElement('div');
            card.className = `card-item ${cardData.rarity}`;
            
            card.innerHTML = `
                <div class="card-rarity">${cardData.rarity.charAt(0).toUpperCase() + cardData.rarity.slice(1)}</div>
                <div class="card-image">
                    <img src="${cardData.image}" alt="${cardData.name}" class="card-artwork">
                </div>
                <div class="card-info">
                    <h3>${cardData.name}</h3>
                </div>
            `;

            card.addEventListener('click', function() {
                showCardDetails(cardData);
            });
            
            cardsGrid.appendChild(card);
        });
        
        // Mettre à jour les statistiques
        document.querySelector('.collection-stats .stat-value').textContent = cardsData.length.toString();
    } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
    }
}