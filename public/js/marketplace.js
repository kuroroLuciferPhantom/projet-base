/**
 * EpicFactionCommunity - JavaScript pour la marketplace
 * Ce fichier contient les fonctions JavaScript pour la marketplace
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialiser les fonctionnalités de la marketplace
  initializeMarketplace();
});

/**
 * Initialiser toutes les fonctionnalités de la marketplace
 */
function initializeMarketplace() {
  // Initialiser les modals et popovers
  initializeModals();
  
  // Initialiser les formulaires
  initializeForms();
  
  // Initialiser les actions d'achat/vente
  initializeMarketActions();
  
  // Initialiser les filtres
  initializeFilters();
  
  // Initialiser les statistiques (si la page contient une section stats)
  if (document.getElementById('market-stats')) {
    loadMarketStats();
  }
}

/**
 * Initialiser les modals et popovers
 */
function initializeModals() {
  // Gérer l'ouverture des modals
  document.querySelectorAll('[data-modal-target]').forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal-target');
      const modal = document.getElementById(modalId);
      
      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  });
  
  // Gérer la fermeture des modals
  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal-close');
      const modal = document.getElementById(modalId);
      
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });
  
  // Fermer le modal lors d'un clic à l'extérieur
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', function(event) {
      if (event.target === this) {
        this.classList.add('hidden');
      }
    });
  });
}

/**
 * Initialiser les formulaires
 */
function initializeForms() {
  // Formulaire de mise en vente
  const sellForm = document.getElementById('sell-form');
  if (sellForm) {
    sellForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const cardId = document.getElementById('sell-button').dataset.cardId;
      const price = parseFloat(document.getElementById('price').value);
      
      if (!price || price <= 0) {
        showToast('error', 'Erreur', 'Le prix doit être supérieur à 0.');
        return;
      }
      
      // Utiliser le service API pour mettre la carte en vente
      window.apiService.sellCard(cardId, price)
        .then(data => {
          if (data.success) {
            showToast('success', 'Succès', 'Carte mise en vente avec succès !');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showToast('error', 'Erreur', data.error?.message || 'Une erreur est survenue');
          }
        })
        .catch(error => {
          console.error('Erreur:', error);
          showToast('error', 'Erreur', 'Une erreur est survenue lors de la mise en vente');
        });
    });
  }
  
  // Formulaire de filtres
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    // Mettre à jour l'URL lorsque les filtres changent
    filterForm.querySelectorAll('select, input').forEach(input => {
      input.addEventListener('change', function() {
        if (input.name === 'sort') {
          filterForm.submit();
        }
      });
    });
  }
}

/**
 * Initialiser les actions d'achat/vente
 */
function initializeMarketActions() {
  // Action d'achat
  const buyButton = document.getElementById('confirm-buy');
  if (buyButton) {
    buyButton.addEventListener('click', function() {
      const cardId = document.getElementById('buy-button').dataset.cardId;
      
      // Utiliser le service API pour acheter la carte
      window.apiService.buyCard(cardId)
        .then(data => {
          if (data.success) {
            document.getElementById('buy-confirm-modal').classList.add('hidden');
            showToast('success', 'Succès', 'Carte achetée avec succès !');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            document.getElementById('buy-confirm-modal').classList.add('hidden');
            showToast('error', 'Erreur', data.error?.message || 'Une erreur est survenue');
          }
        })
        .catch(error => {
          console.error('Erreur:', error);
          document.getElementById('buy-confirm-modal').classList.add('hidden');
          showToast('error', 'Erreur', 'Une erreur est survenue lors de l\'achat');
        });
    });
  }
  
  // Action de retrait du marché
  const removeButton = document.getElementById('confirm-remove');
  if (removeButton) {
    removeButton.addEventListener('click', function() {
      const cardId = document.getElementById('remove-button').dataset.cardId;
      
      // Utiliser le service API pour retirer la carte du marché
      window.apiService.removeFromMarket(cardId)
        .then(data => {
          if (data.success) {
            document.getElementById('remove-confirm-modal').classList.add('hidden');
            showToast('success', 'Succès', 'Carte retirée du marché avec succès !');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            document.getElementById('remove-confirm-modal').classList.add('hidden');
            showToast('error', 'Erreur', data.error?.message || 'Une erreur est survenue');
          }
        })
        .catch(error => {
          console.error('Erreur:', error);
          document.getElementById('remove-confirm-modal').classList.add('hidden');
          showToast('error', 'Erreur', 'Une erreur est survenue lors du retrait');
        });
    });
  }
}

