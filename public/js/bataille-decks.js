/**
 * Module de gestion des decks pour la bataille
 * Gère la création, édition, suppression et activation des decks
 */

(function() {
    // S'assurer que le namespace existe
    window.Bataille = window.Bataille || {};
    
    // Module Decks
    const Decks = {};
    
    // Charger les decks du joueur
    Decks.loadPlayerDecks = async function() {
        try {
            // Afficher le chargement
            Bataille.elements.decksLoading.style.display = 'flex';
            Bataille.elements.decksContainer.style.display = 'none';
            
            // Appel à l'API
            const response = await fetch('/bataille/api/decks');
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des decks');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du chargement des decks');
            }
            
            // Mettre à jour l'état
            Bataille.state.decks = data.decks;
            
            // Mettre à jour l'interface
            Decks.updateDecksUI();
            Bataille.Battle.updateBattleDecksUI();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast('Erreur lors du chargement des decks', 'error');
        } finally {
            // Masquer le chargement
            Bataille.elements.decksLoading.style.display = 'none';
            Bataille.elements.decksContainer.style.display = 'block';
        }
    };

    // Mettre à jour l'interface des decks
    Decks.updateDecksUI = function() {
        // Vider la liste des decks
        Bataille.elements.decksList.innerHTML = '';
        
        // Vérifier s'il y a des decks
        if (Bataille.state.decks.length === 0) {
            Bataille.elements.noDecks.style.display = 'block';
            return;
        }
        
        Bataille.elements.noDecks.style.display = 'none';
        
        // Ajouter les decks à la liste
        Bataille.state.decks.forEach(deck => {
            const deckElement = Decks.createDeckElement(deck);
            Bataille.elements.decksList.appendChild(deckElement);
        });
    };

    // Créer un élément de deck
    Decks.createDeckElement = function(deck) {
        const template = Bataille.templates.deck.content.cloneNode(true);
        
        // Récupérer les éléments
        const deckCard = template.querySelector('.deck-card');
        const deckName = template.querySelector('.deck-name');
        const cardCount = template.querySelector('.card-count');
        const winCount = template.querySelector('.win-count');
        const lossCount = template.querySelector('.loss-count');
        const deckDescription = template.querySelector('.deck-description');
        const deckPreview = template.querySelector('.deck-preview');
        const activeBadge = template.querySelector('.active-badge');
        const editBtn = template.querySelector('.edit-deck-btn');
        const deleteBtn = template.querySelector('.delete-deck-btn');
        const activateBtn = template.querySelector('.activate-deck-btn');
        
        // Définir les attributs et le contenu
        deckCard.dataset.deckId = deck._id;
        deckName.textContent = deck.name;
        cardCount.textContent = deck.cards.length;
        winCount.textContent = deck.stats ? deck.stats.wins : 0;
        lossCount.textContent = deck.stats ? deck.stats.losses : 0;
        deckDescription.textContent = deck.description || 'Aucune description';
        
        // Aperçu des cartes
        if (deck.cards && deck.cards.length > 0) {
            deck.cards.forEach(card => {
                const cardPreview = document.createElement('div');
                cardPreview.className = `card-preview ${card.rarity}`;
                cardPreview.style.backgroundImage = `url(${card.imageUrl})`;
                deckPreview.appendChild(cardPreview);
            });
        }
        
        // Deck actif
        if (deck.isActive) {
            activeBadge.style.display = 'inline-block';
            activateBtn.style.display = 'none';
        } else {
            activeBadge.style.display = 'none';
            activateBtn.style.display = 'inline-block';
        }
        
        // Événements
        editBtn.addEventListener('click', () => Decks.openDeckModal(deck));
        deleteBtn.addEventListener('click', () => Decks.openDeleteModal(deck));
        activateBtn.addEventListener('click', () => Decks.activateDeck(deck._id));
        
        return template;
    };

    // Ouvrir le modal de création/édition de deck
    Decks.openDeckModal = async function(deck = null) {
        // Réinitialiser le formulaire
        Bataille.elements.deckForm.reset();
        Bataille.elements.deckId.value = '';
        Bataille.state.selectedCards = [];
        
        // Titre du modal
        Bataille.elements.deckModalTitle.textContent = deck ? 'Modifier le Deck' : 'Nouveau Deck';
        
        // Si on édite un deck existant
        if (deck) {
            Bataille.elements.deckId.value = deck._id;
            Bataille.elements.deckName.value = deck.name;
            Bataille.elements.deckDescription.value = deck.description || '';
            
            // Sélectionner les cartes du deck
            Bataille.state.selectedCards = deck.cards.map(card => card._id);
        } else {
            Bataille.state.selectedCards = [];
        }
        
        // Mettre à jour le compteur de cartes sélectionnées
        Bataille.elements.selectedCardsCount.textContent = Bataille.state.selectedCards.length;
        
        // Charger la collection de cartes du joueur
        await Decks.loadCardCollection();
        
        // Mettre à jour l'interface des cartes
        Decks.updateCardSelectionUI();
        
        // Afficher le modal
        Bataille.elements.deckModal.style.display = 'block';
    };

    // Fermer le modal de deck
    Decks.closeDeckModal = function() {
        Bataille.elements.deckModal.style.display = 'none';
    };

    // Ouvrir le modal de suppression
    Decks.openDeleteModal = function(deck) {
        Bataille.state.currentDeck = deck;
        Bataille.elements.deleteDeckModal.style.display = 'block';
    };

    // Fermer le modal de suppression
    Decks.closeDeleteModal = function() {
        Bataille.elements.deleteDeckModal.style.display = 'none';
    };

    // Charger la collection de cartes du joueur
    Decks.loadCardCollection = async function() {
        try {
            // Appel à l'API pour récupérer les cartes du joueur
            const response = await fetch('/api/cards');
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de la collection');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du chargement de la collection');
            }
            
            // Mettre à jour l'état
            Bataille.state.cardCollection = data.cards;
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast('Erreur lors du chargement de la collection', 'error');
        }
    };

    // Mettre à jour l'interface de sélection des cartes
    Decks.updateCardSelectionUI = function() {
        // Mettre à jour le compteur
        Bataille.elements.selectedCardsCount.textContent = Bataille.state.selectedCards.length;
        
        // Mettre à jour la liste des cartes sélectionnées
        Decks.updateSelectedCardsList();
        
        // Mettre à jour la liste des cartes disponibles
        Decks.updateAvailableCardsList();
    };

    // Mettre à jour la liste des cartes sélectionnées
    Decks.updateSelectedCardsList = function() {
        Bataille.elements.selectedCardsList.innerHTML = '';
        
        if (Bataille.state.selectedCards.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-selection-message';
            emptyMessage.textContent = 'Aucune carte sélectionnée';
            Bataille.elements.selectedCardsList.appendChild(emptyMessage);
            return;
        }
        
        // Trouver les cartes complètes à partir des IDs
        const selectedCards = Bataille.state.selectedCards.map(cardId => {
            return Bataille.state.cardCollection.find(card => card._id === cardId) || { _id: cardId, name: 'Carte inconnue' };
        });
        
        // Ajouter les cartes sélectionnées
        selectedCards.forEach(card => {
            const cardElement = Decks.createCardSelectionElement(card, true);
            Bataille.elements.selectedCardsList.appendChild(cardElement);
        });
    };

    // Mettre à jour la liste des cartes disponibles
    Decks.updateAvailableCardsList = function() {
        Bataille.elements.availableCardsList.innerHTML = '';
        
        // Filtrer les cartes selon la recherche et le filtre
        const searchTerm = Bataille.elements.cardSearch.value.toLowerCase();
        const rarityFilter = Bataille.elements.cardRarityFilter.value;
        
        const filteredCards = Bataille.state.cardCollection.filter(card => {
            const nameMatch = card.name.toLowerCase().includes(searchTerm);
            const rarityMatch = rarityFilter ? card.rarity === rarityFilter : true;
            return nameMatch && rarityMatch;
        });
        
        if (filteredCards.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-cards-message';
            emptyMessage.textContent = 'Aucune carte ne correspond aux critères';
            Bataille.elements.availableCardsList.appendChild(emptyMessage);
            return;
        }
        
        // Ajouter les cartes disponibles
        filteredCards.forEach(card => {
            const isSelected = Bataille.state.selectedCards.includes(card._id);
            const cardElement = Decks.createCardSelectionElement(card, isSelected);
            Bataille.elements.availableCardsList.appendChild(cardElement);
        });
    };

    // Créer un élément de carte pour la sélection
    Decks.createCardSelectionElement = function(card, isSelected) {
        const template = Bataille.templates.cardSelection.content.cloneNode(true);
        
        // Récupérer les éléments
        const cardItem = template.querySelector('.card-selection-item');
        const cardImage = template.querySelector('.card-image');
        const cardRarity = template.querySelector('.card-rarity');
        const cardName = template.querySelector('.card-name');
        const attackValue = template.querySelector('.attack-value');
        const defenseValue = template.querySelector('.defense-value');
        const magicValue = template.querySelector('.magic-value');
        const speedValue = template.querySelector('.speed-value');
        const addIcon = template.querySelector('.add-icon');
        const removeIcon = template.querySelector('.remove-icon');
        const selectionBtn = template.querySelector('.card-selection-btn');
        
        // Définir les attributs et le contenu
        cardItem.dataset.cardId = card._id;
        cardImage.src = card.imageUrl || 'img/placeholder-card.png';
        cardRarity.className = `card-rarity ${card.rarity || 'common'}`;
        cardName.textContent = card.name;
        
        // Statistiques
        if (card.stats) {
            attackValue.textContent = card.stats.attack;
            defenseValue.textContent = card.stats.defense;
            magicValue.textContent = card.stats.magic;
            speedValue.textContent = card.stats.speed;
        } else {
            attackValue.textContent = '-';
            defenseValue.textContent = '-';
            magicValue.textContent = '-';
            speedValue.textContent = '-';
        }
        
        // Afficher l'icône appropriée
        if (isSelected) {
            addIcon.style.display = 'none';
            removeIcon.style.display = 'inline-block';
        } else {
            addIcon.style.display = 'inline-block';
            removeIcon.style.display = 'none';
        }
        
        // Événement
        selectionBtn.addEventListener('click', () => Decks.toggleCardSelection(card._id));
        
        return template;
    };

    // Basculer la sélection d'une carte
    Decks.toggleCardSelection = function(cardId) {
        const index = Bataille.state.selectedCards.indexOf(cardId);
        
        if (index === -1) {
            // Vérifier si on a déjà 10 cartes
            if (Bataille.state.selectedCards.length >= 10) {
                Bataille.UI.showToast('Vous ne pouvez pas sélectionner plus de 10 cartes', 'error');
                return;
            }
            
            // Ajouter la carte
            Bataille.state.selectedCards.push(cardId);
        } else {
            // Retirer la carte
            Bataille.state.selectedCards.splice(index, 1);
        }
        
        // Mettre à jour l'interface
        Decks.updateCardSelectionUI();
    };

    // Créer ou mettre à jour un deck
    Decks.saveDeck = async function(event) {
        event.preventDefault();
        
        // Récupérer les valeurs du formulaire
        const deckId = Bataille.elements.deckId.value;
        const name = Bataille.elements.deckName.value;
        const description = Bataille.elements.deckDescription.value;
        
        // Valider les données
        if (!name) {
            Bataille.UI.showToast('Le nom du deck est requis', 'error');
            return;
        }
        
        try {
            let response;
            
            // Déterminer si c'est une création ou une mise à jour
            if (deckId) {
                // Mise à jour
                response = await fetch(`/bataille/api/decks/${deckId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        description,
                        cards: Bataille.state.selectedCards
                    })
                });
            } else {
                // Création
                response = await fetch('/bataille/api/decks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        description,
                        cards: Bataille.state.selectedCards
                    })
                });
            }
            
            if (!response.ok) {
                throw new Error('Erreur lors de l\'enregistrement du deck');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors de l\'enregistrement du deck');
            }
            
            // Fermer le modal
            Decks.closeDeckModal();
            
            // Afficher un message de succès
            Bataille.UI.showToast(deckId ? 'Deck mis à jour avec succès' : 'Deck créé avec succès', 'success');
            
            // Recharger les decks
            Decks.loadPlayerDecks();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast(error.message, 'error');
        }
    };

    // Supprimer un deck
    Decks.deleteDeck = async function() {
        if (!Bataille.state.currentDeck) return;
        
        try {
            const deckId = Bataille.state.currentDeck._id;
            
            const response = await fetch(`/bataille/api/decks/${deckId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du deck');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors de la suppression du deck');
            }
            
            // Fermer le modal
            Decks.closeDeleteModal();
            
            // Afficher un message de succès
            Bataille.UI.showToast('Deck supprimé avec succès', 'success');
            
            // Recharger les decks
            Decks.loadPlayerDecks();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast(error.message, 'error');
        }
    };

    // Activer un deck
    Decks.activateDeck = async function(deckId) {
        try {
            const response = await fetch(`/bataille/api/decks/${deckId}/activate`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de l\'activation du deck');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors de l\'activation du deck');
            }
            
            // Afficher un message de succès
            Bataille.UI.showToast('Deck activé avec succès', 'success');
            
            // Recharger les decks
            Decks.loadPlayerDecks();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast(error.message, 'error');
        }
    };
    
    // Exposer le module
    Bataille.Decks = Decks;
})();
