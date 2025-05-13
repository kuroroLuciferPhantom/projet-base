// Script de test pour vérifier l'achat de boosters et la création de NFTs sur Base
const { ethers, network } = require("hardhat");
const fs = require("fs");

// Fonction utilitaire pour attendre une transaction
async function waitForTx(tx) {
  console.log(`Transaction envoyée: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Transaction confirmée dans le bloc ${receipt.blockNumber}`);
  return receipt;
}

// Afficher les boosters dans un format lisible
function displayBoosterInfo(boosterInfo) {
  console.log(`Nom: ${boosterInfo.name}`);
  console.log(`Prix: ${ethers.utils.formatEther(boosterInfo.price)} EFC`);
  console.log(`Nombre de cartes: ${boosterInfo.cardCount}`);
  console.log(`Actif: ${boosterInfo.isActive}`);
}

// Afficher les détails d'une carte NFT
async function displayCardDetails(cardContract, tokenId) {
  const uri = await cardContract.tokenURI(tokenId);
  const attributes = await cardContract.getCardAttributes(tokenId);
  
  console.log(`\nCarte NFT #${tokenId}:`);
  console.log(`URI: ${uri}`);
  console.log(`Rareté: ${attributes.rarity}`);
  console.log(`Attaque: ${attributes.attack}`);
  console.log(`Défense: ${attributes.defense}`);
  console.log(`Magie: ${attributes.magic}`);
  console.log(`Vitesse: ${attributes.speed}`);
}

