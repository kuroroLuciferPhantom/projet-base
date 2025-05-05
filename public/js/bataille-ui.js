/**
 * Module UI pour la bataille
 * Fonctions d'interface utilisateur communes
 */

(function() {
    // S'assurer que le namespace existe
    window.Bataille = window.Bataille || {};
    
    // Module UI
    const UI = {};
    
    // Afficher un toast (notification)
    UI.showToast = function(message, type = 'info') {
        // Vérifier si le conteneur de toasts existe
        let toastContainer = document.getElementById('toast-container');
        
        // Créer le conteneur s'il n'existe pas
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(toastContainer);
        }
        
        // Créer le toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} flex items-center p-4 mb-2 rounded shadow-lg`;
        
        // Ajouter l'icône selon le type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle mr-2 text-green-500"></i>';
                toast.className += ' bg-green-100 border-l-4 border-green-500';
                break;
            case 'error':
                icon = '<i class="fas fa-times-circle mr-2 text-red-500"></i>';
                toast.className += ' bg-red-100 border-l-4 border-red-500';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle mr-2 text-yellow-500"></i>';
                toast.className += ' bg-yellow-100 border-l-4 border-yellow-500';
                break;
            case 'info':
            default:
                icon = '<i class="fas fa-info-circle mr-2 text-blue-500"></i>';
                toast.className += ' bg-blue-100 border-l-4 border-blue-500';
        }
        
        // Ajouter le contenu
        toast.innerHTML = `
            <div class="flex items-center">
                ${icon}
                <span>${message}</span>
            </div>
            <button class="ml-auto text-gray-400 hover:text-gray-500 focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter au conteneur
        toastContainer.appendChild(toast);
        
        // Ajouter l'événement pour fermer le toast
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('fadeOut');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fadeOut');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    };
    
    // Formater un nombre avec séparateur de milliers
    UI.formatNumber = function(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };
    
    // Tronquer un texte avec ellipses
    UI.truncateText = function(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    
    // Créer un élément avec des classes
    UI.createElement = function(tagName, className, innerHTML) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    };
    
    // Vider un élément
    UI.emptyElement = function(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };
    
    // Ajouter ou supprimer une classe
    UI.toggleClass = function(element, className, condition) {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    };
    
    // Exposer le module
    Bataille.UI = UI;
})();
