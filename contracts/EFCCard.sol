// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title EFCCard
 * @dev Contrat ERC721 pour les cartes NFT du jeu Epic Faction Community
 */
contract EFCCard is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    
    // Compteur pour générer des ID uniques pour chaque carte
    Counters.Counter private _tokenIdCounter;
    
    // Adresse du contrat de booster autorisé à créer des cartes
    address public boosterContract;
    
    // Structure de données pour stocker les attributs d'une carte
    struct CardAttributes {
        string rarity;
        uint256 attack;
        uint256 defense;
        uint256 magic;
        uint256 speed;
    }
    
    // Correspondance entre le token ID et les attributs de la carte
    mapping(uint256 => CardAttributes) private _cardAttributes;
    
    // Événement émis lors du changement de l'adresse du contrat de booster
    event BoosterContractChanged(address indexed previousAddress, address indexed newAddress);
    
    // Événement émis lors de la création d'une nouvelle carte
    event CardCreated(uint256 indexed tokenId, address indexed owner, string rarity);
    
    /**
     * @dev Constructeur
     */
    constructor() ERC721("EpicFactionCommunity Card", "EFCC") {
        // Commencer les IDs à 1 au lieu de 0
        _tokenIdCounter.increment();
        
        // Définit le propriétaire du contrat
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Définit l'adresse du contrat de booster
     * @param _boosterContract L'adresse du contrat de booster
     */
    function setBoosterContract(address _boosterContract) external onlyOwner {
        emit BoosterContractChanged(boosterContract, _boosterContract);
        boosterContract = _boosterContract;
    }
    
    /**
     * @dev Crée une nouvelle carte (appelé par le contrat de booster)
     * @param to L'adresse qui recevra la carte NFT
     * @param uri L'URI des métadonnées de la carte
     * @param rarity La rareté de la carte (common, rare, epic, legendary)
     * @param attack La statistique d'attaque
     * @param defense La statistique de défense
     * @param magic La statistique de magie
     * @param speed La statistique de vitesse
     * @return Le token ID de la nouvelle carte
     */
    function mintCard(
        address to, 
        string memory uri, 
        string memory rarity,
        uint256 attack,
        uint256 defense,
        uint256 magic,
        uint256 speed
    ) 
        external 
        returns (uint256) 
    {
        require(msg.sender == boosterContract || msg.sender == owner(), "EFCCard: caller is not authorized");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _cardAttributes[tokenId] = CardAttributes({
            rarity: rarity,
            attack: attack,
            defense: defense,
            magic: magic,
            speed: speed
        });
        
        emit CardCreated(tokenId, to, rarity);
        
        return tokenId;
    }
    
    /**
     * @dev Récupère les attributs d'une carte
     * @param tokenId L'ID du token
     * @return Les attributs de la carte
     */
    function getCardAttributes(uint256 tokenId) external view returns (CardAttributes memory) {
        require(_exists(tokenId), "EFCCard: query for nonexistent token");
        return _cardAttributes[tokenId];
    }
    
    /**
     * @dev Vérifie si l'adresse possède des cartes d'une certaine rareté
     * @param owner L'adresse à vérifier
     * @param rarity La rareté à chercher
     * @return Un booléen indiquant si l'adresse possède au moins une carte de cette rareté
     */
    function hasCardWithRarity(address owner, string memory rarity) external view returns (bool) {
        uint256 balance = balanceOf(owner);
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (keccak256(bytes(_cardAttributes[tokenId].rarity)) == keccak256(bytes(rarity))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Récupère toutes les cartes d'un propriétaire
     * @param owner L'adresse du propriétaire
     * @return Un tableau des token IDs possédés par cette adresse
     */
    function getCardsOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
    
    // Override nécessaires pour résoudre les conflits entre ERC721URIStorage et ERC721Enumerable
    
    /**
     * @dev Hook qui est appelé avant tout transfert de tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Brûle un token spécifique
     */
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Retourne l'URI d'un token
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Vérifie si le contrat implémente une interface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}