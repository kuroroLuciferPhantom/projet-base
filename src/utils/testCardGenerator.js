const PlayerCard = require('../models/PlayerCard');
const GameCard = require('../models/GameCard');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Utilitaire pour donner des cartes de test aux utilisateurs
 */
class TestCardGenerator {
    
    /**
     * Donner des cartes aléatoires à un utilisateur
     */
    static async giveRandomCards(userId, count = 5) {
        try {
            console.log(`🎁 Attribution de ${count} cartes à l'utilisateur ${userId}...`);
            
            // Vérifier que l'utilisateur existe
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }
            
            // Récupérer des GameCards aléatoires
            const gameCards = await GameCard.aggregate([
                { $sample: { size: count } }
            ]);
            
            if (gameCards.length === 0) {
                throw new Error('Aucune GameCard disponible. Initialisez d\'abord la base de données.');
            }
            
            const newPlayerCards = [];
            
            for (const gameCard of gameCards) {
                // Vérifier si l'utilisateur a déjà cette carte
                const existingCard = await PlayerCard.findOne({
                    owner: userId,
                    gameCard: gameCard._id
                });
                
                if (!existingCard) {
                    const playerCard = new PlayerCard({
                        owner: userId,
                        gameCard: gameCard._id,
                        tokenId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        level: 1,
                        experience: 0,
                        isForSale: false,
                        price: 0,
                        enhancedStats: {
                            attack: 0,
                            defense: 0,
                            magic: 0,
                            speed: 0
                        },
                        acquiredAt: new Date()
                    });
                    
                    await playerCard.save();
                    newPlayerCards.push(playerCard);
                    console.log(`✅ Carte attribuée: ${gameCard.name} (${gameCard.rarity})`);
                } else {
                    console.log(`⚠️  Carte déjà possédée: ${gameCard.name}`);
                }
            }
            
            console.log(`🎉 ${newPlayerCards.length} nouvelles cartes attribuées`);
            return newPlayerCards;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'attribution des cartes:', error);
            throw error;
        }
    }
    
    /**
     * Donner une carte spécifique à un utilisateur
     */
    static async giveSpecificCard(userId, gameCardId) {
        try {
            // Vérifier que la GameCard existe
            const gameCard = await GameCard.findById(gameCardId);
            if (!gameCard) {
                throw new Error('GameCard non trouvée');
            }
            
            // Vérifier si l'utilisateur a déjà cette carte
            const existingCard = await PlayerCard.findOne({
                owner: userId,
                gameCard: gameCardId
            });
            
            if (existingCard) {
                console.log(`⚠️  L'utilisateur possède déjà cette carte: ${gameCard.name}`);
                return existingCard;
            }
            
            const playerCard = new PlayerCard({
                owner: userId,
                gameCard: gameCardId,
                tokenId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                level: 1,
                experience: 0,
                isForSale: false,
                price: 0,
                enhancedStats: {
                    attack: 0,
                    defense: 0,
                    magic: 0,
                    speed: 0
                },
                acquiredAt: new Date()
            });
            
            await playerCard.save();
            console.log(`✅ Carte attribuée: ${gameCard.name} (${gameCard.rarity})`);
            return playerCard;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'attribution de la carte:', error);
            throw error;
        }
    }
    
    /**
     * Donner un starter pack à un nouvel utilisateur
     */
    static async giveStarterPack(userId) {
        try {
            console.log(`🎮 Attribution du starter pack à l'utilisateur ${userId}...`);
            
            // Donner 3 cartes communes, 2 rares, 1 épique
            const commonCards = await GameCard.aggregate([
                { $match: { rarity: 'common' } },
                { $sample: { size: 3 } }
            ]);
            
            const rareCards = await GameCard.aggregate([
                { $match: { rarity: 'rare' } },
                { $sample: { size: 2 } }
            ]);
            
            const epicCards = await GameCard.aggregate([
                { $match: { rarity: 'epic' } },
                { $sample: { size: 1 } }
            ]);
            
            const allCards = [...commonCards, ...rareCards, ...epicCards];
            const newPlayerCards = [];
            
            for (const gameCard of allCards) {
                const existingCard = await PlayerCard.findOne({
                    owner: userId,
                    gameCard: gameCard._id
                });
                
                if (!existingCard) {
                    const playerCard = new PlayerCard({
                        owner: userId,
                        gameCard: gameCard._id,
                        tokenId: `starter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        level: 1,
                        experience: 0,
                        isForSale: false,
                        price: 0,
                        enhancedStats: {
                            attack: 0,
                            defense: 0,
                            magic: 0,
                            speed: 0
                        },
                        acquiredAt: new Date()
                    });
                    
                    await playerCard.save();
                    newPlayerCards.push(playerCard);
                    console.log(`✅ Starter card: ${gameCard.name} (${gameCard.rarity})`);
                }
            }
            
            // Donner aussi des tokens et boosters de démarrage
            const user = await User.findById(userId);
            if (user) {
                user.tokenBalance = (user.tokenBalance || 0) + 1000;
                user.boosters = user.boosters || {};
                user.boosters.common = (user.boosters.common || 0) + 3;
                user.boosters.rare = (user.boosters.rare || 0) + 1;
                await user.save();
                console.log('💰 Tokens et boosters de démarrage ajoutés');
            }
            
            console.log(`🎉 Starter pack complet: ${newPlayerCards.length} cartes`);
            return newPlayerCards;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'attribution du starter pack:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir les statistiques des cartes d'un utilisateur
     */
    static async getUserCardStats(userId) {
        try {
            const stats = await PlayerCard.aggregate([
                { $match: { owner: new mongoose.Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'gamecards',
                        localField: 'gameCard',
                        foreignField: '_id',
                        as: 'gameCard'
                    }
                },
                { $unwind: '$gameCard' },
                {
                    $group: {
                        _id: '$gameCard.rarity',
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const totalCards = await PlayerCard.countDocuments({ owner: userId });
            
            const rarityStats = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
            
            stats.forEach(stat => {
                if (stat._id && rarityStats.hasOwnProperty(stat._id)) {
                    rarityStats[stat._id] = stat.count;
                }
            });
            
            return {
                totalCards,
                rarityStats
            };
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }
}

module.exports = TestCardGenerator;