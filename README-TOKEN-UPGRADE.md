# Upgradeable Token Faucet

This faucet contract has been modified to support changing the token address after deployment, eliminating the need to redeploy when you want to switch to a different ERC20 token.

## Key Features

- **Token Address Upgradeable**: Change the token being dispensed without redeploying the contract
- **Owner-Only Control**: Only the contract owner can change the token address
- **Event Logging**: All token changes are logged with `TokenAddressChanged` events
- **Zero Address Protection**: Prevents setting the token to the zero address

## New Functions Added

### `setTokenAddress(address _tokenAddress)`
- **Purpose**: Change the token contract address
- **Access**: Owner only
- **Parameters**: `_tokenAddress` - The new ERC20 token contract address
- **Events**: Emits `TokenAddressChanged(oldToken, newToken)`

### `getTokenAddress()`
- **Purpose**: Get the current token contract address
- **Access**: Public view
- **Returns**: The address of the current token contract

## Deployment and Usage

### 1. Deploy the Upgradeable Faucet

```bash
# Deploy with a placeholder or initial token address
npx hardhat run scripts/deploy_upgradeable_faucet.js --network <your-network>
```

This will:
- Deploy the faucet with a placeholder token address
- Save the deployment addresses to `faucet-addresses.json`
- Display instructions for next steps

### 2. Change Token Address

```bash
# Change to your actual token address
npx hardhat run scripts/change_token.js --network <your-network> <new-token-address>
```

Example:
```bash
npx hardhat run scripts/change_token.js --network localhost 0x1234567890123456789012345678901234567890
```

This will:
- Connect to your deployed faucet
- Change the token address to the new one
- Verify the change was successful
- Update the saved addresses file

### 3. Fund the Faucet

After changing to your desired token:

```bash
# Fund with ETH (can be done via the contract or by sending ETH directly)
# Fund with tokens (requires approval first)
```

## Workflow Example

1. **Initial Deployment**: Deploy faucet with placeholder token
2. **Token Development**: Work on your ERC20 token, fix bugs, redeploy as needed
3. **Token Ready**: Once your token is finalized, change the faucet's token address
4. **Fund & Launch**: Fund the faucet and start dispensing your final token

## Benefits

- **No Redeployment**: Keep the same faucet address even when switching tokens
- **Continuous Testing**: Test with different tokens during development
- **Cost Effective**: Save gas costs from redeploying the faucet
- **User Experience**: Users can bookmark the same faucet URL
- **Flexibility**: Switch between different versions of your token easily

## Security Considerations

- Only the contract owner can change the token address
- The zero address is blocked to prevent accidents
- All changes are logged in events for transparency
- Existing token balances in the faucet remain (you may want to withdraw them first)

## Migration Steps

If you have an existing faucet and want to upgrade:

1. Deploy the new upgradeable faucet contract
2. Transfer any remaining ETH from the old faucet
3. Withdraw any remaining tokens from the old faucet
4. Set the correct token address in the new faucet
5. Fund the new faucet with ETH and tokens
6. Update your frontend to use the new faucet address

## Frontend Integration

The frontend can now call `getTokenAddress()` to dynamically display which token is currently being dispensed, making it more user-friendly when you switch tokens.
