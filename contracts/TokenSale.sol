// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./EFCToken.sol";

/**
 * @title TokenSale
 * @dev Contrat permettant l'achat de tokens EFC avec de l'ETH
 */
contract TokenSale is Ownable, ReentrancyGuard {
    // Instance du contrat de token EFC
    EFCToken public efcToken;
    
    // Taux de conversion ETH -> EFC (nombre de tokens EFC par ETH)
    uint256 public rate;
    
    // Événement émis lors d'un achat de tokens
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    
    // Événement émis lorsque le taux de conversion est modifié
    event RateChanged(uint256 previousRate, uint256 newRate);
    
    /**
     * @dev Constructeur
     * @param _tokenAddress Adresse du contrat de token EFC
     * @param _initialRate Taux de conversion initial (tokens EFC par ETH)
     */
    constructor(address _tokenAddress, uint256 _initialRate) {
        require(_tokenAddress != address(0), "TokenSale: token address cannot be zero");
        require(_initialRate > 0, "TokenSale: rate must be positive");
        
        efcToken = EFCToken(_tokenAddress);
        rate = _initialRate;
    }
    
    /**
     * @dev Permet à l'utilisateur d'acheter des tokens EFC avec ETH
     */
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "TokenSale: ETH amount must be positive");
        
        uint256 tokenAmount = calculateTokenAmount(msg.value);
        require(tokenAmount > 0, "TokenSale: token amount must be positive");
        
        // Vérifier que le contrat a suffisamment de tokens à vendre
        require(efcToken.balanceOf(address(this)) >= tokenAmount, 
                "TokenSale: insufficient token balance in contract");
        
        // Transférer les tokens à l'acheteur
        efcToken.transfer(msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }
    
    /**
     * @dev Calcule le montant de tokens à recevoir en fonction de l'ETH envoyé
     * @param ethAmount Montant d'ETH envoyé
     * @return tokenAmount Montant de tokens EFC à recevoir
     */
    function calculateTokenAmount(uint256 ethAmount) public view returns (uint256) {
        return ethAmount * rate;
    }
    
    /**
     * @dev Permet au propriétaire de modifier le taux de conversion
     * @param _newRate Nouveau taux de conversion
     */
    function setRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "TokenSale: rate must be positive");
        
        emit RateChanged(rate, _newRate);
        rate = _newRate;
    }
    
    /**
     * @dev Permet au propriétaire de retirer l'ETH du contrat
     * @param to Adresse à laquelle envoyer l'ETH
     * @param amount Montant d'ETH à retirer
     */
    function withdrawETH(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "TokenSale: recipient cannot be zero address");
        require(amount > 0 && amount <= address(this).balance, 
                "TokenSale: invalid withdrawal amount");
        
        to.transfer(amount);
    }
    
    /**
     * @dev Permet au propriétaire d'ajouter plus de tokens au contrat de vente
     * @param amount Montant de tokens à ajouter
     */
    function addTokensToSale(uint256 amount) external onlyOwner {
        require(amount > 0, "TokenSale: amount must be positive");
        
        efcToken.transferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Permet au propriétaire de retirer des tokens du contrat de vente
     * @param to Adresse à laquelle envoyer les tokens
     * @param amount Montant de tokens à retirer
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "TokenSale: recipient cannot be zero address");
        require(amount > 0 && amount <= efcToken.balanceOf(address(this)), 
                "TokenSale: invalid withdrawal amount");
        
        efcToken.transfer(to, amount);
    }
}
