/**
 * Gestion des événements pour le mode solo - Exploration des Arcanes
 */

// Catalogue d'ennemis
const enemies = {
    weak: [
        { name: "Gobelin égaré", attack: 15, defense: 10, description: "Un petit gobelin solitaire qui s'est perdu dans les tunnels." },
        { name: "Rat géant", attack: 10, defense: 15, description: "Un rongeur mutant qui se nourrit des restes abandonnés." },
        { name: "Chauve-souris vampire", attack: 20, defense: 5, description: "Une chauve-souris assoiffée de sang qui attaque par surprise." }
    ],
    medium: [
        { name: "Guerrier squelette", attack: 30, defense: 25, description: "Un ancien guerrier réanimé qui patrouille inlassablement." },
        { name: "Araignée venimeuse", attack: 35, defense: 20, description: "Une araignée géante dont la morsure paralyse ses victimes." },
        { name: "Bandit masqué", attack: 25, defense: 30, description: "Un voleur qui se cache dans l'ombre, prêt à dérober vos trésors." }
    ],
    strong: [
        { name: "Golem de pierre", attack: 40, defense: 60, description: "Une créature massive faite de roche enchantée, quasiment indestructible." },
        { name: "Nécromancien", attack: 55, defense: 35, description: "Un sorcier maléfique capable de réveiller les morts pour combattre à ses côtés." },
        { name: "Dragon d'ombre", attack: 70, defense: 50, description: "Un jeune dragon qui se nourrit de l'obscurité des profondeurs." }
    ]
};

// Catalogue de pièges
const traps = [
    { 
        name: "Flèches empoisonnées", 
        damage: 1, 
        description: "Des flèches jaillissent des murs, enduites d'un poison qui affaiblit.",
        avoidable: true,
        avoidChance: 0.4,
        avoidText: "Vous parvenez à vous baisser juste à temps, évitant les projectiles mortels."
    },
    { 
        name: "Fosse à piques", 
        damage: 2, 
        description: "Le sol s'effondre sous vos pieds, révélant une fosse remplie de piques acérées.",
        avoidable: true,
        avoidChance: 0.3,
        avoidText: "Grâce à vos réflexes, vous vous accrochez au bord au dernier moment."
    },
    { 
        name: "Nuage de spores", 
        damage: 1, 
        description: "Un champignon libère un nuage de spores toxiques qui brûlent vos poumons.",
        avoidable: false,
        avoidText: ""
    },
    { 
        name: "Piège à ours magique", 
        damage: 3, 
        description: "Un piège à ours enchanté qui se referme violemment sur votre jambe.",
        avoidable: true,
        avoidChance: 0.2,
        avoidText: "Vous repérez l'éclat métallique juste à temps pour éviter le mécanisme."
    }
];

// Catalogue d'événements à choix
const choiceEvents = [
    {
        title: "Croisée des chemins",
        description: "Vous arrivez à une bifurcation. Un chemin semble plus sûr mais moins prometteur, l'autre plus dangereux mais potentiellement plus récompensant.",
        choices: [
            {
                text: "Prendre le chemin sûr",
                outcome: "Vous avancez prudemment, évitant tout danger, mais ne trouvez pas grand chose d'intéressant.",
                rewards: { keys: 1 }
            },
            {
                text: "Prendre le chemin dangereux",
                outcome: "Le chemin est périlleux, mais vous trouvez un coffre abandonné!",
                rewards: { chest: "common" },
                risk: { damage: 1, chance: 0.4 }
            }
        ]
    },
    {
        title: "Fontaine mystérieuse",
        description: "Une fontaine au liquide scintillant se trouve devant vous. Il pourrait s'agir d'une eau guérisseuse ou d'un poison subtil.",
        choices: [
            {
                text: "Boire à la fontaine",
                outcome: "L'eau est régénératrice! Vous vous sentez revigoré.",
                rewards: { heal: 2 },
                risk: { damage: 2, chance: 0.3 }
            },
            {
                text: "Ignorer la fontaine",
                outcome: "Vous préférez ne pas prendre de risque et continuez votre chemin.",
                rewards: {}
            }
        ]
    }
];

// Catalogue de récompenses pour les coffres
const chestRewards = {
    common: [
        { type: "tokens", min: 5, max: 15, chance: 0.7 },
        { type: "key", amount: 1, chance: 0.3 }
    ],
    rare: [
        { type: "tokens", min: 15, max: 30, chance: 0.6 },
        { type: "key", amount: 2, chance: 0.3 },
        { type: "heal", amount: 1, chance: 0.1 }
    ],
    epic: [
        { type: "tokens", min: 30, max: 50, chance: 0.5 },
        { type: "key", amount: 3, chance: 0.3 },
        { type: "heal", amount: 2, chance: 0.2 }
    ]
};

