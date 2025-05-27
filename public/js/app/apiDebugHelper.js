/**
 * Script de débogage pour diagnostiquer les problèmes de l'API
 * À ajouter temporairement pour diagnostiquer les problèmes
 */

window.apiDebugHelper = {
    // Tester la connectivité de base
    async testBasicConnectivity() {
        console.log('[API Debug] Testing basic connectivity...');
        
        try {
            const response = await fetch('/api/v1/test', {
                method: 'GET'
            });
            
            if (response.ok) {
                console.log('[API Debug] ✅ Basic API connectivity OK');
                return true;
            } else {
                console.log('[API Debug] ❌ API response not OK:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.log('[API Debug] ❌ API connectivity failed:', error);
            return false;
        }
    },
    
    // Tester l'authentification
    async testAuthentication() {
        console.log('[API Debug] Testing authentication...');
        
        if (!window.apiService) {
            console.log('[API Debug] ❌ apiService not available');
            return false;
        }
        
        const isLoggedIn = window.apiService.isLoggedIn();
        console.log('[API Debug] User logged in:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('[API Debug] ❌ User not logged in');
            return false;
        }
        
        const token = window.apiService.token;
        console.log('[API Debug] Token available:', !!token);
        
        if (token) {
            try {
                // Décoder le token pour voir son contenu
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('[API Debug] Token payload:', payload);
                
                // Vérifier l'expiration
                const now = Date.now() / 1000;
                if (payload.exp && payload.exp < now) {
                    console.log('[API Debug] ❌ Token expired');
                    return false;
                } else {
                    console.log('[API Debug] ✅ Token valid');
                    return true;
                }
            } catch (error) {
                console.log('[API Debug] ❌ Error decoding token:', error);
                return false;
            }
        }
        
        return false;
    },
    
    // Tester l'endpoint des cartes
    async testCardsEndpoint() {
        console.log('[API Debug] Testing cards endpoint...');
        
        if (!window.apiService || !window.apiService.isLoggedIn()) {
            console.log('[API Debug] ❌ Not authenticated, skipping cards test');
            return false;
        }
        
        try {
            // Test direct de l'endpoint
            const response = await fetch('/api/v1/cards', {
                method: 'GET',
                headers: window.apiService.getAuthHeaders()
            });
            
            console.log('[API Debug] Cards endpoint response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[API Debug] ✅ Cards endpoint response:', data);
                return true;
            } else {
                const errorText = await response.text();
                console.log('[API Debug] ❌ Cards endpoint error:', response.status, errorText);
                return false;
            }
        } catch (error) {
            console.log('[API Debug] ❌ Cards endpoint request failed:', error);
            return false;
        }
    },
    
    // Tester l'endpoint du profil utilisateur
    async testUserProfileEndpoint() {
        console.log('[API Debug] Testing user profile endpoint...');
        
        if (!window.apiService || !window.apiService.isLoggedIn()) {
            console.log('[API Debug] ❌ Not authenticated, skipping profile test');
            return false;
        }
        
        try {
            const response = await fetch('/api/v1/users/me', {
                method: 'GET',
                headers: window.apiService.getAuthHeaders()
            });
            
            console.log('[API Debug] Profile endpoint response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[API Debug] ✅ Profile endpoint response:', data);
                return true;
            } else {
                const errorText = await response.text();
                console.log('[API Debug] ❌ Profile endpoint error:', response.status, errorText);
                return false;
            }
        } catch (error) {
            console.log('[API Debug] ❌ Profile endpoint request failed:', error);
            return false;
        }
    },
    
    // Lister tous les endpoints disponibles
    async discoverEndpoints() {
        console.log('[API Debug] Discovering available endpoints...');
        
        const commonEndpoints = [
            '/api/v1/auth/login',
            '/api/v1/auth/register',
            '/api/v1/users/me',
            '/api/v1/cards',
            '/api/v1/boosters',
            '/api/v1/marketplace',
            '/api/v1/test'
        ];
        
        for (const endpoint of commonEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: window.apiService ? window.apiService.getAuthHeaders() : {}
                });
                
                console.log(`[API Debug] ${endpoint}: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`[API Debug] ${endpoint}: ERROR - ${error.message}`);
            }
        }
    },
    
    // Test complet
    async runFullDiagnostic() {
        console.log('[API Debug] Running full diagnostic...');
        console.log('='.repeat(50));
        
        const results = {
            connectivity: await this.testBasicConnectivity(),
            authentication: await this.testAuthentication(),
            cardsEndpoint: await this.testCardsEndpoint(),
            userProfile: await this.testUserProfileEndpoint()
        };
        
        console.log('[API Debug] Diagnostic Results:');
        console.log('- Basic Connectivity:', results.connectivity ? '✅' : '❌');
        console.log('- Authentication:', results.authentication ? '✅' : '❌');
        console.log('- Cards Endpoint:', results.cardsEndpoint ? '✅' : '❌');
        console.log('- User Profile:', results.userProfile ? '✅' : '❌');
        
        console.log('='.repeat(50));
        
        // Recommandations
        if (!results.connectivity) {
            console.log('[API Debug] 🔧 RECOMMENDATION: Check if the API server is running');
        }
        
        if (!results.authentication) {
            console.log('[API Debug] 🔧 RECOMMENDATION: Check user login and token validity');
        }
        
        if (!results.cardsEndpoint) {
            console.log('[API Debug] 🔧 RECOMMENDATION: Check cards API route configuration');
        }
        
        if (!results.userProfile) {
            console.log('[API Debug] 🔧 RECOMMENDATION: Check user profile API route');
        }
        
        await this.discoverEndpoints();
        
        return results;
    },
    
    // Créer des cartes de test si l'utilisateur n'en a pas
    async createTestCards() {
        console.log('[API Debug] Creating test cards...');
        
        if (!window.apiService || !window.apiService.isLoggedIn()) {
            console.log('[API Debug] ❌ Not authenticated, cannot create test cards');
            return false;
        }
        
        const testCards = [
            {
                name: "Carte de Test 1",
                description: "Une carte créée pour les tests",
                rarity: "common",
                stats: { attack: 50, defense: 40, magic: 30, speed: 60 }
            },
            {
                name: "Carte de Test 2", 
                description: "Une autre carte de test",
                rarity: "rare",
                stats: { attack: 70, defense: 60, magic: 50, speed: 80 }
            }
        ];
        
        for (const card of testCards) {
            try {
                const response = await fetch('/api/v1/cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...window.apiService.getAuthHeaders()
                    },
                    body: JSON.stringify(card)
                });
                
                if (response.ok) {
                    const createdCard = await response.json();
                    console.log('[API Debug] ✅ Test card created:', createdCard);
                } else {
                    console.log('[API Debug] ❌ Failed to create test card:', response.status);
                }
            } catch (error) {
                console.log('[API Debug] ❌ Error creating test card:', error);
            }
        }
    }
};

// Auto-run diagnostic when script loads
console.log('[API Debug] Debug helper loaded. Use window.apiDebugHelper.runFullDiagnostic() to run tests');

// En mode développement, exécuter automatiquement le diagnostic
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
        window.apiDebugHelper.runFullDiagnostic();
    }, 2000);
}
