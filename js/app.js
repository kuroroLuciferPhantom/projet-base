document.addEventListener('DOMContentLoaded', function() {
    // Sélecteurs d'éléments
    const connectWalletButtons = document.querySelectorAll('.connect-wallet');
    const walletNotConnected = document.querySelector('.wallet-not-connected');
    const walletConnected = document.querySelector('.wallet-connected');
    const networkStatus = document.querySelector('.network-status');
    const networkName = document.querySelector('.network-name');
    const tokenAmount = document.querySelector('.token-amount');
    const cardStatsValues = document.querySelectorAll('.stat-value');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalClose = document.querySelector('.modal-close');
    const cardDetailModal = document.querySelector('.card-detail-modal');
    
    // État de l'application
    const appState = {
        walletConnected: false,
        walletAddress: null,
        network: null,
        balance: 0,
        cards: []
    };
    
    // Simulation de données (à remplacer par des appels blockchain réels)
    const mockWalletData = {
        address: '0x1234...5678',
        network: 'Polygon Mumbai',
        balance: 250
    };
    
    const mockCards = [
        {
            id: 1,
            name: 'Dragon Ancien',
            rarity: 'legendary',
            image: 'dragon.jpg',
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
            image: 'mage.jpg',
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
            image: 'warrior.jpg',
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
    
    // Gestionnaire d'événements pour la connexion du wallet
    function handleConnectWallet() {
        // Dans une application réelle, ceci ferait appel à la librairie Web3 ou ethers.js
        console.log('Tentative de connexion au wallet...');
        
        // Simulons une connexion réussie (à remplacer par du code réel)
        setTimeout(() => {
            connectWallet();
        }, 1000);
    }
    
    // Fonction de connexion du wallet
    function connectWallet() {
        // Mise à jour de l'état
        appState.walletConnected = true;
        appState.walletAddress = mockWalletData.address;
        appState.network = mockWalletData.network;
        appState.balance = mockWalletData.balance;
        appState.cards = mockCards;
        
        // Mise à jour de l'interface
        updateUIWalletConnected();
    }
    
    // Mise à jour de l'interface après connexion du wallet
    function updateUIWalletConnected() {
        // Afficher/masquer les sections appropriées
        walletNotConnected.classList.add('hidden');
        walletConnected.classList.remove('hidden');
        
        // Mettre à jour les informations du wallet
        networkStatus.classList.add('connected');
        networkName.textContent = appState.network;
        tokenAmount.textContent = `${appState.balance} $CCARD`;
        
        // Mettre à jour les statistiques de la collection
        updateCollectionStats();
        
        // Générer les cartes de l'utilisateur
        renderCards();
    }
    
    // Mettre à jour les statistiques de la collection
    function updateCollectionStats() {
        if (cardStatsValues.length >= 3) {
            // Nombre total de cartes
            cardStatsValues[0].textContent = appState.cards.length;
            
            // Nombre de sets complets (simulation)
            cardStatsValues[1].textContent = 0;
            
            // Nombre de cartes légendaires
            const legendaryCards = appState.cards.filter(card => card.rarity === 'legendary').length;
            cardStatsValues[2].textContent = legendaryCards;
        }
    }
    
    // Générer les cartes dans l'interface
    function renderCards() {
        const cardsGrid = document.querySelector('.cards-grid');
        const noCardsPrompt = document.querySelector('.no-cards-prompt');
        
        // Si l'utilisateur n'a pas de cartes
        if (appState.cards.length === 0) {
            cardsGrid.classList.add('hidden');
            noCardsPrompt.classList.remove('hidden');
            return;
        }
        
        // Si l'utilisateur a des cartes
        noCardsPrompt.classList.add('hidden');
        cardsGrid.classList.remove('hidden');
        
        // Vider le conteneur
        cardsGrid.innerHTML = '';
        
        // Générer chaque carte
        appState.cards.forEach(card => {
            const cardElement = createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
    }
    
    // Créer un élément de carte
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.dataset.cardId = card.id;
        
        const rarityColor = {
            common: 'var(--color-common)',
            rare: 'var(--color-rare)',
            epic: 'var(--color-epic)',
            legendary: 'var(--color-legendary)'
        };
        
        cardElement.innerHTML = `
            <div class="card-preview-img" style="background-color: ${rarityColor[card.rarity]};">
                <div class="card-rarity ${card.rarity}">${card.rarity}</div>
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
        // Mettre à jour le contenu du modal
        const cardNameElement = cardDetailModal.querySelector('.card-name');
        const cardRarityElement = cardDetailModal.querySelector('.card-rarity');
        const cardImageElement = cardDetailModal.querySelector('.card-image-large');
        const cardDescriptionElement = cardDetailModal.querySelector('.card-description p');
        const metadataValues = cardDetailModal.querySelectorAll('.metadata-value');
        const statFills = cardDetailModal.querySelectorAll('.stat-fill');
        const statValues = cardDetailModal.querySelectorAll('.card-stats-detailed .stat-value');
        
        // Remplir les informations
        cardNameElement.textContent = card.name;
        cardRarityElement.textContent = card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1);
        cardRarityElement.className = `card-rarity ${card.rarity}`;
        cardImageElement.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--color-${card.rarity}`);
        cardDescriptionElement.textContent = card.description;
        
        // Metadata
        if (metadataValues.length >= 2) {
            metadataValues[0].textContent = `#${card.id}`;
            metadataValues[1].textContent = new Date(card.acquired).toLocaleDateString();
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
    
    // Fonctions d'initialisation
    function initEventListeners() {
        // Boutons de connexion du wallet
        connectWalletButtons.forEach(button => {
            button.addEventListener('click', handleConnectWallet);
        });
        
        // Fermeture du modal
        if (modalClose && modalBackdrop) {
            modalClose.addEventListener('click', () => {
                cardDetailModal.classList.add('hidden');
            });
            
            modalBackdrop.addEventListener('click', () => {
                cardDetailModal.classList.add('hidden');
            });
        }
    }
    
    // Initialisation
    initEventListeners();
});
