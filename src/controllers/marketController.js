const Card = require('../models/Card');
const Transaction = require('../models/Transaction');

// Obtenir les cartes disponibles sur le marché
exports.getMarketCards = async (req, res) => {
  try {
    // Récupérer les cartes mises en vente
    const marketCards = await Card.find({ isForSale: true })
      .sort({ price: 1 }); // Trier par prix croissant
    
    res.status(200).json({
      success: true,
      count: marketCards.length,
      cards: marketCards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes du marché:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des cartes du marché' 
    });
  }
};

// Acheter une carte
exports.buyCard = async (req, res) => {
  try {
    const { cardId } = req.body;
    const buyerId = req.user.id;
    
    // Récupérer la carte
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si la carte est en vente
    if (!card.isForSale) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cette carte n\'est pas en vente' 
      });
    }
    
    // Vérifier si l'acheteur a assez de tokens (simulation)
    // Dans une implémentation réelle, il faudrait vérifier le solde de l'utilisateur
    
    // Mettre à jour le propriétaire de la carte
    const sellerId = card.owner;
    card.owner = buyerId;
    card.isForSale = false;
    await card.save();
    
    // Enregistrer la transaction
    const transaction = new Transaction({
      card: cardId,
      seller: sellerId,
      buyer: buyerId,
      price: card.price,
      timestamp: Date.now()
    });
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: 'Carte achetée avec succès',
      card
    });
  } catch (error) {
    console.error('Erreur lors de l\'achat de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'achat de la carte' 
    });
  }
};

// Mettre une carte en vente
exports.sellCard = async (req, res) => {
  try {
    const { cardId, price } = req.body;
    const sellerId = req.user.id;
    
    // Récupérer la carte
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (card.owner.toString() !== sellerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas le propriétaire de cette carte' 
      });
    }
    
    // Mettre la carte en vente
    card.isForSale = true;
    card.price = price;
    await card.save();
    
    res.status(200).json({
      success: true,
      message: 'Carte mise en vente avec succès',
      card
    });
  } catch (error) {
    console.error('Erreur lors de la mise en vente de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise en vente de la carte' 
    });
  }
};