// Révéler un événement
function revealEvent() {
    // Incrémenter le compteur d'événements
    gameState.eventsEncountered++;
    
    // Générer un événement aléatoire
    const event = generateRandomEvent();
    
    // Masquer le placeholder
    document.getElementById('event-placeholder').classList.add('hidden');
    
    // Afficher l'événement
    const eventDisplay = document.getElementById('event-display');
    eventDisplay.innerHTML = generateEventHTML(event);
    eventDisplay.classList.remove('hidden');
    
    // Afficher les actions du jeu
    document.getElementById('game-actions').classList.remove('hidden');
    
    // Gérer les conséquences de l'événement
    handleEventOutcome(event);
}

// Générer un événement aléatoire
function generateRandomEvent() {
    // Déterminer le type d'événement en fonction des probabilités
    const roll = Math.random();
    const difficulty = getDifficultyMultiplier();
    
    let cumulativeChance = 0;
    const probabilities = soloConfig.probabilites;
    
    // Coffre commun
    cumulativeChance += probabilities.chestCommon;
    if (roll < cumulativeChance) {
        return { type: 'chest', rarity: 'common' };
    }
    
    // Coffre rare
    cumulativeChance += probabilities.chestRare;
    if (roll < cumulativeChance) {
        return { type: 'chest', rarity: 'rare' };
    }
    
    // Coffre épique
    cumulativeChance += probabilities.chestEpic;
    if (roll < cumulativeChance) {
        return { type: 'chest', rarity: 'epic' };
    }
    
    // Ennemi faible
    cumulativeChance += probabilities.enemyWeak;
    if (roll < cumulativeChance) {
        const enemy = getRandomEnemy('weak');
        enemy.stats = adjustEnemyStats(enemy, difficulty);
        return { type: 'enemy', enemyType: 'weak', enemy: enemy };
    }
    
    // Ennemi moyen
    cumulativeChance += probabilities.enemyMedium;
    if (roll < cumulativeChance) {
        const enemy = getRandomEnemy('medium');
        enemy.stats = adjustEnemyStats(enemy, difficulty);
        return { type: 'enemy', enemyType: 'medium', enemy: enemy };
    }
    
    // Ennemi fort
    cumulativeChance += probabilities.enemyStrong;
    if (roll < cumulativeChance) {
        const enemy = getRandomEnemy('strong');
        enemy.stats = adjustEnemyStats(enemy, difficulty);
        return { type: 'enemy', enemyType: 'strong', enemy: enemy };
    }
    
    // Piège
    cumulativeChance += probabilities.trap;
    if (roll < cumulativeChance) {
        return { type: 'trap', trap: getRandomTrap() };
    }
    
    // Événement à choix
    cumulativeChance += probabilities.choice;
    if (roll < cumulativeChance) {
        return { type: 'choice', choice: getRandomChoiceEvent() };
    }
    
    // Par défaut, retourner un coffre commun
    return { type: 'chest', rarity: 'common' };
}

// Obtenir un ennemi aléatoire d'un type donné
function getRandomEnemy(type) {
    const enemiesOfType = enemies[type];
    const randomIndex = Math.floor(Math.random() * enemiesOfType.length);
    return { ...enemiesOfType[randomIndex] }; // Retourner une copie
}

// Ajuster les statistiques d'un ennemi en fonction de la difficulté
function adjustEnemyStats(enemy, difficultyMultiplier) {
    return {
        attack: Math.round(enemy.attack * difficultyMultiplier),
        defense: Math.round(enemy.defense * difficultyMultiplier)
    };
}

// Obtenir un piège aléatoire
function getRandomTrap() {
    const randomIndex = Math.floor(Math.random() * traps.length);
    return { ...traps[randomIndex] }; // Retourner une copie
}

// Obtenir un événement à choix aléatoire
function getRandomChoiceEvent() {
    const randomIndex = Math.floor(Math.random() * choiceEvents.length);
    return { ...choiceEvents[randomIndex] }; // Retourner une copie
}

// Générer le HTML pour un événement
function generateEventHTML(event) {
    let html = '';
    
    switch (event.type) {
        case 'chest':
            html = generateChestEventHTML(event);
            break;
        case 'enemy':
            html = generateEnemyEventHTML(event);
            break;
        case 'trap':
            html = generateTrapEventHTML(event);
            break;
        case 'choice':
            html = generateChoiceEventHTML(event);
            break;
    }
    
    return html;
}

