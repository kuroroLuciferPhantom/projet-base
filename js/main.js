document.addEventListener('DOMContentLoaded', function() {
    // Gestion de la barre de navigation au défilement
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const authButtons = document.querySelector('.auth-buttons');
    
    // Changement de style du header au scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.padding = '15px 5%';
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '20px 5%';
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
            header.style.boxShadow = 'none';
        }
    });
    
    // Menu mobile toggle
    menuToggle.addEventListener('click', function() {
        if (nav.style.display === 'flex') {
            nav.style.display = 'none';
            authButtons.style.display = 'none';
        } else {
            nav.style.display = 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            nav.style.padding = '20px';
            
            authButtons.style.display = 'flex';
            authButtons.style.flexDirection = 'column';
            authButtons.style.position = 'absolute';
            authButtons.style.top = 'calc(100% + ' + nav.offsetHeight + 'px)';
            authButtons.style.left = '0';
            authButtons.style.width = '100%';
            authButtons.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            authButtons.style.padding = '20px';
        }
    });
    
    // Animation des chiffres statistiques
    const stats = document.querySelectorAll('.stat-number');
    const animationDuration = 2000; // 2 secondes pour l'animation
    
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    function animateStats() {
        stats.forEach(stat => {
            if (isInViewport(stat) && !stat.classList.contains('animated')) {
                stat.classList.add('animated');
                
                const targetValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
                const increment = targetValue / (animationDuration / 16);
                let currentValue = 0;
                
                const updateValue = () => {
                    if (currentValue < targetValue) {
                        currentValue += increment;
                        if (currentValue > targetValue) currentValue = targetValue;
                        
                        if (targetValue >= 1000) {
                            stat.textContent = Math.floor(currentValue).toLocaleString() + '+';
                        } else {
                            stat.textContent = Math.floor(currentValue) + '%';
                        }
                        
                        requestAnimationFrame(updateValue);
                    }
                };
                
                updateValue();
            }
        });
    }
    
    // Animation au scroll
    window.addEventListener('scroll', animateStats);
    // Animation au chargement initial
    animateStats();
    
    // Animation des cartes de fonctionnalités
    const featureCards = document.querySelectorAll('.feature-card');
    
    function animateFeatureCards() {
        featureCards.forEach((card, index) => {
            if (isInViewport(card) && !card.classList.contains('animated')) {
                card.classList.add('animated');
                card.style.opacity = '0';
                card.style.transform = 'translateY(50px)';
                
                // Animation avec délai progressif pour effet en cascade
                setTimeout(() => {
                    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 * index); // Délai différent pour chaque carte
            }
        });
    }
    
    window.addEventListener('scroll', animateFeatureCards);
    // Animation au chargement initial après un court délai
    setTimeout(animateFeatureCards, 500);
    
    // Validation du formulaire de contact
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Récupération des valeurs du formulaire
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Exemple de validation simple
            if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
                alert('Veuillez remplir tous les champs du formulaire.');
                return;
            }
            
            // Ici vous pourriez ajouter le code pour envoyer les données à un serveur
            
            // Affichage d'un message de confirmation
            const formWrapper = contactForm.parentElement;
            contactForm.style.display = 'none';
            
            // Création d'un message de succès
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--color-yellow); margin-bottom: 20px;"></i>
                <h3>Message envoyé avec succès!</h3>
                <p>Merci de nous avoir contacté, ${name}. Nous vous répondrons dans les plus brefs délais.</p>
            `;
            
            successMessage.style.textAlign = 'center';
            successMessage.style.padding = '30px';
            successMessage.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
            successMessage.style.borderRadius = '10px';
            successMessage.style.animation = 'fadeIn 0.5s ease-in-out';
            
            formWrapper.appendChild(successMessage);
        });
    }
    
    // Ajout d'une animation simple pour les éléments au scroll
    const animateOnScroll = document.querySelectorAll('.hero-content, .about-content, .cta-content');
    
    function animateElements() {
        animateOnScroll.forEach(element => {
            if (isInViewport(element) && !element.classList.contains('animated')) {
                element.classList.add('animated');
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 200);
            }
        });
    }
    
    window.addEventListener('scroll', animateElements);
    // Animation au chargement initial
    setTimeout(animateElements, 300);
});

// Définition de l'animation de fondu pour le message de succès
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
