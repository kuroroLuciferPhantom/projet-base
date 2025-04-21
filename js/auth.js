document.addEventListener('DOMContentLoaded', function() {
    // Affichage/masquage du mot de passe
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Évaluation de la force du mot de passe
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.strength-progress');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            let status = '';
            
            // Critères de force
            if (password.length > 6) strength += 1;
            if (password.length > 10) strength += 1;
            if (/[A-Z]/.test(password)) strength += 1;
            if (/[0-9]/.test(password)) strength += 1;
            if (/[^A-Za-z0-9]/.test(password)) strength += 1;
            
            // Définition du statut en fonction de la force
            switch (strength) {
                case 0:
                    strengthBar.style.width = '0%';
                    strengthBar.style.backgroundColor = '#e62e2e';
                    status = 'Très faible';
                    break;
                case 1:
                    strengthBar.style.width = '20%';
                    strengthBar.style.backgroundColor = '#e62e2e';
                    status = 'Faible';
                    break;
                case 2:
                    strengthBar.style.width = '40%';
                    strengthBar.style.backgroundColor = '#e67e22';
                    status = 'Moyen';
                    break;
                case 3:
                    strengthBar.style.width = '60%';
                    strengthBar.style.backgroundColor = '#f1c40f';
                    status = 'Bon';
                    break;
                case 4:
                    strengthBar.style.width = '80%';
                    strengthBar.style.backgroundColor = '#2ecc71';
                    status = 'Fort';
                    break;
                case 5:
                    strengthBar.style.width = '100%';
                    strengthBar.style.backgroundColor = '#27ae60';
                    status = 'Excellent';
                    break;
            }
            
            strengthText.textContent = `Force: ${status}`;
        });
    }
    
    // Vérification de correspondance des mots de passe
    const confirmPasswordInput = document.getElementById('password-confirm');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value === passwordInput.value) {
                this.style.borderColor = '#27ae60';
                this.style.boxShadow = '0 0 0 2px rgba(39, 174, 96, 0.2)';
            } else {
                this.style.borderColor = '#e62e2e';
                this.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
            }
        });
    }
    
    // Gestion des formulaires
    const loginForm = document.querySelector('.auth-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = new FormData(this);
            const formType = document.querySelector('h1').textContent.toLowerCase();
            
            // Animation de chargement
            const submitButton = this.querySelector('[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
            submitButton.disabled = true;
            
            // Simulation d'une requête API
            setTimeout(() => {
                // Réinitialisation du bouton
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                
                // Redirection (à personnaliser selon vos besoins)
                if (formType.includes('connexion')) {
                    window.location.href = 'index.html'; // Redirection après connexion
                } else if (formType.includes('inscription')) {
                    // Affichage d'un message de succès
                    loginForm.innerHTML = `
                        <div class="success-message">
                            <i class="fas fa-check-circle" style="font-size: 48px; color: #ffcc00; margin-bottom: 20px;"></i>
                            <h2>Inscription réussie!</h2>
                            <p>Votre compte a été créé avec succès.</p>
                            <a href="login.html" class="btn btn-auth" style="margin-top: 20px;">Se connecter</a>
                        </div>
                    `;
                }
            }, 2000); // Délai de 2 secondes pour simuler une requête
        });
    }
    
    // Animation d'entrée de la forme
    const formContainer = document.querySelector('.auth-form-container');
    if (formContainer) {
        formContainer.classList.add('visible');
    }
});