// Générer le HTML pour un événement de coffre
function generateChestEventHTML(event) {
    const rarityText = event.rarity === 'common' ? 'Commun' : event.rarity === 'rare' ? 'Rare' : 'Épique';
    
    return `
        <div class="event-chest ${event.rarity}">
            <div class="event-icon">
                <i class="fas fa-treasure-chest"></i>
            </div>
            <div class="event-title">Coffre ${rarityText} découvert!</div>
            <div class="event-description">
                Vous avez trouvé un coffre ${rarityText.toLowerCase()}. Il contient probablement des trésors!
            </div>
            <div class="event-note">
                <p>Vous pouvez l'ouvrir maintenant si vous avez une clé, ou le conserver pour plus tard.</p>
            </div>
        </div>
    `;
}

// Générer le HTML pour un événement d'ennemi
function generateEnemyEventHTML(event) {
    let combatResult = '';
    
    if (event.result) {
        const resultClass = event.result.victory ? 'victory' : 'defeat';
        const resultText = event.result.victory ? 'Victoire!' : 'Défaite!';
        const resultDescription = event.result.victory 
            ? `Vous avez vaincu ${event.enemy.name} et gagné ${event.result.tokensEarned} $CCARD!` 
            : `${event.enemy.name} vous a vaincu! Vous perdez ${event.result.livesLost} vie(s).`;
        
        combatResult = `
            <div class="combat-result ${resultClass}">
                <div class="result-title">${resultText}</div>
                <div class="result-description">${resultDescription}</div>
            </div>
        `;
    }
    
    return `
        <div class="event-enemy">
            <div class="event-icon">
                <i class="fas fa-skull"></i>
            </div>
            <div class="event-title">Ennemi: ${event.enemy.name}</div>
            <div class="event-description">
                ${event.enemy.description}
            </div>
            <div class="enemy-stats">
                <div class="stat">
                    <span class="stat-label">ATK</span>
                    <span class="stat-value">${event.enemy.attack}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value">${event.enemy.defense}</span>
                </div>
            </div>
            ${combatResult}
        </div>
    `;
}

// Générer le HTML pour un événement de piège
function generateTrapEventHTML(event) {
    let trapResult = '';
    
    if (event.result) {
        if (event.result.avoided) {
            trapResult = `
                <div class="trap-result avoided">
                    <div class="result-title">Piège évité!</div>
                    <div class="result-description">${event.trap.avoidText}</div>
                </div>
            `;
        } else {
            trapResult = `
                <div class="trap-result triggered">
                    <div class="result-title">Piège déclenché!</div>
                    <div class="result-description">
                        Vous n'avez pas pu éviter le piège. Vous perdez ${event.result.livesLost} vie(s).
                    </div>
                </div>
            `;
        }
    }
    
    return `
        <div class="event-trap">
            <div class="event-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="event-title">Piège: ${event.trap.name}</div>
            <div class="event-description">
                ${event.trap.description}
            </div>
            ${trapResult}
        </div>
    `;
}

