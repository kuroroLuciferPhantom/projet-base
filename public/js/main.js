/**
 * Fichier JavaScript principal
 * Chargé sur toutes les pages du site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialiser les composants globaux
  initializeApp();
});

/**
 * Initialise l'application et ses composants
 */
function initializeApp() {
  // Initialiser les tooltips et popovers
  initializeTooltips();
  
  // Initialiser la navigation mobile
  initializeMobileNav();
  
  // Initialiser le sélecteur de thème
  initializeThemeSelector();
  
  // Initialiser les notifications
  initializeNotifications();
  
  // Vérifier l'authentification
  checkAuthentication();
}

/**
 * Initialise les tooltips et popovers
 */
function initializeTooltips() {
  // Trouver tous les éléments avec l'attribut data-tooltip
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    const tooltip = el.getAttribute('data-tooltip');
    
    // Créer un gestionnaire d'événements pour l'affichage du tooltip
    el.addEventListener('mouseenter', function(e) {
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip';
      tooltipEl.textContent = tooltip;
      
      // Positionner le tooltip
      const rect = el.getBoundingClientRect();
      tooltipEl.style.top = `${rect.top - 30}px`;
      tooltipEl.style.left = `${rect.left + (rect.width / 2)}px`;
      
      // Ajouter le tooltip au document
      document.body.appendChild(tooltipEl);
      
      // Gestionnaire pour supprimer le tooltip
      el.addEventListener('mouseleave', function() {
        tooltipEl.remove();
      }, { once: true });
    });
  });
}

/**
 * Initialise la navigation mobile
 */
function initializeMobileNav() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.contains('active');
      
      if (isOpen) {
        mobileMenu.classList.remove('active');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      } else {
        mobileMenu.classList.add('active');
        mobileMenuButton.setAttribute('aria-expanded', 'true');
      }
    });
    
    // Fermer le menu quand on clique en dehors
    document.addEventListener('click', function(e) {
      if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
        mobileMenu.classList.remove('active');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * Initialise le sélecteur de thème
 */
function initializeThemeSelector() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    // Vérifier les préférences de l'utilisateur pour le thème sombre
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = localStorage.getItem('theme');
    
    // Appliquer le thème enregistré ou les préférences du système
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme)) {
      document.documentElement.classList.add('dark-theme');
      themeToggle.checked = true;
    }
    
    // Gestionnaire d'événement pour le changement de thème
    themeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    });
  }
}

/**
 * Initialise les notifications
 */
function initializeNotifications() {
  // Gérer les notifications système
  const notifications = document.querySelectorAll('.notification');
  
  notifications.forEach(notification => {
    // Ajouter un bouton de fermeture
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
    }
    
    // Auto-fermeture après 5 secondes pour les notifications non-critiques
    if (!notification.classList.contains('notification-critical')) {
      setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
    }
  });
}

/**
 * Vérifie l'authentification de l'utilisateur et met à jour l'interface
 */
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const authButtons = document.querySelectorAll('.auth-buttons');
  const userMenu = document.querySelectorAll('.user-menu');
  
  if (token) {
    // Utilisateur connecté
    authButtons.forEach(el => el.classList.add('hidden'));
    userMenu.forEach(el => el.classList.remove('hidden'));
    
    // Récupérer les informations de l'utilisateur si le menu utilisateur est présent
    if (userMenu.length > 0) {
      loadUserProfile();
    }
  } else {
    // Utilisateur non connecté
    authButtons.forEach(el => el.classList.remove('hidden'));
    userMenu.forEach(el => el.classList.add('hidden'));
  }
  
  // Gérer les sections réservées aux utilisateurs connectés/déconnectés
  document.querySelectorAll('[data-auth-required]').forEach(el => {
    if (token) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  
  document.querySelectorAll('[data-auth-guest-only]').forEach(el => {
    if (!token) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

/**
 * Charge le profil de l'utilisateur et met à jour l'interface
 */
function loadUserProfile() {
  // Vérifier si le service API est disponible
  if (!window.apiService) return;
  
  window.apiService.getUserProfile()
    .then(data => {
      if (data.success && data.data?.user) {
        const user = data.data.user;
        updateUserInterface(user);
      } else {
        // Si l'API répond mais n'a pas trouvé l'utilisateur, déconnecter
        window.apiService.clearToken();
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement du profil:', error);
      // En cas d'erreur critique, déconnecter l'utilisateur
      if (error.message === 'Unauthorized') {
        window.apiService.clearToken();
        window.location.reload();
      }
    });
}

/**
 * Met à jour l'interface utilisateur avec les informations du profil
 * @param {Object} user - Données du profil utilisateur
 */
function updateUserInterface(user) {
  // Mettre à jour les éléments de l'interface avec les données de l'utilisateur
  document.querySelectorAll('.user-username').forEach(el => {
    el.textContent = user.username;
  });
  
  document.querySelectorAll('.user-balance').forEach(el => {
    el.textContent = `${user.balance || 0} tokens`;
  });
  
  // Mettre à jour l'avatar si disponible
  document.querySelectorAll('.user-avatar').forEach(el => {
    if (user.avatar) {
      el.src = user.avatar;
      el.alt = user.username;
    }
  });
  
  // Mettre à jour la date d'inscription si affichée
  document.querySelectorAll('.user-joined-date').forEach(el => {
    if (user.createdAt) {
      const date = new Date(user.createdAt);
      el.textContent = date.toLocaleDateString();
    }
  });
  
  // Ajouter des classes pour les utilisateurs spéciaux (admin, etc.)
  if (user.role === 'admin') {
    document.body.classList.add('user-is-admin');
  }
}

/**
 * Affiche un message toast (notification)
 * @param {string} type - Type de notification ('success', 'error', 'info', 'warning')
 * @param {string} title - Titre de la notification
 * @param {string} message - Message à afficher
 */
function showToast(type, title, message) {
  // Créer le conteneur de toast s'il n'existe pas
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  // Créer le toast
  const toast = document.createElement('div');
  toast.className = `bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-md w-full transform transition-all duration-300 ease-in-out flex toast-${type}`;
  
  // Icône selon le type
  let iconSvg = '';
  let colorClass = '';
  switch (type) {
    case 'success':
      iconSvg = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      colorClass = 'text-green-500';
      break;
    case 'error':
      iconSvg = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      colorClass = 'text-red-500';
      break;
    case 'info':
      iconSvg = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      colorClass = 'text-blue-500';
      break;
    case 'warning':
      iconSvg = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
      colorClass = 'text-yellow-500';
      break;
  }
  
  // Structure du toast
  toast.innerHTML = `
    <div class="flex-shrink-0 ${colorClass} p-4">
      ${iconSvg}
    </div>
    <div class="p-4 flex-grow">
      <h3 class="font-medium text-gray-900 dark:text-white mb-1">${title}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-300">${message}</p>
    </div>
    <button class="p-4 flex-shrink-0 text-gray-400 hover:text-gray-500">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;
  
  // Ajouter au conteneur
  toastContainer.appendChild(toast);
  
  // Animation d'entrée
  setTimeout(() => {
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 10);
  
  // Ajouter le gestionnaire de fermeture
  const closeButton = toast.querySelector('button');
  closeButton.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-fermeture après 5 secondes
  setTimeout(() => {
    removeToast(toast);
  }, 5000);
}

/**
 * Supprime un toast avec animation
 * @param {HTMLElement} toast - Élément toast à supprimer
 */
function removeToast(toast) {
  toast.classList.add('-translate-y-2', 'opacity-0');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Exporter les fonctions globales pour les utiliser dans d'autres fichiers
window.showToast = showToast;