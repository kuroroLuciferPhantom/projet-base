// Script de déploiement des contrats EFC (Epic Faction Community) sur Base
const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  // Récupération des signers (comptes Ethereum)
  const [deployer, testUser1, testUser2] = await ethers.getSigners();
  console.log("Déploiement des contrats sur Base avec le compte:", deployer.address);
  console.log("Balance du déployeur:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
  console.log("Réseau de déploiement:", network.name);

  // Paramètres de déploiement
  const TOKEN_INITIAL_SUPPLY = 1000000; // 1 million de tokens EFC
  const CARD_BASE_URI = "https://api.epicfactioncommunity.com/metadata/";
  const TEST_USER_TOKENS = 10000; // Nombre de tokens à distribuer aux utilisateurs de test

  // 1. Déploiement du contrat EFCToken
  console.log("Déploiement du contrat EFCToken...");
  const EFCToken = await ethers.getContractFactory("EFCToken");
  const tokenContract = await EFCToken.deploy(TOKEN_INITIAL_SUPPLY);
  await tokenContract.deployed();
  console.log("EFCToken déployé à l'adresse:", tokenContract.address);

  // 2. Déploiement du contrat EFCCard
  console.log("Déploiement du contrat EFCCard...");
  const EFCCard = await ethers.getContractFactory("EFCCard");
  const cardContract = await EFCCard.deploy();
  await cardContract.deployed();
  console.log("EFCCard déployé à l'adresse:", cardContract.address);

  // 3. Déploiement du contrat EFCBooster
  console.log("Déploiement du contrat EFCBooster...");
  const EFCBooster = await ethers.getContractFactory("EFCBooster");
  const boosterContract = await EFCBooster.deploy(
    tokenContract.address,
    cardContract.address,
    CARD_BASE_URI
  );
  await boosterContract.deployed();
  console.log("EFCBooster déployé à l'adresse:", boosterContract.address);

  // 4. Configuration des contrats
  console.log("Configuration des permissions entre les contrats...");
  
  // Définir le contrat de booster dans le contrat de token
  let tx = await tokenContract.setBoosterContract(boosterContract.address);
  await tx.wait();
  console.log("Contrat de booster défini dans le contrat de token");
  
  // Définir le contrat de booster dans le contrat de cartes
  tx = await cardContract.setBoosterContract(boosterContract.address);
  await tx.wait();
  console.log("Contrat de booster défini dans le contrat de cartes");

  // 5. Distribution de tokens aux utilisateurs de test (seulement en testnet)
  if (network.name === "baseGoerli" || network.name === "localhost") {
    console.log("Distribution de tokens aux utilisateurs de test...");
    if (testUser1) {
      tx = await tokenContract.transfer(testUser1.address, ethers.utils.parseEther(TEST_USER_TOKENS.toString()));
      await tx.wait();
      console.log(`${TEST_USER_TOKENS} EFC transférés à ${testUser1.address}`);
    }
    
    if (testUser2) {
      tx = await tokenContract.transfer(testUser2.address, ethers.utils.parseEther(TEST_USER_TOKENS.toString()));
      await tx.wait();
      console.log(`${TEST_USER_TOKENS} EFC transférés à ${testUser2.address}`);
    }
  }

  // 6. Vérification des configurations
  console.log("\nVérification des configurations:");
  const boosterInToken = await tokenContract.boosterContract();
  console.log("Adresse du booster dans le contrat token:", boosterInToken);
  console.log("Devrait être égal à:", boosterContract.address);
  
  const boosterInCard = await cardContract.boosterContract();
  console.log("Adresse du booster dans le contrat card:", boosterInCard);
  console.log("Devrait être égal à:", boosterContract.address);
  
  // Vérifier les prix des boosters
  const commonPrice = await boosterContract.getBoosterPrice("common");
  console.log(`Prix du booster commun: ${ethers.utils.formatEther(commonPrice)} EFC`);
  
  const rarePrice = await boosterContract.getBoosterPrice("rare");
  console.log(`Prix du booster rare: ${ethers.utils.formatEther(rarePrice)} EFC`);
  
  const epicPrice = await boosterContract.getBoosterPrice("epic");
  console.log(`Prix du booster épique: ${ethers.utils.formatEther(epicPrice)} EFC`);
  
  // Résumé du déploiement
  console.log("\nRésumé du déploiement sur Base:");
  console.log("================================");
  console.log("Réseau:", network.name);
  console.log("EFCToken:", tokenContract.address);
  console.log("EFCCard:", cardContract.address);
  console.log("EFCBooster:", boosterContract.address);
  console.log("Supply initiale de tokens:", TOKEN_INITIAL_SUPPLY);
  console.log("Base URI des métadonnées:", CARD_BASE_URI);
  
  // Enregistrer les adresses dans un fichier pour une utilisation ultérieure
  console.log("\nExportation des adresses de contrats...");
  const contractAddresses = {
    network: network.name,
    EFCToken: tokenContract.address,
    EFCCard: cardContract.address,
    EFCBooster: boosterContract.address,
    deploymentTime: new Date().toISOString()
  };
  
  fs.writeFileSync(
    `deployed-contracts-${network.name}.json`,
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log(`Adresses des contrats enregistrées dans deployed-contracts-${network.name}.json`);

  // Instructions de vérification
  console.log("\nPour vérifier les contrats sur Basescan:");
  console.log("======================================");
  console.log(`npx hardhat verify --network ${network.name} ${tokenContract.address} ${TOKEN_INITIAL_SUPPLY}`);
  console.log(`npx hardhat verify --network ${network.name} ${cardContract.address}`);
  console.log(`npx hardhat verify --network ${network.name} ${boosterContract.address} "${tokenContract.address}" "${cardContract.address}" "${CARD_BASE_URI}"`);

  console.log("\nDéploiement terminé avec succès!");
}

// Exécution de la fonction principale
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });