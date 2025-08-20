// Sources flattened with hardhat v2.22.19 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.2.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.2.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.2.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File contracts/Faucet.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;


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
    uint256 public tokenAmount = 10000 * 10**18; // 10000 777 with 18 decimals
    
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
