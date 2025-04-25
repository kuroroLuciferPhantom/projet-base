/**
 * Gestion de la navigation entre les sections
 */

/**
 * Initialise la navigation entre les différentes sections
 */
function initNavigation() {
    // Navigation dans la sidebar
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('main section.wallet-connected');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.getAttribute('data-section');
            
            // Mettre à jour les classes actives pour tous les liens
            navLinks.forEach(lnk => lnk.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // Masquer toutes les sections et afficher celle sélectionnée
            sections.forEach(section => section.classList.add('hidden'));
            
            const targetSection = document.getElementById('section-' + sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            } else {
                console.warn('Section non trouvée:', 'section-' + sectionId);
            }
        });
    });

    // Actions de la page de collection
    const buyPackBtn = document.getElementById('buy-pack');
    if (buyPackBtn) {
        buyPackBtn.addEventListener('click', function() {
            // Rediriger vers la boutique
            document.querySelector('[data-section="shop"]').click();
        });
    }
    
    const visitMarketplaceBtn = document.getElementById('visit-marketplace');
    if (visitMarketplaceBtn) {
        visitMarketplaceBtn.addEventListener('click', function() {
            // Rediriger vers le marché
            document.querySelector('[data-section="marketplace"]').click();
        });
    }
}