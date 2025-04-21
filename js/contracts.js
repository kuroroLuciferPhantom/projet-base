// Adresses des contrats déployés
const CONTRACT_ADDRESSES = {
    testnet: {
        NFT: '',          // À remplir après le déploiement
        TOKEN: '',        // À remplir après le déploiement
        MARKETPLACE: ''   // À remplir après le déploiement
    },
    mainnet: {
        NFT: '',          // À remplir après le déploiement
        TOKEN: '',        // À remplir après le déploiement
        MARKETPLACE: ''   // À remplir après le déploiement
    }
};

// ABI du contrat NFT (ERC-721 ou ERC-1155)
const NFT_ABI = [
    // Interface minimale pour NFT ERC-721
    "function balanceOf(address owner) view returns (uint256 balance)",
    "function ownerOf(uint256 tokenId) view returns (address owner)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address operator)",
    "function setApprovalForAll(address operator, bool _approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function tokenURI(uint256 tokenId) view returns (string memory)",
    
    // Méthodes spécifiques à notre jeu de cartes (à compléter)
    "function mintCard(address to, uint256 cardType) returns (uint256)",
    "function getCardStats(uint256 tokenId) view returns (uint256 attack, uint256 defense, uint256 magic, uint256 speed)",
    "function getCardRarity(uint256 tokenId) view returns (uint8)",
    "function fuseCards(uint256 tokenId1, uint256 tokenId2) returns (uint256)",
    "function getCardAcquiredTime(uint256 tokenId) view returns (uint256)",
    
    // Événements
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "event CardMinted(address indexed to, uint256 indexed tokenId, uint256 cardType)",
    "event CardsFused(address indexed owner, uint256 indexed tokenId1, uint256 indexed tokenId2, uint256 newTokenId)"
];

// ABI du contrat Token (ERC-20)
const TOKEN_ABI = [
    // Interface standard ERC-20
    "function name() view returns (string memory)",
    "function symbol() view returns (string memory)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    
    // Méthodes spécifiques à notre jeu
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "function burnFrom(address from, uint256 amount)",
    
    // Événements
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ABI du contrat Marketplace
const MARKETPLACE_ABI = [
    // Fonctions du marché
    "function listCard(uint256 tokenId, uint256 price) returns (uint256 listingId)",
    "function cancelListing(uint256 listingId)",
    "function buyCard(uint256 listingId)",
    "function getListingPrice(uint256 listingId) view returns (uint256)",
    "function getListingOwner(uint256 listingId) view returns (address)",
    "function getListingTokenId(uint256 listingId) view returns (uint256)",
    "function isListingActive(uint256 listingId) view returns (bool)",
    "function getAllListings() view returns (uint256[] memory)",
    "function getUserListings(address user) view returns (uint256[] memory)",
    
    // Fonctions pack
    "function createPack(uint256 price, uint256[] memory cardTypes, uint256[] memory rarities, uint256[] memory probabilities)",
    "function buyPack(uint256 packId) returns (uint256[] memory)",
    "function getPackPrice(uint256 packId) view returns (uint256)",
    "function getAllPackTypes() view returns (uint256[] memory)",
    
    // Événements
    "event CardListed(address indexed owner, uint256 indexed tokenId, uint256 indexed listingId, uint256 price)",
    "event ListingCancelled(uint256 indexed listingId)",
    "event CardPurchased(address indexed buyer, address indexed seller, uint256 indexed listingId, uint256 tokenId, uint256 price)",
    "event PackCreated(uint256 indexed packId, uint256 price)",
    "event PackPurchased(address indexed buyer, uint256 indexed packId, uint256[] tokenIds)"
];

// Exporter les ABIs et adresses pour les autres fichiers
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
window.NFT_ABI = NFT_ABI;
window.TOKEN_ABI = TOKEN_ABI;
window.MARKETPLACE_ABI = MARKETPLACE_ABI;
