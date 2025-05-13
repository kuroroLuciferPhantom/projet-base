/**
 * Service d'intégration avec la blockchain pour les boosters et NFTs
 * Gère les interactions avec les smart contracts pour l'achat de boosters et le minting de cartes
 */
const blockchainService = {
    // Vérifier si Web3 est disponible
    isWeb3Available() {
        return typeof window.ethereum !== 'undefined';
    },
    
    // Obtenir l'adresse du wallet connecté
    async getConnectedWallet() {
        if (!this.isWeb3Available()) {
            throw new Error('Web3 n\'est pas disponible. Veuillez installer MetaMask.');
        }
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            return accounts[0];
        } catch (error) {
            console.error('Erreur de connexion au wallet:', error);
            throw error;
        }
    },
    
    // Acheter un booster et minter les cartes obtenues en NFT
    async purchaseBoosterAndMintNFTs(boosterType) {
        if (!this.isWeb3Available()) {
            throw new Error('Web3 n\'est pas disponible. Veuillez installer MetaMask.');
        }
        
        const walletAddress = await this.getConnectedWallet();
        if (!walletAddress) {
            throw new Error('Wallet non connecté.');
        }
        
        try {
            // Initialiser la bibliothèque ethers.js
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Adresses des smart contracts (à remplacer par les vraies adresses)
            const tokenContractAddress = '0x123456789abcdef123456789abcdef123456789';
            const boosterContractAddress = '0xabcdef123456789abcdef123456789abcdef1234';
            const nftContractAddress = '0x987654321abcdef123456789abcdef123456789a';
            
            // ABIs des smart contracts (versions simplifiées)
            const tokenABI = [
                "function allowance(address owner, address spender) external view returns (uint256)",
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            
            const boosterABI = [
                "function getBoosterPrice(string boosterType) external view returns (uint256)",
                "function purchaseBooster(string boosterType) external returns (uint256)",
                "function getLastPurchasedCards() external view returns (uint256[])"
            ];
            
            const nftABI = [
                "function mintBatch(address to, uint256[] ids, string[] uris) external"
            ];
            
            // Instances des smart contracts
            const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, signer);
            const boosterContract = new ethers.Contract(boosterContractAddress, boosterABI, signer);
            const nftContract = new ethers.Contract(nftContractAddress, nftABI, signer);
            
            // 1. Vérifier le prix du booster
            const boosterPrice = await boosterContract.getBoosterPrice(boosterType);
            console.log(`Prix du booster ${boosterType}: ${boosterPrice} tokens`);
            
            // 2. Vérifier et approuver l'allowance de tokens si nécessaire
            const currentAllowance = await tokenContract.allowance(walletAddress, boosterContractAddress);
            if (currentAllowance.lt(boosterPrice)) {
                console.log("Approbation des tokens nécessaire...");
                const approveTx = await tokenContract.approve(boosterContractAddress, ethers.constants.MaxUint256);
                await approveTx.wait();
                console.log("Tokens approuvés avec succès");
            }
            
            // 3. Acheter le booster
            console.log(`Achat du booster ${boosterType} en cours...`);
            const purchaseTx = await boosterContract.purchaseBooster(boosterType);
            await purchaseTx.wait();
            console.log("Booster acheté avec succès!");
            
            // 4. Récupérer les cartes générées par le smart contract
            const cardIds = await boosterContract.getLastPurchasedCards();
            console.log(`${cardIds.length} cartes générées:`, cardIds);
            
            // 5. Préparer les métadonnées pour les NFTs
            // Dans une implémentation réelle, ces métadonnées seraient générées côté serveur
            // et stockées sur IPFS ou un autre système de stockage décentralisé
            const cardURIs = cardIds.map(id => `https://api.epicfactioncommunity.com/metadata/${id}`);
            
            // 6. Minter les cartes comme NFTs
            console.log("Création des NFTs...");
            const mintTx = await nftContract.mintBatch(walletAddress, cardIds, cardURIs);
            await mintTx.wait();
            console.log("NFTs créés avec succès!");
            
            // 7. Synchronisation avec le backend
            try {
                const syncResponse = await apiService.syncNFTsWithBackend(
                    walletAddress,
                    cardIds.map(id => id.toString()),
                    mintTx.hash
                );
                
                if (!syncResponse.success) {
                    console.warn("Synchronisation partielle avec le backend:", syncResponse.message);
                }
            } catch (syncError) {
                console.error("Erreur lors de la synchronisation avec le backend:", syncError);
                // Ne pas échouer complètement si la synchronisation échoue
                // Les cartes ont été créées sur la blockchain
            }
            
            // 8. Retourner les données des cartes pour l'UI
            return {
                success: true,
                boosterType,
                cardIds: cardIds.map(id => id.toString()),
                transactionHash: mintTx.hash
            };
            
        } catch (error) {
            console.error('Erreur lors de l\'achat du booster ou de la création des NFTs:', error);
            throw error;
        }
    },
    
    // Vérifier si l'utilisateur a assez de tokens
    async hasEnoughTokens(boosterType) {
        if (!this.isWeb3Available()) {
            throw new Error('Web3 n\'est pas disponible. Veuillez installer MetaMask.');
        }
        
        const walletAddress = await this.getConnectedWallet();
        if (!walletAddress) {
            throw new Error('Wallet non connecté.');
        }
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Adresses des smart contracts (à remplacer par les vraies adresses)
            const tokenContractAddress = '0x123456789abcdef123456789abcdef123456789';
            const boosterContractAddress = '0xabcdef123456789abcdef123456789abcdef1234';
            
            // ABIs des smart contracts (versions simplifiées)
            const tokenABI = [
                "function balanceOf(address account) external view returns (uint256)"
            ];
            
            const boosterABI = [
                "function getBoosterPrice(string boosterType) external view returns (uint256)"
            ];
            
            // Instances des smart contracts
            const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, signer);
            const boosterContract = new ethers.Contract(boosterContractAddress, boosterABI, signer);
            
            // Récupérer le prix du booster et le solde de l'utilisateur
            const boosterPrice = await boosterContract.getBoosterPrice(boosterType);
            const userBalance = await tokenContract.balanceOf(walletAddress);
            
            return {
                hasEnough: userBalance.gte(boosterPrice),
                balance: userBalance.toString(),
                price: boosterPrice.toString()
            };
        } catch (error) {
            console.error('Erreur lors de la vérification du solde:', error);
            throw error;
        }
    }
};

// Exposer le service pour qu'il soit accessible par d'autres modules
window.blockchainService = blockchainService;