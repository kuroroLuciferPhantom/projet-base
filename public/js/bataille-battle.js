/**
 * Module de combat pour la bataille
 * Gère les combats entre joueurs
 */

(function() {
    // S'assurer que le namespace existe
    window.Bataille = window.Bataille || {};
    
    // Module Battle
    const Battle = {};
    
    // Sélectionner un deck pour le combat
    Battle.selectDeckForBattle = function(deckId) {
        // Mettre à jour l'état
        Bataille.state.selectedDeckForBattle = deckId;
        
        // Activer le bouton de combat
        Bataille.elements.startBattleBtn.disabled = false;
        
        // Mettre à jour l'interface
        Battle.updateBattleDecksUI();
    };
    
    // Mettre à jour l'interface des decks de combat
    Battle.updateBattleDecksUI = function() {
        // Vérifier s'il y a des decks complets (10 cartes)
        const completeDecks = Bataille.state.decks.filter(deck => deck.cards.length === 10);
        
        if (completeDecks.length === 0) {
            Bataille.elements.noBattleDecks.style.display = 'block';
            Bataille.elements.battleDecksList.innerHTML = '';
            Bataille.elements.startBattleBtn.disabled = true;
            return;
        }
        
        Bataille.elements.noBattleDecks.style.display = 'none';
        Bataille.elements.battleDecksList.innerHTML = '';
        
        // Ajouter les decks à la liste
        completeDecks.forEach(deck => {
            const deckElement = Battle.createBattleDeckElement(deck);
            Bataille.elements.battleDecksList.appendChild(deckElement);
        });
        
        // Vérifier s'il y a un deck sélectionné
        Bataille.elements.startBattleBtn.disabled = Bataille.state.selectedDeckForBattle === null;
    };
    
    // Créer un élément de deck pour le combat
    Battle.createBattleDeckElement = function(deck) {
        const template = Bataille.templates.battleDeck.content.cloneNode(true);
        
        // Récupérer les éléments
        const deckOption = template.querySelector('.battle-deck-option');
        const deckName = template.querySelector('.battle-deck-name');
        const cardCount = template.querySelector('.card-count');
        const winCount = template.querySelector('.win-count');
        const lossCount = template.querySelector('.loss-count');
        const deckPreview = template.querySelector('.battle-deck-preview');
        const selectBtn = template.querySelector('.select-deck-btn');
        
        // Définir les attributs et le contenu
        deckOption.dataset.deckId = deck._id;
        deckName.textContent = deck.name;
        cardCount.textContent = deck.cards.length;
        winCount.textContent = deck.stats ? deck.stats.wins : 0;
        lossCount.textContent = deck.stats ? deck.stats.losses : 0;
        
        // Aperçu des cartes
        if (deck.cards && deck.cards.length > 0) {
            deck.cards.forEach(card => {
                const cardPreview = document.createElement('div');
                cardPreview.className = `card-preview ${card.rarity}`;
                cardPreview.style.backgroundImage = `url(${card.imageUrl})`;
                deckPreview.appendChild(cardPreview);
            });
        }
        
        // Marquer comme sélectionné si c'est le cas
        if (Bataille.state.selectedDeckForBattle === deck._id) {
            deckOption.classList.add('selected');
            selectBtn.textContent = 'Sélectionné';
        }
        
        // Événement
        selectBtn.addEventListener('click', () => Battle.selectDeckForBattle(deck._id));
        
        return template;
    };
    
    // Lancer un combat
    Battle.startBattle = async function() {
        if (!Bataille.state.selectedDeckForBattle) {
            Bataille.UI.showToast('Veuillez sélectionner un deck', 'error');
            return;
        }
        
        try {
            const response = await fetch('/bataille/api/battle/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deckId: Bataille.state.selectedDeckForBattle
                })
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du lancement du combat');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du lancement du combat');
            }
            
            // Afficher un message de succès
            Bataille.UI.showToast('Combat initialisé avec succès', 'success');
            
            // Dans une future version, rediriger vers la page de combat
            // Pour l'instant, afficher un message
            Bataille.UI.showToast('La fonctionnalité de combat sera disponible prochainement', 'info');
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast(error.message, 'error');
        }
    };
    
    // Exposer le module
    Bataille.Battle = Battle;
})();
