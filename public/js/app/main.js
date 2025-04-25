/**
 * Script principal de l'application
 * Initialise toutes les fonctionnalités au chargement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est authentifié et initialiser l'interface
    initAuth();
    
    // Initialiser la navigation
    initNavigation();
    
    // Initialiser les tutoriels si nécessaire
    initTutorial();
    
    // Configurer la modale de détail des cartes
    setupCardDetailModal();
});
