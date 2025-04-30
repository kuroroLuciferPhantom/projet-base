function setupCardDetailModal() {
    const modal = document.getElementById('card-detail-modal');
    const closeBtn = document.getElementById('close-card-detail');
    
    // Fermer la modale quand on clique sur le bouton de fermeture
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
    });
    
    // Fermer la modale quand on clique en dehors du contenu
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Empêcher la propagation du clic depuis le contenu
    const modalContent = modal.querySelector('.modal-content');
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Actions des boutons
    document.getElementById('action-sell').addEventListener('click', function() {
        alert('Fonctionnalité de vente à venir !');
    });
    
    document.getElementById('action-fusion').addEventListener('click', function() {
        alert('Fonctionnalité de fusion à venir !');
    });
    
    document.getElementById('action-burn').addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir détruire cette carte ? Cette action est irréversible.')) {
            alert('Carte détruite (simulation). Dans une version réelle, une transaction blockchain serait initiée.');
            modal.classList.remove('active');
        }
    });
    
    document.getElementById('action-view-chain').addEventListener('click', function() {
        const tokenId = document.getElementById('card-token-id').textContent;
        const contract = document.getElementById('card-contract').textContent;
        if (tokenId !== '--' && contract !== '--') {
            // Ouvrir l'explorateur de blockchain dans un nouvel onglet
            window.open(`https://goerli.arbiscan.io/token/${contract}?a=${tokenId}`, '_blank');
        } else {
            alert('Informations blockchain non disponibles pour cette carte.');
        }
    });
}

// Fonction pour afficher les détails d'une carte
function showCardDetails(cardData) {
    console.log('Données de la carte:', cardData);
    const modal = document.getElementById('card-detail-modal');
    
    // Mettre à jour le contenu de la modale avec les données de la carte
    document.getElementById('card-detail-name').textContent = cardData.name;
    
    // Mise à jour de la rareté
    const rarityElement = document.getElementById('card-detail-rarity');
    rarityElement.textContent = cardData.rarity.charAt(0).toUpperCase() + cardData.rarity.slice(1);
    rarityElement.className = 'card-detail-rarity ' + cardData.rarity;
    
    // Mise à jour de l'image
    const imageContainer = document.querySelector('.card-detail-image-modal');
    const img = new Image();  // Crée un nouvel élément Image
    img.src = cardData.image;
    img.alt = cardData.name;

    img.onload = function() {
        console.log('Image loaded:', cardData.image);
        // Une fois l'image chargée, insère-la dans le conteneur
        imageContainer.innerHTML = ''; // Effacer le contenu existant (si nécessaire)
        imageContainer.appendChild(img);
    };

    img.onerror = function() {
        console.error('Image not found:', cardData.image);
        // Optionnel : afficher une image par défaut ou un message d'erreur
    };
    
    // Mise à jour des statistiques
    document.getElementById('card-atk-value').textContent = cardData.attack;
    document.getElementById('card-def-value').textContent = cardData.defense;
    
    // Calcul du pourcentage pour les barres de statistiques (sur une base de 100 maximum)
    const maxStat = 100;
    const atkPercentage = Math.min((cardData.attack / maxStat) * 100, 100);
    const defPercentage = Math.min((cardData.defense / maxStat) * 100, 100);
    
    // Simulation d'XP (dans une application réelle, cela viendrait des données)
    const xp = cardData.xp || Math.floor(Math.random() * 100);
    const xpPercentage = (xp / 100) * 100;
    
    document.getElementById('card-atk-bar').style.width = `${atkPercentage}%`;
    document.getElementById('card-def-bar').style.width = `${defPercentage}%`;
    document.getElementById('card-xp-bar').style.width = `${xpPercentage}%`;
    document.getElementById('card-xp-value').textContent = `${xp}/100`;
    
    // Mise à jour des métadonnées blockchain (simulées)
    document.getElementById('card-token-id').textContent = cardData.tokenId || `#${Math.floor(Math.random() * 10000000)}`;
    document.getElementById('card-contract').textContent = cardData.contract || '0x1234...5678';
    document.getElementById('card-obtained-date').textContent = cardData.obtainedDate || new Date().toLocaleDateString();
    
    // Afficher la modale
    modal.classList.add('active');
}

// Configuration initiale de la modale
setupCardDetailModal();