document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const NFT_ABI = []; // À remplir une fois que les contrats sont créés
    const TOKEN_ABI = []; // À remplir une fois que les contrats sont créés
    
    // Sélecteurs d'éléments
    const walletNotConnected = document.querySelector('.wallet-not-connected');
    const walletConnected = document.querySelector('.wallet-connected');
    const networkStatus = document.querySelector('.network-status');
    const networkName = document.querySelector('.network-name');
    const tokenAmount = document.querySelector('.token-amount');
    const cardStatsValues = document.querySelectorAll('.stat-value');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalClose = document.querySelector('.modal-close');
    const cardDetailModal = document.querySelector('.card-detail-modal');
    const cardsGrid = document.querySelector('.cards-grid');
    const noCardsPrompt = document.querySelector('.no-cards-prompt');
    
    // État de l'application
    const appState = {
        walletConnected: false,
        walletAddress: null,
        network: null,
        balance: 0,
        cards: [],
        contracts: {
            nft: null,
            token: null
        }
    };
    
    // Initialiser les contrats
    async function initContracts() {
        if (!window.walletConnector || !window.walletConnector.isConnected) return;
        
        try {
            const provider = window.walletConnector.provider;
            const signer = window.walletConnector.signer;
            
            // Déterminer les adresses de contrat à utiliser en fonction du réseau
            const isTestnet = window.walletConnector.chainId === '0x66EED'; // Arbitrum Goerli
            const contractAddresses = isTestnet ? 
                window.CONTRACT_ADDRESSES.testnet : 
                window.CONTRACT_ADDRESSES.mainnet;
            
            // Initialiser les contrats si les adresses sont définies
            if (contractAddresses.NFT) {
                appState.contracts.nft = new ethers.Contract(
                    contractAddresses.NFT,
                    NFT_ABI,
                    signer
                );
            }
            
            if (contractAddresses.TOKEN) {
                appState.contracts.token = new ethers.Contract(
                    contractAddresses.TOKEN,
                    TOKEN_ABI,
                    signer
                );
            }
            
            // Charger les informations si les contrats sont initialisés
            if (appState.contracts.nft && appState.contracts.token) {
                await loadUserData();
            } else {
                console.warn('Contrats non initialisés - adresses manquantes');
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des contrats:', error);
        }
    }
    
    // Charger les données de l'utilisateur
    async function loadUserData() {
        if (!window.walletConnector || !window.walletConnector.isConnected) return;
        
        const address = window.walletConnector.getAddress();
        
        try {
            // Charger le solde de tokens
            if (appState.contracts.token) {
                const balance = await appState.contracts.token.balanceOf(address);
                appState.balance = ethers.utils.formatUnits(balance, 18); // Supposant 18 décimales
                updateTokenBalance();
            }
            
            // Charger les NFTs
            await loadUserCards();
            
        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
        }
    }
    
    // Charger les cartes de l'utilisateur
    async function loadUserCards() {
        if (!window.walletConnector || !window.walletConnector.isConnected || !appState.contracts.nft) {
            return;
        }
        
        const address = window.walletConnector.getAddress();
        
        try {
            // Si nous utilisons un vrai contrat ERC-721 ou ERC-1155, nous pouvons obtenir les NFTs
            // Exemple avec ERC-721:
            // const balance = await appState.contracts.nft.balanceOf(address);
            // const totalCards = balance.toNumber();
            
            // Puisque nous n'avons pas encore de contrat déployé, utilisons des données simulées
            simulateUserCards();
            
            // Mettre à jour l'interface
            updateCardsDisplay();
            
        } catch (error) {
            console.error('Erreur lors du chargement des cartes:', error);
            // En cas d'erreur, afficher l'interface "pas de cartes"
            showNoCardsInterface();
        }
    }
    
    // Simuler des cartes utilisateur (à remplacer par de vraies données plus tard)
    function simulateUserCards() {
        // Simulation de données de cartes pour tester l'interface
        appState.cards = [
            {
                id: 1,
                name: 'Dragon Ancien',
                rarity: 'legendary',
                image: null, // Remplacez par une URL d'image plus tard
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
                image: null,
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
                image: null,
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
    }
    
    // Mettre à jour l'affichage des cartes
    function updateCardsDisplay() {
        if (!cardsGrid) return;
        
        if (appState.cards.length === 0) {
            showNoCardsInterface();
            return;
        }
        
        // Cacher l'interface "pas de cartes" et afficher la grille
        noCardsPrompt.classList.add('hidden');
        cardsGrid.classList.remove('hidden');
        
        // Vider la grille
        cardsGrid.innerHTML = '';
        
        // Mettre à jour les statistiques
        updateCardStats();
        
        // Ajouter chaque carte à la grille
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
        
        // Déterminer la couleur de fond en fonction de la rareté
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
    
    // Afficher l'interface "pas de cartes"
    function showNoCardsInterface() {
        if (!noCardsPrompt || !cardsGrid) return;
        
        cardsGrid.classList.add('hidden');
        noCardsPrompt.classList.remove('hidden');
    }
    
    // Afficher les détails d'une carte
    function showCardDetails(card) {
        if (!cardDetailModal) return;
        
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
    function updateCardStats() {
        if (!cardStatsValues || cardStatsValues.length < 3) return;
        
        // Nombre total de cartes
        cardStatsValues[0].textContent = appState.cards.length;
        
        // Nombre de sets complets (à implémenter ultérieurement)
        // Pour l'instant, on simule 0
        cardStatsValues[1].textContent = 0;
        
        // Nombre de cartes légendaires
        const legendaryCards = appState.cards.filter(card => card.rarity === 'legendary').length;
        cardStatsValues[2].textContent = legendaryCards;
    }
    
    // Mettre à jour l'affichage du solde de tokens
    function updateTokenBalance() {
        if (!tokenAmount) return;
        
        tokenAmount.textContent = `${appState.balance} $CCARD`;
    }
    
    // Gestionnaire pour l'événement de connexion de wallet
    function handleWalletConnect(accounts) {
        appState.walletConnected = true;
        appState.walletAddress = accounts[0];
        
        // Initialiser les contrats
        initContracts();
        
        // Afficher l'interface connectée
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.add('hidden');
            walletConnected.classList.remove('hidden');
        }
    }
    
    // Gestionnaire pour l'événement de déconnexion de wallet
    function handleWalletDisconnect() {
        appState.walletConnected = false;
        appState.walletAddress = null;
        appState.cards = [];
        
        // Réinitialiser les contrats
        appState.contracts.nft = null;
        appState.contracts.token = null;
        
        // Afficher l'interface déconnectée
        if (walletNotConnected && walletConnected) {
            walletNotConnected.classList.remove('hidden');
            walletConnected.classList.add('hidden');
        }
    }
    
    // Initialisation
    function init() {
        // Configurer les gestionnaires d'événements
        if (window.walletConnector) {
            window.walletConnector.onConnect(handleWalletConnect);
            window.walletConnector.onDisconnect(handleWalletDisconnect);
        }
        
        // Configurer la fermeture du modal
        if (modalClose && modalBackdrop && cardDetailModal) {
            modalClose.addEventListener('click', () => {
                cardDetailModal.classList.add('hidden');
            });
            
            modalBackdrop.addEventListener('click', () => {
                cardDetailModal.classList.add('hidden');
            });
        }
        
        // Si déjà connecté, initialiser les contrats
        if (window.walletConnector && window.walletConnector.isConnected) {
            handleWalletConnect([window.walletConnector.getAddress()]);
        }
    }
    
    // Utilitaires
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Initialiser l'application
    init();
});