async function main() {
  console.log(`Exécution du test de booster sur le réseau: ${network.name}`);
  
  // Vérifier que nous sommes sur un réseau Base
  if (!network.name.includes("base") && network.name !== "localhost" && network.name !== "hardhat") {
    console.warn(`ATTENTION: Vous n'êtes pas sur un réseau Base, mais sur ${network.name}.`);
    console.warn("Ce script est optimisé pour Base. Continuer quand même? (Ctrl+C pour annuler)");
    // Attendre 5 secondes pour permettre l'annulation
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Charger les adresses des contrats déployés
  let contractAddresses;
  try {
    const filename = `deployed-contracts-${network.name}.json`;
    if (fs.existsSync(filename)) {
      contractAddresses = JSON.parse(fs.readFileSync(filename));
    } else {
      console.log(`Fichier ${filename} non trouvé. Tentative avec deployed-contracts.json...`);
      contractAddresses = JSON.parse(fs.readFileSync("deployed-contracts.json"));
    }
  } catch (err) {
    console.error("Erreur lors de la lecture des adresses de contrats:", err.message);
    console.error("Assurez-vous d'avoir exécuté le script de déploiement sur Base d'abord.");
    process.exit(1);
  }
  
  // Récupération des signers
  const [deployer, testUser1] = await ethers.getSigners();
  console.log("Test d'achat de booster avec le compte:", testUser1 ? testUser1.address : deployer.address);
  
  // Signer à utiliser pour les tests
  const signer = testUser1 || deployer;
  
  // Charger les contrats
  const tokenContract = await ethers.getContractAt("EFCToken", contractAddresses.EFCToken);
  const cardContract = await ethers.getContractAt("EFCCard", contractAddresses.EFCCard);
  const boosterContract = await ethers.getContractAt("EFCBooster", contractAddresses.EFCBooster);
  
  // Vérifier le solde de tokens
  const balance = await tokenContract.balanceOf(signer.address);
  console.log(`Solde de tokens: ${ethers.utils.formatEther(balance)} EFC`);
  
  // Si le solde est faible, distribuer des tokens pour les tests
  if (balance.lt(ethers.utils.parseEther("1000"))) {
    console.log("Solde faible, distribution de tokens pour les tests...");
    const tx = await tokenContract.connect(deployer).transfer(signer.address, ethers.utils.parseEther("1000"));
    await waitForTx(tx);
    const newBalance = await tokenContract.balanceOf(signer.address);
    console.log(`Nouveau solde: ${ethers.utils.formatEther(newBalance)} EFC`);
  }
  
  // Afficher les informations sur les boosters disponibles
  console.log("\nInformations sur les boosters disponibles:");
  console.log("=========================================");
  
  const boosterTypes = ["common", "rare", "epic", "legendary"];
  for (const type of boosterTypes) {
    try {
      const price = await boosterContract.getBoosterPrice(type);
      const cardCount = await boosterContract.getBoosterCardCount(type);
      const boosterInfo = await boosterContract.boosters(type);
      
      console.log(`\nBooster ${type}:`);
      console.log(`Prix: ${ethers.utils.formatEther(price)} EFC`);
      console.log(`Nombre de cartes: ${cardCount}`);
      console.log(`Actif: ${boosterInfo.isActive}`);
    } catch (err) {
      console.log(`Booster ${type} non disponible ou inactif`);
    }
  }
  
  // Tester l'achat d'un booster
  console.log("\nTest d'achat d'un booster:");
  console.log("========================");
  
  const boosterType = "common"; // Type de booster à acheter
  
  // Vérifier et approuver les tokens pour l'achat
  const boosterPrice = await boosterContract.getBoosterPrice(boosterType);
  console.log(`Prix du booster ${boosterType}: ${ethers.utils.formatEther(boosterPrice)} EFC`);
  
  // Vérifier l'allowance actuelle
  const allowance = await tokenContract.allowance(signer.address, boosterContract.address);
  console.log(`Allowance actuelle: ${ethers.utils.formatEther(allowance)} EFC`);
  
  if (allowance.lt(boosterPrice)) {
    console.log("Approbation des tokens pour l'achat...");
    const approveTx = await tokenContract.connect(signer).approve(boosterContract.address, ethers.constants.MaxUint256);
    await waitForTx(approveTx);
    console.log("Tokens approuvés avec succès");
  }
  
  // Acheter le booster
  console.log(`Achat d'un booster ${boosterType}...`);
  const purchaseTx = await boosterContract.connect(signer).purchaseBooster(boosterType);
  const receipt = await waitForTx(purchaseTx);
  
  // Rechercher l'événement d'achat dans les logs
  const abi = [
    "event BoosterPurchased(address indexed buyer, string boosterType, uint256 price)",
    "event CardGenerated(uint256 indexed tokenId, address indexed owner, string rarity)"
  ];
  const interface = new ethers.utils.Interface(abi);
  
  // Filtrer les événements BoosterPurchased
  const purchaseEvents = receipt.logs
    .filter(log => log.topics[0] === interface.getEventTopic("BoosterPurchased"))
    .map(log => {
      try {
        const event = interface.parseLog(log);
        return {
          buyer: event.args.buyer,
          boosterType: event.args.boosterType,
          price: event.args.price
        };
      } catch (err) {
        return null;
      }
    })
    .filter(event => event !== null);
  
  if (purchaseEvents.length > 0) {
    console.log("\nÉvénement d'achat détecté:");
    console.log(`Acheteur: ${purchaseEvents[0].buyer}`);
    console.log(`Type de booster: ${purchaseEvents[0].boosterType}`);
    console.log(`Prix payé: ${ethers.utils.formatEther(purchaseEvents[0].price)} EFC`);
  }
  
  // Filtrer les événements CardGenerated
  const cardEvents = receipt.logs
    .filter(log => log.topics[0] === interface.getEventTopic("CardGenerated"))
    .map(log => {
      try {
        const event = interface.parseLog(log);
        return {
          tokenId: event.args.tokenId.toString(),
          owner: event.args.owner,
          rarity: event.args.rarity
        };
      } catch (err) {
        return null;
      }
    })
    .filter(event => event !== null);
  
  if (cardEvents.length > 0) {
    console.log("\nCartes générées:");
    cardEvents.forEach(card => {
      console.log(`Token ID: ${card.tokenId}, Rareté: ${card.rarity}, Propriétaire: ${card.owner}`);
    });
  }
  
  // Récupérer les token IDs des cartes générées
  console.log("\nRécupération des cartes générées...");
  const cardIds = await boosterContract.connect(signer).getLastPurchasedCards();
  console.log(`Nombre de cartes générées: ${cardIds.length}`);
  
  // Afficher les détails de chaque carte
  console.log("\nDétails des cartes NFT générées:");
  for (const tokenId of cardIds) {
    await displayCardDetails(cardContract, tokenId);
  }
  
  // Vérifier le nouveau solde de tokens
  const newBalance = await tokenContract.balanceOf(signer.address);
  console.log(`\nNouveau solde après achat: ${ethers.utils.formatEther(newBalance)} EFC`);
  
  // Vérifier le nombre de NFTs possédés
  const nftBalance = await cardContract.balanceOf(signer.address);
  console.log(`Nombre total de cartes NFT possédées: ${nftBalance}`);
  
  console.log("\nTest d'achat de booster sur Base terminé avec succès!");
}

// Exécution de la fonction principale
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });