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
