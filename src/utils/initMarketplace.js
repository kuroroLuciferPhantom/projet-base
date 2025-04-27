/**
 * Script d'initialisation pour la marketplace
 * Crée des cartes de test et les met en vente
 */

const mongoose = require('mongoose');
const Card = require('../models/Card');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion à MongoDB établie avec succès');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

// Données des cartes de test
const testCards = [
  {
    name: "Dragon Céleste",
    description: "Un puissant dragon qui règne sur les cieux. Sa présence seule est capable d'intimider les adversaires les plus redoutables.",
    rarity: "legendary",
    imageUrl: "https://placehold.co/400x500/F59E0B/FFF?text=Dragon+C%C3%A9leste",
    stats: {
      attack: 85,
      defense: 70,
      magic: 90,
      speed: 75
    },
    price: 500,
    isForSale: true
  },
  {
    name: "Guerrier Mystique",
    description: "Un guerrier maîtrisant les arts mystiques anciens. Ses attaques combinent force physique et énergie spirituelle.",
    rarity: "epic",
    imageUrl: "https://placehold.co/400x500/8B5CF6/FFF?text=Guerrier+Mystique",
    stats: {
      attack: 75,
      defense: 65,
      magic: 80,
      speed: 70
    },
    price: 250,
    isForSale: true
  },
  {
    name: "Archer d'Émeraude",
    description: "Un archer d'élite dont les flèches ne manquent jamais leur cible. Sa précision est légendaire parmi les habitants de la forêt.",
    rarity: "rare",
    imageUrl: "https://placehold.co/400x500/3B82F6/FFF?text=Archer+d%27%C3%89meraude",
    stats: {
      attack: 65,
      defense: 40,
      magic: 30,
      speed: 85
    },
    price: 120,
    isForSale: true
  },
  {
    name: "Gardien de Pierre",
    description: "Une créature de pierre massive qui protège les passages anciens. Sa défense est presque impénétrable.",
    rarity: "rare",
    imageUrl: "https://placehold.co/400x500/3B82F6/FFF?text=Gardien+de+Pierre",
    stats: {
      attack: 45,
      defense: 90,
      magic: 20,
      speed: 30
    },
    price: 150,
    isForSale: true
  },
  {
    name: "Mage des Flammes",
    description: "Un mage qui a consacré sa vie à l'étude des arts du feu. Ses sorts peuvent réduire en cendres des armées entières.",
    rarity: "epic",
    imageUrl: "https://placehold.co/400x500/8B5CF6/FFF?text=Mage+des+Flammes",
    stats: {
      attack: 30,
      defense: 40,
      magic: 95,
      speed: 60
    },
    price: 280,
    isForSale: true
  },
  {
    name: "Écuyer Vaillant",
    description: "Un jeune écuyer aspirant à devenir chevalier. Sa détermination et son courage compensent son manque d'expérience.",
    rarity: "common",
    imageUrl: "https://placehold.co/400x500/6B7280/FFF?text=%C3%89cuyer+Vaillant",
    stats: {
      attack: 40,
      defense: 45,
      magic: 10,
      speed: 50
    },
    price: 50,
    isForSale: true
  },
  {
    name: "Nymphe des Eaux",
    description: "Une créature des eaux profondes qui envoûte par son chant mystique. Elle peut contrôler les courants marins.",
    rarity: "rare",
    imageUrl: "https://placehold.co/400x500/3B82F6/FFF?text=Nymphe+des+Eaux",
    stats: {
      attack: 35,
      defense: 50,
      magic: 75,
      speed: 65
    },
    price: 130,
    isForSale: true
  },
  {
    name: "Démon Noir",
    description: "Une entité venue des abysses, ayant juré de détruire tout ce qui se trouve sur son passage.",
    rarity: "legendary",
    imageUrl: "https://placehold.co/400x500/F59E0B/FFF?text=D%C3%A9mon+Noir",
    stats: {
      attack: 90,
      defense: 60,
      magic: 85,
      speed: 80
    },
    price: 550,
    isForSale: true
  },
  {
    name: "Druide de la Forêt",
    description: "Un sage druide qui communique avec la nature. Il peut invoquer des créatures végétales pour l'aider au combat.",
    rarity: "epic",
    imageUrl: "https://placehold.co/400x500/8B5CF6/FFF?text=Druide+de+la+For%C3%AAt",
    stats: {
      attack: 40,
      defense: 55,
      magic: 85,
      speed: 50
    },
    price: 240,
    isForSale: true
  },
  {
    name: "Soldat de la Garde",
    description: "Un soldat loyal et discipliné. Il n'est peut-être pas le plus puissant, mais sa détermination est inébranlable.",
    rarity: "common",
    imageUrl: "https://placehold.co/400x500/6B7280/FFF?text=Soldat+de+la+Garde",
    stats: {
      attack: 50,
      defense: 50,
      magic: 5,
      speed: 45
    },
    price: 45,
    isForSale: true
  },
];

// Fonction pour créer l'administrateur et les cartes
const createTestData = async () => {
  try {
    // Créer ou récupérer l'administrateur
    let admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      admin = new User({
        username: 'admin',
        email: 'admin@cryptocards.com',
        password: '$2b$10$rIC1Jf4rI3ot4mpn/ZU2CeV1zuK5iRlehERrq9a9oL4.fY7CmFKfC', // Le mot de passe est "admin123"
        role: 'admin',
        walletAddress: '0x1234567890123456789012345678901234567890',
        balance: 10000 // Solde initial
      });
      
      await admin.save();
      console.log('Administrateur créé');
    }
    
    // Génération des IDs de tokens uniques (simulés)
    const generateTokenId = (index) => {
      return `nft_${Date.now()}_${index}_${Math.floor(Math.random() * 1000000)}`;
    };
    
    // Créer les cartes de test
    let cardsCreated = 0;
    
    for (let i = 0; i < testCards.length; i++) {
      const cardData = testCards[i];
      
      // Vérifier si une carte avec ce nom existe déjà
      const existingCard = await Card.findOne({ name: cardData.name });
      
      if (!existingCard) {
        const card = new Card({
          name: cardData.name,
          description: cardData.description,
          rarity: cardData.rarity,
          imageUrl: cardData.imageUrl,
          tokenId: generateTokenId(i),
          owner: admin._id,
          stats: cardData.stats,
          isForSale: cardData.isForSale,
          price: cardData.price,
          isPublic: true,
          createdAt: new Date()
        });
        
        await card.save();
        cardsCreated++;
        
        // Créer des transactions fictives pour certaines cartes
        if (i % 3 === 0) {
          const transaction = new Transaction({
            card: card._id,
            seller: admin._id,
            buyer: admin._id, // L'admin achète à lui-même (simulation)
            price: Math.floor(cardData.price * 0.9), // Prix légèrement inférieur
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Date aléatoire dans les 30 derniers jours
          });
          
          await transaction.save();
          console.log(`Transaction créée pour ${cardData.name}`);
        }
      }
    }
    
    console.log(`${cardsCreated} cartes créées pour la marketplace`);
    console.log('Initialisation de la marketplace terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la marketplace:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
};

// Exécution du script
(async () => {
  await connectDB();
  await createTestData();
})();
