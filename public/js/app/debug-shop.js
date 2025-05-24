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
        
        // 3. Test du distributeur
        console.log('\n3️⃣ Test du distributeur...');
        this.checkDistributeur();
        this.testDistributeurClick();
        
        // 4. Fix automatique si nécessaire
        const distributeur = document.getElementById('distributeur-bouton');
        if (distributeur && !distributeur.getAttribute('data-event-attached')) {
            console.log('\n🔧 Aucun événement détecté, correction automatique...');
            this.attachDistributeurEvent();
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
        
        // Vérifier les événements (Chrome uniquement)
        try {
            if (typeof getEventListeners !== 'undefined') {
                const events = getEventListeners(distributeur);
                console.log('📍 Événements du distributeur:', events);
            } else {
                console.log('📍 getEventListeners non disponible (normal sur Firefox/Safari)');
            }
        } catch (e) {
            console.log('📍 Impossible de vérifier les événements');
        }
        
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
                console.log('📞 Appel de handleDistributeurClick...');
                handleDistributeurClick.call(this, event);
            } else {
                console.log('❌ Fonction handleDistributeurClick non trouvée');
                
                // Test simple avec appel API direct
                console.log('🔄 Test avec appel API direct...');
                this.directApiTest();
            }
        });
        
        // Marquer comme ayant un événement
        newDistributeur.setAttribute('data-event-attached', 'manual');
        
        console.log('✅ Événement ajouté manuellement');
        
        // Test immédiat
        setTimeout(() => {
            console.log('🧪 Test automatique du nouvel événement...');
            newDistributeur.click();
        }, 500);
    },
    
    // Test API direct
    directApiTest: async function() {
        console.log('🔬 Test API direct...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ Aucun token trouvé');
            return;
        }
        
        try {
            console.log('📡 Appel de l\'API buy-and-open...');
            const response = await fetch('/api/v1/boosters/buy-and-open', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            console.log('📥 Réponse API:', data);
            
            if (data.success) {
                console.log('🎉 API fonctionne ! Booster obtenu:', data.boosterType);
                alert(`Succès ! Vous avez obtenu un booster ${data.boosterType} avec ${data.cards.length} cartes !`);
            } else {
                console.log('⚠️ Erreur API:', data.message);
                alert(`Erreur: ${data.message}`);
            }
        } catch (error) {
            console.log('💥 Erreur lors de l\'appel API:', error);
            alert(`Erreur de connexion: ${error.message}`);
        }
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
• debugShop.directApiTest() - Test API direct

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
    },
    
    // Correction automatique
    autoFix: function() {
        console.log('🔧 === CORRECTION AUTOMATIQUE ===');
        
        // 1. Aller au shop si nécessaire
        if (!this.checkShopVisibility()) {
            this.goToShop();
        }
        
        // 2. Attacher l'événement au distributeur
        setTimeout(() => {
            this.attachDistributeurEvent();
            
            // 3. Test final
            setTimeout(() => {
                console.log('✅ Correction terminée ! Le distributeur devrait maintenant fonctionner.');
                console.log('🎯 Essayez de cliquer sur le distributeur !');
            }, 1000);
        }, 500);
    }
};

// Message d'aide automatique
console.log('🔧 Outils de débogage du shop chargés !');
console.log('📖 Tapez debugShop.help() pour voir les commandes disponibles');
console.log('🚀 Ou tapez debugShop.autoFix() pour une correction automatique');

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