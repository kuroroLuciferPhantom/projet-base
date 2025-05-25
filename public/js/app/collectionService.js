    // Charger les cartes de l'utilisateur avec filtres et pagination
    async loadUserCards() {
        try {
            console.log('[CollectionService] Loading user cards from API...');
            
            // Utiliser l'API existante dans apiService
            const response = await window.apiService.getUserCards();
            console.log('[CollectionService] API response:', response);
            
            if (response.success) {
                // Traiter la réponse pour correspondre au format attendu
                // L'API retourne { success: true, data: { cards: [...], pagination: {...} } }
                const cards = response.data?.cards || response.cards || [];
                const pagination = response.data?.pagination || {};
                
                console.log('[CollectionService] Extracted cards:', cards);
                console.log('[CollectionService] Pagination info:', pagination);
                
                return {
                    success: true,
                    cards: cards,
                    total: pagination.total || cards.length,
                    totalPages: pagination.pages || Math.ceil(cards.length / this.cardsPerPage),
                    currentPage: pagination.current || 1
                };
            } else {
                return response;
            }
            
        } catch (error) {
            console.error('[CollectionService] Error loading cards:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    },