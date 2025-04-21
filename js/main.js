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
