// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Faucet
 * @dev A faucet contract that dispenses ETH and 777 tokens
 */
contract Faucet is Ownable {
    // The token being dispensed (777)
    IERC20 public token;
    
    // Amount of ETH to dispense (in wei)
    uint256 public ethAmount = 0.1 ether;
    
    // Amount of tokens to dispense
    uint256 public tokenAmount = 100 * 10**18; // 100 777 with 18 decimals
    
    // Cooldown period in seconds
    uint256 public cooldownPeriod = 24 hours;
    
    // Mapping to track when an address last requested funds
    mapping(address => uint256) public lastRequestTime;
    
    // Event emitted when funds are dispensed
    event FundsDispensed(address indexed recipient, uint256 ethAmount, uint256 tokenAmount);
    
    /**
     * @dev Constructor sets the token address and owner
     * @param _tokenAddress The address of the 777 token contract
     */
    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }
    
/**
 * @dev Request ETH and tokens from the faucet
 */
function requestFunds() external {
    _requestFunds(msg.sender);
}

/**
 * @dev Request funds for a specific address (can only be called by authorized relayers)
 * @param recipient The address to receive the funds
 */
function requestFundsFor(address recipient) external {
    // Only authorized relayers can call this function
    require(authorizedRelayers[msg.sender], "Not an authorized relayer");
    _requestFunds(recipient);
}

/**
 * @dev Internal function to handle fund requests
 * @param recipient The address to receive the funds
 */
function _requestFunds(address recipient) internal {
    // Check if the cooldown period has passed
    require(
        block.timestamp >= lastRequestTime[recipient] + cooldownPeriod || lastRequestTime[recipient] == 0,
        "Cooldown period not over"
    );
    
    // Check if the contract has enough ETH
    require(address(this).balance >= ethAmount, "Insufficient ETH in faucet");
    
    // Check if the contract has enough tokens
    require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient tokens in faucet");
    
    // Update the last request time
    lastRequestTime[recipient] = block.timestamp;
    
    // Transfer ETH to the recipient
    (bool sent, ) = recipient.call{value: ethAmount}("");
    require(sent, "Failed to send ETH");
    
    // Transfer tokens to the recipient
    require(token.transfer(recipient, tokenAmount), "Failed to transfer tokens");
    
    // Emit event
    emit FundsDispensed(recipient, ethAmount, tokenAmount);
}
    
    /**
     * @dev Allow the owner to fund the contract with ETH
     */
    function fundWithEth() external payable {
        // No additional logic needed, just accept the ETH
    }
    
    /**
     * @dev Allow the owner to withdraw ETH in case of emergency
     * @param amount The amount of ETH to withdraw
     */
    function withdrawEth(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH in contract");
        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Failed to send ETH");
    }
    
// Mapping of authorized relayers
mapping(address => bool) public authorizedRelayers;

// Event emitted when a relayer is added or removed
event RelayerStatusChanged(address indexed relayer, bool isAuthorized);

/**
 * @dev Add or remove an authorized relayer
 * @param relayer The address of the relayer
 * @param isAuthorized Whether the relayer is authorized
 */
function setRelayerStatus(address relayer, bool isAuthorized) external onlyOwner {
    authorizedRelayers[relayer] = isAuthorized;
    emit RelayerStatusChanged(relayer, isAuthorized);
}
    
    /**
     * @dev Update the token amount to be dispensed
     * @param _tokenAmount The new token amount
     */
    function setTokenAmount(uint256 _tokenAmount) external onlyOwner {
        tokenAmount = _tokenAmount;
    }
    
    /**
     * @dev Allow the owner to deposit tokens to the faucet
     * @param amount The amount of tokens to deposit
     */
    function depositTokens(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
    }
    
    /**
     * @dev Update the cooldown period
     * @param _cooldownPeriod The new cooldown period in seconds
     */
    function setCooldownPeriod(uint256 _cooldownPeriod) external onlyOwner {
        cooldownPeriod = _cooldownPeriod;
    }
    
    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {}
}
