/**
 * Charge la collection complète de l'utilisateur (statistiques + cartes)
 */
async function loadUserCollection() {
    try {
        showLoading();
        
        // Charger les statistiques et les cartes en parallèle
        const [statsResponse, cardsResponse] = await Promise.all([
            loadCollectionStats(),
            loadUserCards()
        ]);
        
        hideLoading();
        
        // Vérifier que les réponses existent avant d'accéder à leurs propriétés
        if (statsResponse && statsResponse.success) {
            updateStatsDisplay(statsResponse.stats);
        } else {
            console.warn('Erreur lors du chargement des statistiques:', statsResponse);
            // Continuer même si les stats échouent
        }
        
        if (cardsResponse && cardsResponse.success) {
            updateCardsDisplay(cardsResponse);
        } else {
            console.warn('Erreur lors du chargement des cartes:', cardsResponse);
            // Afficher un message d'erreur si les cartes n'ont pas pu être chargées
            showError('Impossible de charger vos cartes. Veuillez réessayer.');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement de la collection:', error);
        hideLoading();
        showError('Erreur lors du chargement de votre collection');
    }
}

/**
 * Charge les statistiques de la collection depuis l'API
 */
async function loadCollectionStats() {
    try {
        const response = await fetch('/api/v1/users/me/cards/stats', {
            method: 'GET',
            headers: apiService.getAuthHeaders()
        });
        
        // Vérifier que la réponse HTTP est OK
        if (!response.ok) {
            console.error('Erreur HTTP lors du chargement des statistiques:', response.status, response.statusText);
            return { success: false, message: `Erreur HTTP: ${response.status}` };
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Charge les cartes de l'utilisateur avec filtres et pagination
 */
async function loadUserCards() {
    try {
        // Construire les paramètres de requête
        const params = new URLSearchParams({
            page: currentPage,
            limit: cardsPerPage,
            sort: currentSort.by,
            order: currentSort.order
        });
        
        // Ajouter les filtres
        if (currentFilters.rarity !== 'all') {
            params.append('rarity', currentFilters.rarity);
        }
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/v1/users/me/cards?${params.toString()}`, {
            method: 'GET',
            headers: apiService.getAuthHeaders()
        });
        
        // Vérifier que la réponse HTTP est OK
        if (!response.ok) {
            console.error('Erreur HTTP lors du chargement des cartes:', response.status, response.statusText);
            return { success: false, message: `Erreur HTTP: ${response.status}` };
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement des cartes:', error);
        return { success: false, message: error.message };
    }
}