// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./EFCToken.sol";
import "./EFCCard.sol";

/**
 * @title EFCBooster
 * @dev Contrat gérant l'achat et l'ouverture de boosters
 */
contract EFCBooster is Ownable {
    using Strings for uint256;
    
    // Interface du token ERC20 utilisé pour les paiements
    EFCToken public tokenContract;
    
    // Interface du contrat de cartes NFT
    EFCCard public cardContract;
    
    // Structure de données pour une carte
    struct CardInfo {
        string rarity;
        uint256 attack;
        uint256 defense;
        uint256 magic;
        uint256 speed;
    }
    
    // Structure de données pour un type de booster
    struct BoosterInfo {
        string name;
        uint256 price;
        uint256 cardCount;
        bool isActive;
    }
    
    // Informations sur les types de boosters disponibles
    mapping(string => BoosterInfo) public boosters;
    
    // Probabilités de raretés pour chaque type de booster
    mapping(string => mapping(string => uint256)) public rarityProbabilities;
    
    // Cartes obtenues lors du dernier achat de booster
    mapping(address => uint256[]) private _lastPurchasedCards;
    
    // Base URI pour les métadonnées des cartes
    string public baseURI;
    
    // Événements
    event BoosterPurchased(address indexed buyer, string boosterType, uint256 price);
    event CardGenerated(uint256 indexed tokenId, address indexed owner, string rarity);
    event BoosterUpdated(string boosterType, uint256 price, uint256 cardCount);
    event RarityProbabilitiesUpdated(string boosterType);
    event BaseURIUpdated(string newBaseURI);
    
    // Raretés disponibles
    string[] public availableRarities = ["common", "rare", "epic", "legendary"];
    
    /**
     * @dev Constructeur
     * @param _tokenContract Adresse du contrat de token ERC20
     * @param _cardContract Adresse du contrat de cartes NFT
     * @param _baseURI URI de base pour les métadonnées des cartes
     */
    constructor(address _tokenContract, address _cardContract, string memory _baseURI) Ownable(msg.sender) {
        tokenContract = EFCToken(_tokenContract);
        cardContract = EFCCard(_cardContract);
        baseURI = _baseURI;
        
        // Initialisation des types de boosters
        _initializeBoosterTypes();
    }
    
    /**
     * @dev Initialise les types de boosters par défaut
     */
    function _initializeBoosterTypes() private {
        // Booster commun
        boosters["common"] = BoosterInfo({
            name: "Booster Standard",
            price: 100 * 10**18, // 100 tokens
            cardCount: 5,
            isActive: true
        });
        
        rarityProbabilities["common"]["common"] = 70;
        rarityProbabilities["common"]["rare"] = 20;
        rarityProbabilities["common"]["epic"] = 8;
        rarityProbabilities["common"]["legendary"] = 2;
        
        // Booster rare
        boosters["rare"] = BoosterInfo({
            name: "Booster Premium",
            price: 250 * 10**18, // 250 tokens
            cardCount: 5,
            isActive: true
        });
        
        rarityProbabilities["rare"]["common"] = 55;
        rarityProbabilities["rare"]["rare"] = 25;
        rarityProbabilities["rare"]["epic"] = 15;
        rarityProbabilities["rare"]["legendary"] = 5;
        
        // Booster épique
        boosters["epic"] = BoosterInfo({
            name: "Booster Ultimate",
            price: 500 * 10**18, // 500 tokens
            cardCount: 5,
            isActive: true
        });
        
        rarityProbabilities["epic"]["common"] = 40;
        rarityProbabilities["epic"]["rare"] = 25;
        rarityProbabilities["epic"]["epic"] = 25;
        rarityProbabilities["epic"]["legendary"] = 10;
        
        // Booster légendaire
        boosters["legendary"] = BoosterInfo({
            name: "Booster Légendaire",
            price: 1000 * 10**18, // 1000 tokens
            cardCount: 5,
            isActive: true
        });
        
        rarityProbabilities["legendary"]["common"] = 20;
        rarityProbabilities["legendary"]["rare"] = 30;
        rarityProbabilities["legendary"]["epic"] = 35;
        rarityProbabilities["legendary"]["legendary"] = 15;
    }
    
    /**
     * @dev Achète un booster et génère des cartes
     * @param boosterType Le type de booster à acheter
     * @return Un tableau des token IDs des cartes générées
     */
    function purchaseBooster(string memory boosterType) external returns (uint256[] memory) {
        // Vérifier que le type de booster est valide et actif
        require(boosters[boosterType].isActive, "EFCBooster: invalid or inactive booster type");
        
        uint256 price = boosters[boosterType].price;
        uint256 cardCount = boosters[boosterType].cardCount;
        
        // Vérifier que l'utilisateur a suffisamment de tokens
        require(tokenContract.balanceOf(msg.sender) >= price, "EFCBooster: insufficient token balance");
        
        // Brûler les tokens
        tokenContract.burnFromBooster(msg.sender, price);
        
        // Générer les cartes aléatoires
        uint256[] memory cardIds = _generateRandomCards(msg.sender, boosterType, cardCount);
        
        // Stocker les cartes obtenues pour cet achat
        _lastPurchasedCards[msg.sender] = cardIds;
        
        // Émettre l'événement d'achat
        emit BoosterPurchased(msg.sender, boosterType, price);
        
        return cardIds;
    }
    
    /**
     * @dev Récupère les token IDs des cartes obtenues lors du dernier achat
     * @return Un tableau des token IDs
     */
    function getLastPurchasedCards() external view returns (uint256[] memory) {
        return _lastPurchasedCards[msg.sender];
    }
    
    /**
     * @dev Génère des cartes aléatoires pour un booster
     * @param to L'adresse qui recevra les cartes
     * @param boosterType Le type de booster
     * @param count Le nombre de cartes à générer
     * @return Un tableau des token IDs générés
     */
    function _generateRandomCards(address to, string memory boosterType, uint256 count) private returns (uint256[] memory) {
        uint256[] memory cardIds = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            // Déterminer la rareté de la carte en fonction des probabilités
            string memory rarity = _getRandomRarity(boosterType);
            
            // Générer des statistiques aléatoires en fonction de la rareté
            CardInfo memory cardInfo = _generateCardStats(rarity);
            
            // Générer un URI pour les métadonnées de la carte
            string memory tokenURI = _generateTokenURI(rarity);
            
            // Créer la carte NFT
            uint256 tokenId = cardContract.mintCard(
                to,
                tokenURI,
                cardInfo.rarity,
                cardInfo.attack,
                cardInfo.defense,
                cardInfo.magic,
                cardInfo.speed
            );
            
            cardIds[i] = tokenId;
            
            // Émettre l'événement de génération
            emit CardGenerated(tokenId, to, rarity);
        }
        
        return cardIds;
    }
    
    /**
     * @dev Détermine aléatoirement la rareté d'une carte en fonction des probabilités du booster
     * @param boosterType Le type de booster
     * @return La rareté de la carte
     */
    function _getRandomRarity(string memory boosterType) private view returns (string memory) {
        // Générer un nombre aléatoire entre 0 et 99
        uint256 randomNum = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 100;
        
        uint256 cumulativeProbability = 0;
        
        for (uint256 i = 0; i < availableRarities.length; i++) {
            string memory rarity = availableRarities[i];
            cumulativeProbability += rarityProbabilities[boosterType][rarity];
            
            if (randomNum < cumulativeProbability) {
                return rarity;
            }
        }
        
        // Si pour une raison quelconque nous arrivons ici, retourner la rareté commune par défaut
        return "common";
    }
    
    /**
     * @dev Génère des statistiques aléatoires pour une carte en fonction de sa rareté
     * @param rarity La rareté de la carte
     * @return Les statistiques de la carte
     */
    function _generateCardStats(string memory rarity) private view returns (CardInfo memory) {
        // Multiplicateur de statistiques basé sur la rareté
        uint256 multiplier;
        
        if (_compareStrings(rarity, "legendary")) {
            multiplier = 3;
        } else if (_compareStrings(rarity, "epic")) {
            multiplier = 2;
        } else if (_compareStrings(rarity, "rare")) {
            multiplier = 15; // 1.5 (multipliés par 10)
        } else {
            multiplier = 10; // 1.0 (multipliés par 10)
        }
        
        // Générer des statistiques de base entre 10 et 40
        uint256 baseAttack = (uint256(keccak256(abi.encodePacked("attack", block.timestamp, msg.sender))) % 30) + 10;
        uint256 baseDefense = (uint256(keccak256(abi.encodePacked("defense", block.timestamp, msg.sender))) % 30) + 10;
        uint256 baseMagic = (uint256(keccak256(abi.encodePacked("magic", block.timestamp, msg.sender))) % 30) + 10;
        uint256 baseSpeed = (uint256(keccak256(abi.encodePacked("speed", block.timestamp, msg.sender))) % 30) + 10;
        
        // Appliquer le multiplicateur
        baseAttack = (baseAttack * multiplier) / 10;
        baseDefense = (baseDefense * multiplier) / 10;
        baseMagic = (baseMagic * multiplier) / 10;
        baseSpeed = (baseSpeed * multiplier) / 10;
        
        return CardInfo({
            rarity: rarity,
            attack: baseAttack,
            defense: baseDefense,
            magic: baseMagic,
            speed: baseSpeed
        });
    }
    
    /**
     * @dev Génère un URI pour les métadonnées d'une carte
     * @param rarity La rareté de la carte
     * @return L'URI des métadonnées
     */
    function _generateTokenURI(string memory rarity) private view returns (string memory) {
        // Format: baseURI/rarity/[timestamp-entropy].json
        uint256 entropy = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));
        return string(abi.encodePacked(baseURI, rarity, "/", entropy.toString(), ".json"));
    }
    
    /**
     * @dev Compare deux chaînes de caractères
     * @param a Première chaîne
     * @param b Deuxième chaîne
     * @return Booléen indiquant si les chaînes sont égales
     */
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
    
    // Méthodes administratives
    
    /**
     * @dev Met à jour les informations d'un type de booster
     * @param boosterType Le type de booster
     * @param name Le nom du booster
     * @param price Le prix du booster en tokens
     * @param cardCount Le nombre de cartes dans le booster
     * @param isActive Indique si le booster est disponible à l'achat
     */
    function updateBooster(
        string memory boosterType,
        string memory name,
        uint256 price,
        uint256 cardCount,
        bool isActive
    ) 
        external 
        onlyOwner 
    {
        boosters[boosterType] = BoosterInfo({
            name: name,
            price: price,
            cardCount: cardCount,
            isActive: isActive
        });
        
        emit BoosterUpdated(boosterType, price, cardCount);
    }
    
    /**
     * @dev Met à jour les probabilités de raretés pour un type de booster
     * @param boosterType Le type de booster
     * @param probabilities Les probabilités pour chaque rareté
     */
    function updateRarityProbabilities(
        string memory boosterType,
        uint256[] memory probabilities
    ) 
        external 
        onlyOwner 
    {
        require(probabilities.length == availableRarities.length, "EFCBooster: invalid probabilities length");
        
        uint256 totalProbability = 0;
        
        for (uint256 i = 0; i < probabilities.length; i++) {
            totalProbability += probabilities[i];
            rarityProbabilities[boosterType][availableRarities[i]] = probabilities[i];
        }
        
        require(totalProbability == 100, "EFCBooster: probabilities must sum to 100");
        
        emit RarityProbabilitiesUpdated(boosterType);
    }
    
    /**
     * @dev Met à jour l'URI de base pour les métadonnées des cartes
     * @param _baseURI La nouvelle URI de base
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        emit BaseURIUpdated(_baseURI);
    }
    
    /**
     * @dev Met à jour l'adresse du contrat de token
     * @param _tokenContract La nouvelle adresse du contrat
     */
    function setTokenContract(address _tokenContract) external onlyOwner {
        tokenContract = EFCToken(_tokenContract);
    }
    
    /**
     * @dev Met à jour l'adresse du contrat de cartes
     * @param _cardContract La nouvelle adresse du contrat
     */
    function setCardContract(address _cardContract) external onlyOwner {
        cardContract = EFCCard(_cardContract);
    }
    
    /**
     * @dev Récupère le prix d'un booster
     * @param boosterType Le type de booster
     * @return Le prix du booster en tokens
     */
    function getBoosterPrice(string memory boosterType) external view returns (uint256) {
        require(boosters[boosterType].isActive, "EFCBooster: invalid or inactive booster type");
        return boosters[boosterType].price;
    }
    
    /**
     * @dev Récupère le nombre de cartes dans un booster
     * @param boosterType Le type de booster
     * @return Le nombre de cartes
     */
    function getBoosterCardCount(string memory boosterType) external view returns (uint256) {
        require(boosters[boosterType].isActive, "EFCBooster: invalid or inactive booster type");
        return boosters[boosterType].cardCount;
    }
}