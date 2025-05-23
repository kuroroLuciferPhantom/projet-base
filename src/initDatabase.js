#!/usr/bin/env node

/**
 * Script d'initialisation pour EpicFactionCommunity
 * Crée les cartes de démonstration et configure les données de base
 */

const mongoose = require('mongoose');
const path = require('path');

// Configuration de l'environnement
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Modèles
const GameCard = require('./models/GameCard');
const User = require('./models/User');

// Cartes de démonstration
const demoCards = [
  // Cartes communes (8 cartes)
  {
    name: "Gobelin Guerrier",
    description: "Un petit guerrier gobelin avec une épée rouillée",
    rarity: "common",
    type: "creature",
    cost: 2,
    stats: { attack: 25, defense: 20, magic: 5, speed: 30 },
    imageUrl: "/img/cards/gobelin-guerrier.jpg",
    isAvailable: true
  },
  {
    name: "Archer Novice",
    description: "Un archer débutant avec un arc en bois",
    rarity: "common",
    type: "creature", 
    cost: 2,
    stats: { attack: 30, defense: 15, magic: 10, speed: 35 },
    imageUrl: "/img/cards/archer-novice.jpg",
    isAvailable: true
  },
  {
    name: "Soldat de la Garde",
    description: "Un soldat loyal de la garde royale",
    rarity: "common",
    type: "creature",
    cost: 3,
    stats: { attack: 35, defense: 30, magic: 5, speed: 25 },
    imageUrl: "/img/cards/soldat-garde.jpg",
    isAvailable: true
  },
  {
    name: "Mage Apprenti",
    description: "Un jeune mage apprenant les sorts de base",
    rarity: "common",
    type: "creature",
    cost: 2,
    stats: { attack: 15, defense: 15, magic: 40, speed: 20 },
    imageUrl: "/img/cards/mage-apprenti.jpg",
    isAvailable: true
  },
  {
    name: "Loup des Bois",
    description: "Un loup sauvage des forêts profondes",
    rarity: "common",
    type: "creature",
    cost: 2,
    stats: { attack: 28, defense: 22, magic: 0, speed: 45 },
    imageUrl: "/img/cards/loup-bois.jpg",
    isAvailable: true
  },
  {
    name: "Garde Forestier",
    description: "Un protecteur des forêts anciennes",
    rarity: "common",
    type: "creature",
    cost: 3,
    stats: { attack: 32, defense: 28, magic: 12, speed: 35 },
    imageUrl: "/img/cards/garde-forestier.jpg",
    isAvailable: true
  },
  {
    name: "Éclaireur Rapide",
    description: "Un éclaireur agile et furtif",
    rarity: "common",
    type: "creature",
    cost: 2,
    stats: { attack: 20, defense: 18, magic: 8, speed: 50 },
    imageUrl: "/img/cards/eclaireur-rapide.jpg",
    isAvailable: true
  },
  {
    name: "Clerc Soigneur",
    description: "Un clerc capable de soigner les blessures",
    rarity: "common",
    type: "creature",
    cost: 3,
    stats: { attack: 18, defense: 25, magic: 35, speed: 22 },
    imageUrl: "/img/cards/clerc-soigneur.jpg",
    isAvailable: true
  },

  // Cartes rares (6 cartes)
  {
    name: "Chevalier d'Argent",
    description: "Un noble chevalier en armure d'argent",
    rarity: "rare",
    type: "creature",
    cost: 4,
    stats: { attack: 50, defense: 45, magic: 15, speed: 30 },
    imageUrl: "/img/cards/chevalier-argent.jpg",
    isAvailable: true
  },
  {
    name: "Mage de Bataille",
    description: "Un mage expérimenté spécialisé dans les sorts de combat",
    rarity: "rare",
    type: "creature",
    cost: 4,
    stats: { attack: 35, defense: 25, magic: 65, speed: 25 },
    imageUrl: "/img/cards/mage-bataille.jpg",
    isAvailable: true
  },
  {
    name: "Archer Elfe",
    description: "Un archer elfe d'une précision mortelle",
    rarity: "rare",
    type: "creature",
    cost: 4,
    stats: { attack: 55, defense: 30, magic: 20, speed: 50 },
    imageUrl: "/img/cards/archer-elfe.jpg",
    isAvailable: true
  },
  {
    name: "Dragon Mineur",
    description: "Un jeune dragon aux écailles brillantes",
    rarity: "rare",
    type: "creature",
    cost: 5,
    stats: { attack: 60, defense: 50, magic: 40, speed: 35 },
    imageUrl: "/img/cards/dragon-mineur.jpg",
    isAvailable: true
  },
  {
    name: "Prêtresse de Lumière",
    description: "Une prêtresse capable de soigner et bénir",
    rarity: "rare",
    type: "creature",
    cost: 3,
    stats: { attack: 25, defense: 35, magic: 55, speed: 30 },
    imageUrl: "/img/cards/pretresse-lumiere.jpg",
    isAvailable: true
  },
  {
    name: "Berserk Nordique",
    description: "Un guerrier du nord en rage de combat",
    rarity: "rare",
    type: "creature",
    cost: 4,
    stats: { attack: 65, defense: 35, magic: 10, speed: 40 },
    imageUrl: "/img/cards/berserk-nordique.jpg",
    isAvailable: true
  },

  // Cartes épiques (4 cartes)
  {
    name: "Chevalier Dragon",
    description: "Un puissant chevalier montant un dragon",
    rarity: "epic",
    type: "creature",
    cost: 6,
    stats: { attack: 75, defense: 65, magic: 30, speed: 40 },
    imageUrl: "/img/cards/chevalier-dragon.jpg",
    isAvailable: true
  },
  {
    name: "Archimage",
    description: "Un maître mage aux pouvoirs immenses",
    rarity: "epic",
    type: "creature",
    cost: 6,
    stats: { attack: 45, defense: 40, magic: 85, speed: 30 },
    imageUrl: "/img/cards/archimage.jpg",
    isAvailable: true
  },
  {
    name: "Assassin des Ombres",
    description: "Un assassin mortel qui se déplace dans les ombres",
    rarity: "epic",
    type: "creature",
    cost: 5,
    stats: { attack: 70, defense: 25, magic: 35, speed: 80 },
    imageUrl: "/img/cards/assassin-ombres.jpg",
    isAvailable: true
  },
  {
    name: "Paladin Sacré",
    description: "Un guerrier saint béni par les dieux",
    rarity: "epic",
    type: "creature",
    cost: 6,
    stats: { attack: 65, defense: 70, magic: 50, speed: 25 },
    imageUrl: "/img/cards/paladin-sacre.jpg",
    isAvailable: true
  },

  // Cartes légendaires (2 cartes)
  {
    name: "Dragon des Abysses",
    description: "Un dragon ancestral des profondeurs marines",
    rarity: "legendary",
    type: "creature",
    cost: 9,
    stats: { attack: 95, defense: 80, magic: 85, speed: 45 },
    imageUrl: "/img/cards/dragon-abysses.jpg",
    isAvailable: true
  },
  {
    name: "Titan Primordial",
    description: "Une créature colossale des temps anciens",
    rarity: "legendary",
    type: "creature",
    cost: 10,
    stats: { attack: 100, defense: 95, magic: 60, speed: 20 },
    imageUrl: "/img/cards/titan-primordial.jpg",
    isAvailable: true
  }
];

