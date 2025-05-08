/**
 * Module de gestion des statistiques pour la bataille
 * Gère les statistiques du joueur et le leaderboard
 */

(function() {
    // S'assurer que le namespace existe
    window.Bataille = window.Bataille || {};
    
    // Module Stats
    const Stats = {};
    
    // Charger les statistiques du joueur
    Stats.loadPlayerStats = async function() {
        try {
            // Afficher le chargement
            Bataille.elements.statsLoading.style.display = 'flex';
            Bataille.elements.playerStats.style.display = 'none';
            
            // Appel à l'API
            const response = await fetch('/bataille/api/stats');
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des statistiques');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du chargement des statistiques');
            }
            
            // Mettre à jour l'état
            Bataille.state.stats = data.stats;
            
            // Mettre à jour l'interface
            Stats.updatePlayerStatsUI();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast('Erreur lors du chargement des statistiques', 'error');
        } finally {
            // Masquer le chargement
            Bataille.elements.statsLoading.style.display = 'none';
            Bataille.elements.playerStats.style.display = 'flex';
        }
    };

    // Mettre à jour l'interface des statistiques
    Stats.updatePlayerStatsUI = function() {
        if (!Bataille.state.stats) return;
        
        // Mettre à jour les informations de ligue
        Bataille.elements.leagueName.textContent = Bataille.state.stats.league.name;
        Bataille.elements.leagueIcon.className = 'league-icon ' + Bataille.state.stats.league.className;
        Bataille.elements.leagueRank.textContent = Bataille.state.stats.rank || '-';
        
        // Mettre à jour les statistiques
        Bataille.elements.playerWins.textContent = Bataille.state.stats.wins;
        Bataille.elements.playerLosses.textContent = Bataille.state.stats.losses;
        Bataille.elements.playerWinrate.textContent = Bataille.state.stats.winRate + '%';
        Bataille.elements.playerElo.textContent = Bataille.state.stats.eloRating;
    };

    // Charger le leaderboard
    Stats.loadLeaderboard = async function() {
        try {
            // Afficher le chargement
            Bataille.elements.leaderboardLoading.style.display = 'flex';
            Bataille.elements.leaderboardTableContainer.style.display = 'none';
            
            // Appel à l'API
            const response = await fetch('/bataille/api/leaderboard');
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement du leaderboard');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du chargement du leaderboard');
            }
            
            // Mettre à jour l'état
            Bataille.state.leaderboard = data.leaderboard;
            Bataille.state.leagueInfo = data.leagueInfo;
            
            // Mettre à jour l'interface
            Stats.updateLeaderboardUI();
            
        } catch (error) {
            console.error('Erreur:', error);
            Bataille.UI.showToast('Erreur lors du chargement du leaderboard', 'error');
        } finally {
            // Masquer le chargement
            Bataille.elements.leaderboardLoading.style.display = 'none';
            Bataille.elements.leaderboardTableContainer.style.display = 'block';
        }
    };

    // Mettre à jour l'interface du leaderboard
    Stats.updateLeaderboardUI = function() {
        if (!Bataille.state.leaderboard || !Bataille.state.leagueInfo) return;
        
        // Mettre à jour les informations de la ligue
        Bataille.elements.leaderboardLeague.textContent = Bataille.state.leagueInfo.name;
        Bataille.elements.leaderboardCount.textContent = Bataille.state.leagueInfo.totalPlayers;
        
        // Mettre à jour les seuils de promotion/rétrogradation
        const promotionPercent = Math.round((Bataille.state.leagueInfo.promotionThreshold / Bataille.state.leagueInfo.totalPlayers) * 100);
        const demotionPercent = Math.round((Bataille.state.leagueInfo.totalPlayers - Bataille.state.leagueInfo.demotionThreshold) / Bataille.state.leagueInfo.totalPlayers * 100);
        
        Bataille.elements.promotionThreshold.textContent = promotionPercent;
        Bataille.elements.demotionThreshold.textContent = demotionPercent;
        
        // Vider le tableau
        Bataille.elements.leaderboardBody.innerHTML = '';
        
        // Ajouter les joueurs au tableau
        Bataille.state.leaderboard.forEach(player => {
            const row = document.createElement('tr');
            
            // Appliquer les classes pour la promotion/rétrogradation
            if (player.promotionZone) {
                row.classList.add('promotion-row');
            } else if (player.demotionZone) {
                row.classList.add('demotion-row');
            }
            
            // Marquer le joueur actuel
            if (player.isCurrentPlayer) {
                row.classList.add('current-player-row');
            }
            
            // Créer les cellules
            row.innerHTML = `
                <td>${player.rank}</td>
                <td>${player.username}</td>
                <td>${player.eloRating}</td>
                <td>${player.wins}/${player.losses}</td>
                <td>${player.winRate}%</td>
            `;
            
            Bataille.elements.leaderboardBody.appendChild(row);
        });
    };

    // Exposer le module
    Bataille.Stats = Stats;
})();
