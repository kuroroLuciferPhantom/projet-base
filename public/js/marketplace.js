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
      const price = document.getElementById('price').value;
      
      if (!price || price <= 0) {
        showToast('error', 'Erreur', 'Le prix doit être supérieur à 0.');
        return;
      }
      
      // Envoyer la requête pour mettre la carte en vente
      fetch('/marketplace/api/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, price }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast('success', 'Succès', 'Carte mise en vente avec succès !');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showToast('error', 'Erreur', data.message || 'Une erreur est survenue');
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
      
      // Envoyer la requête pour acheter la carte
      fetch('/marketplace/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          document.getElementById('buy-confirm-modal').classList.add('hidden');
          showToast('success', 'Succès', 'Carte achetée avec succès !');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          document.getElementById('buy-confirm-modal').classList.add('hidden');
          showToast('error', 'Erreur', data.message || 'Une erreur est survenue');
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
      
      // Envoyer la requête pour retirer la carte du marché
      fetch(`/marketplace/api/card/${cardId}/listing`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          document.getElementById('remove-confirm-modal').classList.add('hidden');
          showToast('success', 'Succès', 'Carte retirée du marché avec succès !');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          document.getElementById('remove-confirm-modal').classList.add('hidden');
          showToast('error', 'Erreur', data.message || 'Une erreur est survenue');
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