// Générer le HTML pour un événement à choix
function generateChoiceEventHTML(event) {
    let choiceResultHTML = '';
    
    if (event.result) {
        choiceResultHTML = `
            <div class="choice-result">
                <div class="result-description">${event.result.outcome}</div>
            </div>
        `;
    }
    
    let choicesHTML = '';
    
    if (!event.result) {
        choicesHTML = `
            <div class="choice-options">
                ${event.choice.choices.map((choice, index) => `
                    <button class="btn ${index === 0 ? 'btn-secondary' : 'btn-primary'} choice-btn" data-choice-index="${index}">
                        ${choice.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="event-choice">
            <div class="event-icon">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="event-title">${event.choice.title}</div>
            <div class="event-description">
                ${event.choice.description}
            </div>
            ${choiceResultHTML}
            ${choicesHTML}
        </div>
    `;
}

// Gérer les conséquences d'un événement
function handleEventOutcome(event) {
    switch (event.type) {
        case 'chest':
            handleChestEvent(event);
            break;
        case 'enemy':
            handleEnemyEvent(event);
            break;
        case 'trap':
            handleTrapEvent(event);
            break;
        case 'choice':
            handleChoiceEvent(event);
            break;
    }
    
    // Mettre à jour l'interface
    updateGameInterface();
}

// Gérer un événement de coffre
function handleChestEvent(event) {
    // Ajouter le coffre à l'inventaire
    gameState.chests[event.rarity]++;
    
    // Dans une version complète, on pourrait ajouter une option pour ouvrir immédiatement le coffre
}

// Gérer un événement d'ennemi
function handleEnemyEvent(event) {
    // Calculer la puissance totale de l'équipe
    const teamPower = calculateTeamPower(gameState.selectedCards);
    
    // Calculer la puissance de l'ennemi
    const enemyPower = calculateEnemyPower(event.enemy);
    
    // Déterminer le résultat du combat
    const victory = teamPower > enemyPower;
    
    if (victory) {
        // Calculer les tokens gagnés
        const baseTokens = event.enemyType === 'weak' ? 10 : event.enemyType === 'medium' ? 20 : 30;
        const tokensEarned = Math.round(baseTokens * getRewardMultiplier());
        
        // Mettre à jour l'état du jeu
        gameState.enemiesDefeated++;
        gameState.tokensEarned += tokensEarned;
        
        // Ajouter le résultat à l'événement
        event.result = {
            victory: true,
            tokensEarned: tokensEarned
        };
    } else {
        // Calculer les vies perdues
        const livesLost = event.enemyType === 'weak' ? 1 : event.enemyType === 'medium' ? 2 : 3;
        
        // Mettre à jour l'état du jeu
        gameState.lives -= livesLost;
        
        // Ajouter le résultat à l'événement
        event.result = {
            victory: false,
            livesLost: livesLost
        };
        
        // Vérifier si le joueur a perdu
        if (gameState.lives <= 0) {
            // Fin de partie
            setTimeout(() => {
                endGame(true);
            }, 2000);
        }
    }
    
    // Mettre à jour l'affichage de l'événement
    const eventDisplay = document.getElementById('event-display');
    eventDisplay.innerHTML = generateEnemyEventHTML(event);
}

// Gérer un événement de piège
function handleTrapEvent(event) {
    // Déterminer si le piège est évité
    let avoided = false;
    if (event.trap.avoidable) {
        avoided = Math.random() < event.trap.avoidChance;
    }
    
    if (!avoided) {
        // Calculer les vies perdues
        const livesLost = event.trap.damage;
        
        // Mettre à jour l'état du jeu
        gameState.lives -= livesLost;
        
        // Ajouter le résultat à l'événement
        event.result = {
            avoided: false,
            livesLost: livesLost
        };
        
        // Vérifier si le joueur a perdu
        if (gameState.lives <= 0) {
            // Fin de partie
            setTimeout(() => {
                endGame(true);
            }, 2000);
        }
    } else {
        // Ajouter le résultat à l'événement
        event.result = {
            avoided: true
        };
    }
    
    // Mettre à jour l'affichage de l'événement
    const eventDisplay = document.getElementById('event-display');
    eventDisplay.innerHTML = generateTrapEventHTML(event);
}

// Gérer un événement à choix
function handleChoiceEvent(event) {
    // Ajouter les événements aux boutons de choix
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const choiceIndex = parseInt(this.dataset.choiceIndex);
            const choice = event.choice.choices[choiceIndex];
            
            // Appliquer les récompenses
            applyChoiceRewards(choice.rewards);
            
            // Appliquer les risques si présents
            if (choice.risk) {
                const riskTriggered = Math.random() < choice.risk.chance;
                if (riskTriggered) {
                    gameState.lives -= choice.risk.damage;
                    
                    // Vérifier si le joueur a perdu
                    if (gameState.lives <= 0) {
                        // Fin de partie
                        setTimeout(() => {
                            endGame(true);
                        }, 2000);
                    }
                }
            }
            
            // Ajouter le résultat à l'événement
            event.result = {
                outcome: choice.outcome
            };
            
            // Mettre à jour l'affichage de l'événement
            const eventDisplay = document.getElementById('event-display');
            eventDisplay.innerHTML = generateChoiceEventHTML(event);
            
            // Mettre à jour l'interface
            updateGameInterface();
        });
    });
}

// Appliquer les récompenses d'un choix
function applyChoiceRewards(rewards) {
    if (rewards.keys) {
        gameState.keys += rewards.keys;
    }
    
    if (rewards.chest) {
        gameState.chests[rewards.chest]++;
    }
    
    if (rewards.heal) {
        gameState.lives = Math.min(gameState.lives + rewards.heal, soloConfig.startingLives);
    }
    
    if (rewards.tokens) {
        gameState.tokensEarned += rewards.tokens;
    }
}

// Calculer la puissance totale d'une équipe
function calculateTeamPower(cards) {
    return cards.reduce((total, card) => {
        return total + card.attack + card.defense;
    }, 0);
}

// Calculer la puissance d'un ennemi
function calculateEnemyPower(enemy) {
    return enemy.attack * 1.5 + enemy.defense;
}