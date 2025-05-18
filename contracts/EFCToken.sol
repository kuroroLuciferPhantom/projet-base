// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EFCToken
 * @dev ERC20 Token pour Epic Faction Community
 */
contract EFCToken is ERC20, Ownable {
    // Adresse du contrat de booster autorisé à brûler des tokens
    address public boosterContract;
    
    // Événement émis lors du changement de l'adresse du contrat de booster
    event BoosterContractChanged(address indexed previousAddress, address indexed newAddress);
    
    /**
     * @dev Constructeur qui donne tous les tokens créés au créateur du contrat
     * @param initialSupply La quantité initiale de tokens à créer
     */
    constructor(uint256 initialSupply) ERC20("Epic Faction Community Token", "EFC") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        
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
     * @dev Permet au contrat de booster de brûler des tokens lors d'un achat
     * @param account L'adresse du compte dont les tokens seront brûlés
     * @param amount Le montant de tokens à brûler
     */
    function burnFromBooster(address account, uint256 amount) external {
        require(msg.sender == boosterContract, "EFCToken: caller is not the booster contract");
        _burn(account, amount);
    }
    
    /**
     * @dev Mint de nouveaux tokens (réservé à l'administrateur du contrat)
     * @param to L'adresse à laquelle les tokens seront envoyés
     * @param amount Le montant de tokens à créer
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}