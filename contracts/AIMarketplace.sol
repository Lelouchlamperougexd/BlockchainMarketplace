// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIMarketplace is ReentrancyGuard, Ownable {
    IERC20 public aiToken;
    
    struct Model {
        uint256 id;
        string name;
        string description;
        string accessLink;
        uint256 price;
        address seller;
        bool isActive;
    }

    mapping(uint256 => Model) public models;
    uint256 public modelCount;

    event ModelListed(uint256 indexed id, string name, uint256 price, address seller);
    event ModelPurchased(uint256 indexed id, address buyer, address seller, uint256 price);
    event ModelDelisted(uint256 indexed id);

    constructor(address _aiToken, address initialOwner) Ownable(initialOwner) {
        aiToken = IERC20(_aiToken);
    }

    function listModel(
        string memory _name,
        string memory _description,
        string memory _accessLink,
        uint256 _price
    ) external {
        require(_price > 0, "Price must be greater than 0");
        
        modelCount++;
        models[modelCount] = Model(
            modelCount,
            _name,
            _description,
            _accessLink,
            _price,
            msg.sender,
            true
        );

        emit ModelListed(modelCount, _name, _price, msg.sender);
    }

    function purchaseModel(uint256 _modelId) external nonReentrant {
        Model storage model = models[_modelId];
        require(model.isActive, "Model is not active");
        require(model.seller != msg.sender, "Cannot buy your own model");
        require(aiToken.balanceOf(msg.sender) >= model.price, "Insufficient token balance");

        model.isActive = false;
        
        require(aiToken.transferFrom(msg.sender, model.seller, model.price), "Token transfer failed");
        
        emit ModelPurchased(_modelId, msg.sender, model.seller, model.price);
    }

    function delistModel(uint256 _modelId) external {
        Model storage model = models[_modelId];
        require(model.seller == msg.sender || owner() == msg.sender, "Not authorized");
        require(model.isActive, "Model is not active");
        
        model.isActive = false;
        emit ModelDelisted(_modelId);
    }

    function getModel(uint256 _modelId) external view returns (Model memory) {
        return models[_modelId];
    }
}