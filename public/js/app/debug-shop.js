/**
 * Script de débogage pour le shop
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

// Fonctions de debug globales
window.debugShop = {
    // Vérifier si la section shop est visible
    checkShopVisibility: function() {
        const shopSection = document.getElementById('section-shop');
        if (!shopSection) {
            console.log('❌ Section shop non trouvée');
            return false;
        }
        
        const isHidden = shopSection.classList.contains('hidden');
        console.log(`📍 Section shop: ${isHidden ? 'CACHÉE' : 'VISIBLE'}`);
        console.log('📍 Classes de la section:', shopSection.className);
        return !isHidden;
    },
    
    // Vérifier si le distributeur existe
    checkDistributeur: function() {
        const distributeur = document.getElementById('distributeur-bouton');
        if (!distributeur) {
            console.log('❌ Distributeur non trouvé');
            return false;
        }
        
        console.log('✅ Distributeur trouvé');
        console.log('📍 Événements attachés:', distributeur.getAttribute('data-event-attached'));
        console.log('📍 Classes du distributeur:', distributeur.className);
        return true;
    },
    
    // Forcer l'initialisation des événements
    forceInitEvents: function() {
        console.log('🔧 Forçage de l\'initialisation des événements...');
        if (typeof initShopEvents === 'function') {
            initShopEvents();
            console.log('✅ Événements réinitialisés');
        } else {
            console.log('❌ Fonction initShopEvents non trouvée');
        }
    },
    
    // Aller à la section shop
    goToShop: function() {
        console.log('🏪 Navigation vers le shop...');
        const shopLink = document.querySelector('[data-section="shop"]');
        if (shopLink) {
            shopLink.click();
            console.log('✅ Clic sur le lien shop effectué');
            
            // Vérifier après un délai
            setTimeout(() => {
                this.checkShopVisibility();
                this.checkDistributeur();
            }, 200);
        } else {
            console.log('❌ Lien shop non trouvé');
        }
    },
    
    // Test complet
    fullTest: function() {
        console.log('🔍 === TEST COMPLET DU SHOP ===');
        
        // 1. Vérifier la navigation
        console.log('\n1️⃣ Vérification de la navigation...');
        const shopLink = document.querySelector('[data-section="shop"]');
        console.log('Lien shop:', shopLink ? '✅ Trouvé' : '❌ Non trouvé');
        
        // 2. Vérifier la section
        console.log('\n2️⃣ Vérification de la section...');
        this.checkShopVisibility();
        
        // 3. Aller au shop si pas visible
        if (!this.checkShopVisibility()) {
            console.log('\n3️⃣ Navigation vers le shop...');
            this.goToShop();
            
            // Test après navigation
            setTimeout(() => {
                console.log('\n4️⃣ Test après navigation...');
                this.checkShopVisibility();
                this.checkDistributeur();
                this.testDistributeurClick();
            }, 500);
        } else {
            console.log('\n3️⃣ Test du distributeur...');
            this.checkDistributeur();
            this.testDistributeurClick();
        }
    },
    
    // Tester le clic sur le distributeur
    testDistributeurClick: function() {
        console.log('\n🎰 Test du clic sur le distributeur...');
        const distributeur = document.getElementById('distributeur-bouton');
        
        if (!distributeur) {
            console.log('❌ Distributeur non trouvé');
            return;
        }
        
        // Vérifier les événements
        const events = getEventListeners ? getEventListeners(distributeur) : 'Non disponible (utilisez Chrome DevTools)';
        console.log('📍 Événements du distributeur:', events);
        
        // Test de clic manuel
        console.log('🖱️ Simulation d\'un clic...');
        try {
            distributeur.click();
            console.log('✅ Clic simulé avec succès');
        } catch (error) {
            console.log('❌ Erreur lors du clic:', error);
        }
    },
    
    // Vérifier l'état des variables globales
    checkGlobalState: function() {
        console.log('\n📊 État des variables globales:');
        console.log('userBalance:', typeof userBalance !== 'undefined' ? userBalance : 'Non défini');
        console.log('boosterConfig:', typeof boosterConfig !== 'undefined' ? boosterConfig : 'Non défini');
        console.log('distributeurAnimating:', typeof distributeurAnimating !== 'undefined' ? distributeurAnimating : 'Non défini');
        console.log('shopEventsInitialized:', typeof shopEventsInitialized !== 'undefined' ? shopEventsInitialized : 'Non défini');
        
        // Vérifier le token
        const token = localStorage.getItem('token');
        console.log('Token présent:', token ? '✅ Oui' : '❌ Non');
    },
    
    // Ajouter manuellement l'événement au distributeur
    attachDistributeurEvent: function() {
        console.log('🔧 Ajout manuel de l\'événement au distributeur...');
        const distributeur = document.getElementById('distributeur-bouton');
        
        if (!distributeur) {
            console.log('❌ Distributeur non trouvé');
            return;
        }
        
        // Supprimer les anciens événements
        const newDistributeur = distributeur.cloneNode(true);
        distributeur.parentNode.replaceChild(newDistributeur, distributeur);
        
        // Ajouter le nouvel événement
        newDistributeur.addEventListener('click', function(event) {
            console.log('🎰 CLIC DÉTECTÉ SUR LE DISTRIBUTEUR !', event);
            
            // Appeler la fonction si elle existe
            if (typeof handleDistributeurClick === 'function') {
                handleDistributeurClick.call(this, event);
            } else {
                console.log('❌ Fonction handleDistributeurClick non trouvée');
                
                // Test simple
                alert('Distributeur cliqué ! (test simple)');
            }
        });
        
        console.log('✅ Événement ajouté manuellement');
    },
    
    // Instructions pour l'utilisateur
    help: function() {
        console.log(`
🆘 === AIDE DÉBOGAGE SHOP ===

Commandes disponibles:
• debugShop.fullTest() - Test complet
• debugShop.goToShop() - Aller au shop  
• debugShop.checkDistributeur() - Vérifier le distributeur
• debugShop.testDistributeurClick() - Tester le clic
• debugShop.attachDistributeurEvent() - Forcer l'événement
• debugShop.checkGlobalState() - Vérifier les variables
• debugShop.forceInitEvents() - Réinitialiser les événements

📋 ÉTAPES DE DIAGNOSTIC:
1. Exécutez debugShop.fullTest()
2. Si le distributeur ne répond pas, essayez debugShop.attachDistributeurEvent()
3. Vérifiez les erreurs dans la console
4. Assurez-vous d'être connecté (token présent)

🐛 PROBLÈMES COURANTS:
• Section shop cachée → Cliquez sur "Shop" dans le menu
• Pas d'événements → Exécutez attachDistributeurEvent()
• Pas de token → Connectez-vous d'abord
• Erreurs JS → Vérifiez la console pour plus de détails
        `);
    }
};

// Message d'aide automatique
console.log('🔧 Outils de débogage du shop chargés !');
console.log('📖 Tapez debugShop.help() pour voir les commandes disponibles');
console.log('🚀 Ou tapez debugShop.fullTest() pour un test complet');

// Auto-diagnostic au chargement si on est sur le shop
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const shopSection = document.getElementById('section-shop');
        if (shopSection && !shopSection.classList.contains('hidden')) {
            console.log('🏪 Shop détecté comme visible, lancement du diagnostic...');
            window.debugShop.fullTest();
        }
    }, 1000);
});