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
    
    // Initialiser les écouteurs d'événements globaux
    initGlobalEventListeners();
});

/**
 * Initialise les écouteurs d'événements globaux pour l'interface
 */
function initGlobalEventListeners() {
    // Fermeture des menus déroulants lors d'un clic ailleurs sur la page
    document.addEventListener('click', function(event) {
        // Gérer les dropdowns de filtre et de tri
        const filterDropdown = document.getElementById('filter-dropdown');
        const sortDropdown = document.getElementById('sort-dropdown');
        const filterButton = document.getElementById('filter-cards');
        const sortButton = document.getElementById('sort-cards');
        
        // Si on clique en dehors du bouton de filtre et de son dropdown
        if (filterDropdown && !filterDropdown.contains(event.target) && !filterButton.contains(event.target)) {
            filterDropdown.classList.add('hidden');
        }
        
        // Si on clique en dehors du bouton de tri et de son dropdown
        if (sortDropdown && !sortDropdown.contains(event.target) && !sortButton.contains(event.target)) {
            sortDropdown.classList.add('hidden');
        }
    });

    // S'assurer que les menus déroulants fonctionnent même si loadUserCards() n'a pas encore été appelé
    const filterButton = document.getElementById('filter-cards');
    const sortButton = document.getElementById('sort-cards');
    
    if (filterButton) {
        filterButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('filter-dropdown');
            dropdown.classList.toggle('hidden');
            
            // Cacher le dropdown de tri si ouvert
            const sortDropdown = document.getElementById('sort-dropdown');
            if (sortDropdown) {
                sortDropdown.classList.add('hidden');
            }
        });
    }
    
    if (sortButton) {
        sortButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('sort-dropdown');
            dropdown.classList.toggle('hidden');
            
            // Cacher le dropdown de filtre si ouvert
            const filterDropdown = document.getElementById('filter-dropdown');
            if (filterDropdown) {
                filterDropdown.classList.add('hidden');
            }
        });
    }
    
    // Gérer les événements pour les boutons d'application de filtre et de tri
    const applyFiltersButton = document.getElementById('apply-filters');
    const applySortButton = document.getElementById('apply-sort');
    
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            const filterDropdown = document.getElementById('filter-dropdown');
            filterDropdown.classList.add('hidden');
        });
    }
    
    if (applySortButton) {
        applySortButton.addEventListener('click', function() {
            const sortDropdown = document.getElementById('sort-dropdown');
            sortDropdown.classList.add('hidden');
        });
    }
}
