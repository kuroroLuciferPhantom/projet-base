const Card = require('../models/Card');

// Obtenir les cartes de l'utilisateur
exports.getUserCards = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les cartes de l'utilisateur depuis la base de données
    const cards = await Card.find({ owner: userId });
    
    res.status(200).json({
      success: true,
      count: cards.length,
      cards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des cartes' 
    });
  }
};

// Obtenir les détails d'une carte
exports.getCardDetails = async (req, res) => {
  try {
    const cardId = req.params.id;
    
    // Récupérer les détails de la carte depuis la base de données
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Carte non trouvée' 
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la carte
    if (card.owner.toString() !== req.user.id && !card.isPublic) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'êtes pas autorisé à voir cette carte' 
      });
    }
    
    res.status(200).json({
      success: true,
      card
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la carte:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des détails de la carte' 
    });
  }
};