/**
 * Gestion du tutoriel pour les nouveaux utilisateurs
 */

/**
 * Initialise le tutoriel et ses interactions
 */
function initTutorial() {
    // Navigation entre les étapes du tutoriel
    const tutorialNext = document.querySelectorAll('.tutorial-next');
    const tutorialPrev = document.querySelectorAll('.tutorial-prev');
    
    tutorialNext.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentModal = this.closest('.modal');
            const nextModalId = this.getAttribute('data-next');
            
            currentModal.style.display = 'none';
            document.getElementById(nextModalId).style.display = 'flex';
        });
    });
    
    tutorialPrev.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentModal = this.closest('.modal');
            const prevModalId = this.getAttribute('data-prev');
            
            currentModal.style.display = 'none';
            document.getElementById(prevModalId).style.display = 'flex';
        });
    });
    
    // Récupérer le premier booster
    const claimBoosterBtn = document.getElementById('claim-first-booster');
    if (claimBoosterBtn) {
        claimBoosterBtn.addEventListener('click', async function() {
            try {
                // Fermer la modale de tutoriel
                document.getElementById('tutorial-reward').style.display = 'none';
                
                // Dans une implémentation réelle, faire une requête au serveur
                const token = localStorage.getItem('token');
                if (token) {
                    // Faire une requête au serveur
                    const response = await fetch('/api/boosters/first', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    // Simuler une réponse réussie
                    // const data = await response.json();
                }
                
                // Afficher la modale d'ouverture de booster
                document.getElementById('booster-opening-modal').style.display = 'flex';
            } catch (error) {
                console.error('Erreur lors de la récupération du booster:', error);
                alert('Une erreur est survenue lors de la récupération du booster. Veuillez réessayer.');
            }
        });
    }
}