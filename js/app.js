// Script pour la gestion de l'interface de l'application CryptoCards

document.addEventListener('DOMContentLoaded', function() {
    // Navigation dans la sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('section[id^="section-"]');

    // Fonction pour activer un onglet et sa section correspondante
    function activateTab(tabId) {
        // Cacher toutes les sections
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Afficher la section sélectionnée
        const targetSection = document.getElementById('section-' + tabId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Mettre à jour les classes active dans la sidebar
        sidebarLinks.forEach(link => {
            link.parentElement.classList.remove('active');
            if (link.dataset.section === tabId) {
                link.parentElement.classList.add('active');
            }
        });
    }
    
    // Ajouter des écouteurs d'événements aux liens de la sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            activateTab(section);
        });
    });
    
    // Gestionnaires pour les boutons de collection
    const filterBtn = document.getElementById('filter-cards');
    const sortBtn = document.getElementById('sort-cards');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            alert('Fonctionnalité de filtrage à venir...');
        });
    }
    
    if (sortBtn) {
        sortBtn.addEventListener('click', function() {
            alert('Fonctionnalité de tri à venir...');
        });
    }
    
    // Gestionnaires pour les boutons d'action
    const buyPackBtn = document.getElementById('buy-pack');
    const visitMarketBtn = document.getElementById('visit-marketplace');
    
    if (buyPackBtn) {
        buyPackBtn.addEventListener('click', function() {
            activateTab('shop');
        });
    }
    
    if (visitMarketBtn) {
        visitMarketBtn.addEventListener('click', function() {
            activateTab('marketplace');
        });
    }
    
    // Gestionnaires pour les boutons d'action de la carte
    const cardFuseBtn = document.getElementById('card-fuse');
    const cardShareBtn = document.getElementById('card-share');
    const cardSellBtn = document.getElementById('card-sell');
    
    if (cardFuseBtn) {
        cardFuseBtn.addEventListener('click', function() {
            activateTab('fusion');
        });
    }
    
    if (cardShareBtn) {
        cardShareBtn.addEventListener('click', function() {
            alert('Partage de carte à venir...');
        });
    }
    
    if (cardSellBtn) {
        cardSellBtn.addEventListener('click', function() {
            alert('Mise en vente de carte à venir...');
        });
    }
    
    // Gestionnaire pour le modal de détail de carte
    const cardDetailModal = document.querySelector('.card-detail-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    
    if (modalClose && cardDetailModal) {
        modalClose.addEventListener('click', function() {
            cardDetailModal.classList.add('hidden');
        });
    }
    
    if (modalBackdrop && cardDetailModal) {
        modalBackdrop.addEventListener('click', function() {
            cardDetailModal.classList.add('hidden');
        });
    }
    
    // Simulation de cartes (à remplacer par des données réelles plus tard)
    function simulateUserCards() {
        // Si l'utilisateur est connecté, on simule quelques cartes
        if (window.ethereum && window.ethereum.selectedAddress) {
            // On simule 3 cartes
            const cards = [
                {
                    id: 1,
                    name: 'Dragon Ancien',
                    rarity: 'legendary',
                    stats: {
                        attack: 95,
                        defense: 80,
                        magic: 90,
                        speed: 75
                    },
                    acquired: '2025-03-15',
                    description: 'Le Dragon Ancien est une créature légendaire dont les pouvoirs remontent à l\'ère préhistorique. Sa capacité à contrôler les éléments en fait un adversaire redoutable sur le champ de bataille.'
                },
                {
                    id: 2,
                    name: 'Mage Suprême',
                    rarity: 'epic',
                    stats: {
                        attack: 75,
                        defense: 45,
                        magic: 95,
                        speed: 65
                    },
                    acquired: '2025-03-20',
                    description: 'Le Mage Suprême a consacré sa vie à l\'étude des arts mystiques. Sa maîtrise des sortilèges les plus complexes lui confère un avantage considérable contre tout type d\'adversaire.'
                },
                {
                    id: 3,
                    name: 'Guerrier d\'Élite',
                    rarity: 'rare',
                    stats: {
                        attack: 60,
                        defense: 65,
                        magic: 30,
                        speed: 55
                    },
                    acquired: '2025-03-25',
                    description: 'Le Guerrier d\'Élite est un combattant aguerri, formé dans les plus grandes académies militaires. Sa discipline et sa détermination en font un allié précieux dans toute escarmouche.'
                }
            ];
            
            displayCards(cards);
            updateCardStats(cards);
        }
    }
    
    // Afficher les cartes dans l'interface
    function displayCards(cards) {
        const cardsGrid = document.querySelector('.cards-grid');
        const noCardsPrompt = document.querySelector('.no-cards-prompt');
        
        if (!cardsGrid || !noCardsPrompt) return;
        
        if (!cards || cards.length === 0) {
            cardsGrid.classList.add('hidden');
            noCardsPrompt.classList.remove('hidden');
            return;
        }
        
        // Vider la grille
        cardsGrid.innerHTML = '';
        
        // Ajouter chaque carte
        cards.forEach(card => {
            const cardElement = createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
        
        // Afficher la grille et cacher le message de collection vide
        cardsGrid.classList.remove('hidden');
        noCardsPrompt.classList.add('hidden');
    }
    
    // Créer un élément de carte
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.dataset.cardId = card.id;
        
        // Déterminer la couleur en fonction de la rareté
        const rarityColors = {
            common: 'var(--color-common)',
            rare: 'var(--color-rare)',
            epic: 'var(--color-epic)',
            legendary: 'var(--color-legendary)'
        };
        
        const rarityColor = rarityColors[card.rarity] || 'var(--color-common)';
        
        cardElement.innerHTML = `
            <div class="card-preview-img" style="background-color: ${rarityColor};">
                <div class="card-rarity ${card.rarity}">${capitalizeFirstLetter(card.rarity)}</div>
            </div>
            <div class="card-preview-info">
                <h3>${card.name}</h3>
                <div class="card-preview-stats">
                    <span>ATQ: ${card.stats.attack}</span>
                    <span>DEF: ${card.stats.defense}</span>
                </div>
            </div>
        `;
        
        // Ajouter un gestionnaire d'événement pour afficher les détails
        cardElement.addEventListener('click', () => {
            showCardDetails(card);
        });
        
        return cardElement;
    }
    
    // Afficher les détails d'une carte
    function showCardDetails(card) {
        const cardDetailModal = document.querySelector('.card-detail-modal');
        if (!cardDetailModal) return;
        
        const cardNameElement = cardDetailModal.querySelector('.card-name');
        const cardRarityElement = cardDetailModal.querySelector('.card-rarity');
        const cardImageElement = cardDetailModal.querySelector('.card-image-large');
        const cardDescriptionElement = cardDetailModal.querySelector('.card-description p');
        const metadataValues = cardDetailModal.querySelectorAll('.metadata-value');
        const statFills = cardDetailModal.querySelectorAll('.stat-fill');
        const statValues = cardDetailModal.querySelectorAll('.card-stats-detailed .stat-value');
        
        // Remplir les informations
        cardNameElement.textContent = card.name;
        cardRarityElement.textContent = capitalizeFirstLetter(card.rarity);
        cardRarityElement.className = `card-rarity ${card.rarity}`;
        
        // Couleur de fond en fonction de la rareté
        const rarityColors = {
            common: 'var(--color-common)',
            rare: 'var(--color-rare)',
            epic: 'var(--color-epic)',
            legendary: 'var(--color-legendary)'
        };
        cardImageElement.style.backgroundColor = rarityColors[card.rarity] || 'var(--color-common)';
        
        cardDescriptionElement.textContent = card.description;
        
        // Metadata
        if (metadataValues.length >= 2) {
            metadataValues[0].textContent = `#${card.id}`;
            metadataValues[1].textContent = formatDate(card.acquired);
        }
        
        // Stats
        const stats = [card.stats.attack, card.stats.defense, card.stats.magic, card.stats.speed];
        stats.forEach((stat, index) => {
            if (statFills[index] && statValues[index]) {
                statFills[index].style.width = `${stat}%`;
                statValues[index].textContent = stat;
            }
        });
        
        // Afficher le modal
        cardDetailModal.classList.remove('hidden');
    }
    
    // Mettre à jour les statistiques des cartes
    function updateCardStats(cards) {
        const cardStatsValues = document.querySelectorAll('.collection-stats .stat-value');
        
        if (!cardStatsValues || cardStatsValues.length < 3) return;
        
        // Nombre total de cartes
        cardStatsValues[0].textContent = cards.length;
        
        // Nombre de sets complets (à implémenter ultérieurement)
        cardStatsValues[1].textContent = 0;
        
        // Nombre de cartes légendaires
        const legendaryCards = cards.filter(card => card.rarity === 'legendary').length;
        cardStatsValues[2].textContent = legendaryCards;
    }
    
    // Écouter les événements de connexion wallet pour mettre à jour l'interface
    window.addEventListener('ethereum#initialized', function() {
        simulateUserCards();
    });
    
    // Vérifier si ethereum est déjà disponible et connecté
    if (window.ethereum && window.ethereum.selectedAddress) {
        simulateUserCards();
    }
    
    // Fonction utilitaire pour capitaliser la première lettre
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Fonction utilitaire pour formater une date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});