/**
 * Initialiser les filtres
 */
function initializeFilters() {
  const priceRangeMin = document.getElementById('minPrice');
  const priceRangeMax = document.getElementById('maxPrice');
  
  if (priceRangeMin && priceRangeMax) {
    // S'assurer que le prix minimum ne dépasse pas le prix maximum
    priceRangeMin.addEventListener('change', function() {
      if (priceRangeMax.value && Number(this.value) > Number(priceRangeMax.value)) {
        priceRangeMax.value = this.value;
      }
    });
    
    // S'assurer que le prix maximum n'est pas inférieur au prix minimum
    priceRangeMax.addEventListener('change', function() {
      if (priceRangeMin.value && Number(this.value) < Number(priceRangeMin.value)) {
        priceRangeMin.value = this.value;
      }
    });
  }
}

/**
 * Charger les statistiques du marché
 */
function loadMarketStats() {
  const statsContainer = document.getElementById('market-stats');
  if (!statsContainer) return;
  
  // Afficher un loader
  statsContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></div>';
  
  // Utiliser le service API pour récupérer les statistiques
  window.apiService.getStats()
    .then(data => {
      if (data.success && data.data?.stats) {
        renderMarketStats(data.data.stats);
      } else {
        statsContainer.innerHTML = '<div class="alert alert-danger">Impossible de charger les statistiques.</div>';
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement des statistiques:', error);
      statsContainer.innerHTML = '<div class="alert alert-danger">Une erreur est survenue lors du chargement des statistiques.</div>';
    });
}

/**
 * Afficher les statistiques du marché
 * @param {Object} stats - Données statistiques du marché
 */
function renderMarketStats(stats) {
  const statsContainer = document.getElementById('market-stats');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Utilisateurs</h3>
        <p class="text-3xl font-bold text-indigo-500">${stats.totalUsers || 0}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Cartes uniques</h3>
        <p class="text-3xl font-bold text-indigo-500">${stats.totalCards || 0}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Cartes possédées</h3>
        <p class="text-3xl font-bold text-indigo-500">${stats.totalPlayerCards || 0}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Cartes en vente</h3>
        <p class="text-3xl font-bold text-indigo-500">${stats.cardsForSale || 0}</p>
      </div>
    </div>
    <div class="mt-6">
      <h3 class="text-xl font-semibold text-gray-700 mb-3">Transactions récentes</h3>
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carte</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acheteur</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${renderRecentTransactions(stats.recentTransactions || [])}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Générer le HTML pour les transactions récentes
 * @param {Array} transactions - Liste des transactions récentes
 * @returns {string} - HTML généré
 */
function renderRecentTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Aucune transaction récente</td></tr>';
  }
  
  return transactions.map(tx => {
    const date = new Date(tx.date);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    const cardName = tx.card?.card?.name || 'Carte inconnue';
    const sellerName = tx.seller?.username || 'Utilisateur inconnu';
    const buyerName = tx.buyer?.username || 'Utilisateur inconnu';
    
    return `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cardName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${sellerName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${buyerName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.price} tokens</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Afficher un message toast (notification)
 * @param {string} type - Type de notification ('success', 'error')
 * @param {string} title - Titre de la notification
 * @param {string} message - Message à afficher
 */
function showToast(type, title, message) {
  const toast = document.getElementById('notification-toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  
  if (!toast) return;
  
  // Définir l'icône en fonction du type
  if (type === 'success') {
    toastIcon.innerHTML = '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else if (type === 'error') {
    toastIcon.innerHTML = '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }
  
  // Définir le contenu
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // Afficher le toast
  toast.classList.remove('hidden');
  
  // Masquer le toast après 5 secondes
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 5000);
}