/**
 * Connexion à MongoDB
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/epicfactioncommunity';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Initialise les cartes de démonstration
 */
async function initializeDemoCards() {
  try {
    console.log('🎮 Initialisation des cartes de démonstration...');
    
    // Vérifier si des cartes existent déjà
    const existingCardsCount = await GameCard.countDocuments();
    
    if (existingCardsCount > 0) {
      console.log(`📦 ${existingCardsCount} cartes déjà présentes dans la base de données.`);
      console.log('⚠️  Suppression des cartes existantes...');
      await GameCard.deleteMany({});
    }
    
    // Insérer les cartes de démonstration
    const insertedCards = await GameCard.insertMany(demoCards);
    
    console.log(`✅ ${insertedCards.length} cartes de démonstration créées avec succès !`);
    
    // Afficher un résumé par rareté
    const summary = await GameCard.aggregate([
      { $group: { _id: '$rarity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 Résumé des cartes par rareté :');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} cartes`);
    });
    
    return insertedCards;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des cartes:', error);
    throw error;
  }
}

/**
 * Met à jour les utilisateurs existants avec des récompenses de bienvenue
 */
async function updateExistingUsers() {
  try {
    console.log('👥 Mise à jour des utilisateurs existants...');
    
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('📭 Aucun utilisateur trouvé.');
      return;
    }
    
    let updatedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // S'assurer que l'utilisateur a un minimum de tokens
      if (user.tokenBalance < 500) {
        user.tokenBalance = 500;
        needsUpdate = true;
      }
      
      // Donner des boosters gratuits s'il n'en a pas
      const totalBoosters = user.boosters.common + user.boosters.rare + user.boosters.epic + user.boosters.legendary;
      if (totalBoosters === 0) {
        user.boosters.common = 2;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`✅ ${updatedCount} utilisateur(s) mis à jour avec des récompenses de bienvenue.`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des utilisateurs:', error);
    throw error;
  }
}

/**
 * Affiche des statistiques sur la base de données
 */
async function showStats() {
  try {
    console.log('\n📈 Statistiques de la base de données :');
    
    const cardCount = await GameCard.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`   Cartes: ${cardCount}`);
    console.log(`   Utilisateurs: ${userCount}`);
    
    if (userCount > 0) {
      const totalTokens = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$tokenBalance' } } }
      ]);
      
      const totalBoosters = await User.aggregate([
        { 
          $group: { 
            _id: null, 
            common: { $sum: '$boosters.common' },
            rare: { $sum: '$boosters.rare' },
            epic: { $sum: '$boosters.epic' },
            legendary: { $sum: '$boosters.legendary' }
          } 
        }
      ]);
      
      console.log(`   Tokens totaux: ${totalTokens[0]?.total || 0}`);
      console.log(`   Boosters totaux: ${
        (totalBoosters[0]?.common || 0) + 
        (totalBoosters[0]?.rare || 0) + 
        (totalBoosters[0]?.epic || 0) + 
        (totalBoosters[0]?.legendary || 0)
      }`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage des statistiques:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage de l\'initialisation d\'EpicFactionCommunity...\n');
    
    // Connexion à la base de données
    await connectDatabase();
    
    // Initialisation des cartes
    await initializeDemoCards();
    
    // Mise à jour des utilisateurs existants
    await updateExistingUsers();
    
    // Affichage des statistiques
    await showStats();
    
    console.log('\n🎉 Initialisation terminée avec succès !');
    console.log('🎮 Votre système de boosters est maintenant prêt à fonctionner.');
    console.log('\n💡 Instructions pour tester le système:');
    console.log('   1. Connectez-vous à l\'application');
    console.log('   2. Allez dans la section "Shop"');
    console.log('   3. Achetez des boosters avec vos tokens');
    console.log('   4. Ouvrez vos boosters pour obtenir des cartes !');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    console.log('\n📡 Connexion MongoDB fermée.');
  }
}

/**
 * Gestion des arguments de ligne de commande
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    force: false,
    help: false
  };
  
  args.forEach(arg => {
    switch (arg) {
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  });
  
  return options;
}

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log(`
🎮 EpicFactionCommunity - Script d'initialisation

Usage: node src/initDatabase.js [options]

Options:
  -f, --force    Force la réinitialisation même si des données existent
  -h, --help     Affiche cette aide

Description:
  Ce script initialise la base de données avec:
  - 20 cartes de démonstration (8 communes, 6 rares, 4 épiques, 2 légendaires)
  - Mise à jour des utilisateurs existants avec des tokens et boosters gratuits
  - Affichage des statistiques de la base de données

Exemples:
  node src/initDatabase.js              # Initialisation normale
  node src/initDatabase.js --force      # Réinitialisation forcée
  `);
}

// Point d'entrée
if (require.main === module) {
  const options = parseArguments();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  main().catch(console.error);
}

module.exports = {
  connectDatabase,
  initializeDemoCards,
  updateExistingUsers,
  showStats,
  demoCards
};
