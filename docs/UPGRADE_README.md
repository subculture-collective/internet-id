# Upgradeable ContentRegistry Implementation

## Quick Start

### Installation

```bash
npm install --legacy-peer-deps
```

### Build

```bash
npm run build
```

### Test

```bash
# Run all upgradeable contract tests
npm test -- test/ContentRegistryUpgradeable.test.ts

# Run upgrade simulation
npm run upgrade:simulate
```

## Architecture

The ContentRegistry has been refactored to support upgrades using the **UUPS (Universal Upgradeable Proxy Standard)** pattern:

```
┌─────────────────┐
│  Users/Clients  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Proxy Contract │  ← Fixed address, holds all state
│  (ERC1967)      │
└────────┬────────┘
         │ delegatecall
         v
┌─────────────────┐
│ Implementation  │  ← Can be upgraded
│ (ContentRegistry)│
└─────────────────┘
```

## Files

### Contracts

| File | Purpose |
|------|---------|
| `contracts/ContentRegistry.sol` | Original non-upgradeable contract |
| `contracts/ContentRegistryV1.sol` | Upgradeable V1 implementation |
| `contracts/ContentRegistryV2.sol` | Example V2 (demonstrates upgrade) |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/deploy-upgradeable.ts` | Deploy upgradeable proxy and implementation |
| `scripts/upgrade-to-v2.ts` | Upgrade from V1 to V2 |
| `scripts/simulate-upgrade.ts` | Test upgrade process locally |

### Tests

| File | Coverage |
|------|----------|
| `test/ContentRegistry.ts` | Original contract tests |
| `test/ContentRegistryUpgradeable.test.ts` | Upgradeable pattern tests |

### Documentation

| File | Content |
|------|---------|
| `docs/UPGRADE_GUIDE.md` | Complete upgrade guide |
| `docs/UPGRADE_GOVERNANCE.md` | Governance procedures |
| `docs/UPGRADE_README.md` | This file |

## Deployment

### Deploy Upgradeable Contract

```bash
# Local network
npm run deploy:upgradeable:local

# Sepolia testnet
npm run deploy:upgradeable:sepolia

# Base Sepolia testnet
npm run deploy:upgradeable:base-sepolia

# Ethereum mainnet
npm run deploy:upgradeable:ethereum
```

**Important**: Save the proxy address from the deployment output. You'll need it for all future upgrades.

### Deployment Output

```
Deploying upgradeable ContentRegistry with account: 0x...
ContentRegistryV1 Proxy deployed to: 0x...
ContentRegistryV1 Implementation deployed to: 0x...
Owner: 0x...
Contract version: 1.0.0
```

The deployment information is saved to `deployed/{network}-upgradeable.json`.

## Upgrading

### Simulate Upgrade First

Always test the upgrade process locally before executing on a live network:

```bash
npm run upgrade:simulate
```

Expected output:
```
=== Upgrade Simulation ===
✓ Proxy deployed
✓ Content registered in V1
✓ Upgraded to V2
✓ All state preserved
✓ V1 functions still work
✓ V2 new features work
✓ Upgrade authorization works
✓ Upgrade simulation successful!
```

### Execute Upgrade

```bash
# Local network
npm run upgrade:local

# Sepolia testnet
npm run upgrade:sepolia

# Base Sepolia testnet
npm run upgrade:base-sepolia

# Ethereum mainnet (requires multisig in production)
npm run upgrade:ethereum
```

### Verify Upgrade

After upgrading:

1. Check the version:
   ```solidity
   proxy.version() // Should return "2.0.0"
   ```

2. Test core functions:
   ```solidity
   // Test V1 functions still work
   proxy.register(hash, uri)
   proxy.updateManifest(hash, newUri)
   
   // Test new V2 features
   proxy.registerV2(hash, uri)
   proxy.getTotalRegistrations()
   ```

3. Verify state preservation:
   ```solidity
   // Check existing entries
   entry = proxy.entries(existingHash)
   // Should match pre-upgrade state
   ```

## Key Features

### ✅ Storage Preservation

All data is preserved during upgrades:
- Content entries (creator, timestamp, manifestURI)
- Platform bindings
- Owner information
- All mappings and arrays

### ✅ Access Control

Only the contract owner can upgrade:
```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{
    // Only owner can call this
}
```

### ✅ Version Tracking

Each implementation reports its version:
```solidity
function version() public pure returns (string memory) {
    return "1.0.0"; // or "2.0.0"
}
```

### ✅ Storage Gap

Reserves space for future variables:
```solidity
uint256[47] private __gap;
```

When adding new variables in upgrades, reduce the gap size accordingly.

## Testing

### Unit Tests

```bash
# Run all upgradeable tests
npm test -- test/ContentRegistryUpgradeable.test.ts
```

Test coverage:
- ✅ Deployment and initialization
- ✅ V1 functionality (register, update, revoke, bind)
- ✅ Storage layout preservation
- ✅ Function selector compatibility
- ✅ V2 new features
- ✅ Upgrade authorization
- ✅ Proxy address preservation
- ✅ Owner preservation

### Simulation

```bash
npm run upgrade:simulate
```

Tests full upgrade lifecycle:
1. Deploy V1
2. Register content
3. Upgrade to V2
4. Verify state preserved
5. Test V1 functions still work
6. Test new V2 features
7. Verify authorization

## Security Considerations

### ⚠️ Owner Key Security

The owner account controls upgrades. For production:

1. **Use a Multisig**: Gnosis Safe with 3-of-5 or 5-of-9 signers
2. **Hardware Wallets**: All signers use hardware wallets
3. **Geographic Distribution**: Signers in different locations
4. **Key Backup**: Secure backup procedures

### ⚠️ Storage Layout

When creating new versions:

1. **Never reorder variables**: Add new variables at the end
2. **Reduce storage gap**: For each new variable, reduce `__gap` by 1
3. **Test thoroughly**: Run storage layout tests
4. **Document changes**: Update documentation

### ⚠️ Testing Before Production

1. ✅ Run all unit tests
2. ✅ Run simulation script
3. ✅ Deploy to testnet
4. ✅ Test on testnet for 7+ days
5. ✅ Get security audit (for major changes)
6. ✅ Only then deploy to mainnet

## Common Operations

### Check Current Version

```bash
# Using Hardhat console
npx hardhat console --network <network>
> const proxy = await ethers.getContractAt("ContentRegistryV1", "PROXY_ADDRESS")
> await proxy.version()
```

### Check Owner

```bash
> await proxy.owner()
```

### Transfer Ownership

```bash
> await proxy.transferOwnership("NEW_OWNER_ADDRESS")
```

For production, transfer ownership to a multisig:
```bash
> await proxy.transferOwnership("GNOSIS_SAFE_ADDRESS")
```

### Get Implementation Address

```bash
> const implAddress = await upgrades.erc1967.getImplementationAddress("PROXY_ADDRESS")
```

## Troubleshooting

### Error: "OwnableUnauthorizedAccount"

**Cause**: Trying to upgrade from an account that doesn't own the proxy.

**Solution**: 
- Check current owner: `await proxy.owner()`
- Use the owner account for upgrades
- Or transfer ownership first

### Error: "Storage layout is incompatible"

**Cause**: New implementation has incompatible storage layout.

**Solution**:
- Don't reorder existing variables
- Only add new variables at the end
- Reduce storage gap appropriately
- Run validation: `npx hardhat validate`

### Error: "Already initialized"

**Cause**: Trying to call `initialize()` again.

**Solution**:
- `initialize()` can only be called once
- This is expected and prevents re-initialization attacks
- Don't try to re-initialize after upgrades

## Best Practices

### ✅ DO

- Test extensively before mainnet deployment
- Use multisig for production ownership
- Document all changes
- Run simulation script before every upgrade
- Deploy to testnet first
- Monitor post-upgrade
- Keep storage gap for future upgrades
- Version your implementations

### ❌ DON'T

- Reorder existing storage variables
- Upgrade without testing
- Use single EOA owner in production
- Skip security audits for major changes
- Deploy directly to mainnet
- Remove the storage gap
- Change function signatures in upgrades

## Resources

### Documentation

- [Upgrade Guide](./UPGRADE_GUIDE.md) - Complete upgrade procedures
- [Governance](./UPGRADE_GOVERNANCE.md) - Governance procedures
- [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/)

### Tools

- [Hardhat Upgrades Plugin](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades)
- [Gnosis Safe](https://safe.global/)
- [OpenZeppelin Defender](https://defender.openzeppelin.com/)

### Support

- GitHub Issues: Report bugs or ask questions
- Discord: Real-time support
- Email: security@subculture.io

## Example Workflow

### Initial Deployment

```bash
# 1. Build and test
npm run build
npm test

# 2. Deploy to testnet
npm run deploy:upgradeable:sepolia

# 3. Save proxy address from output
# PROXY_ADDRESS=0x...

# 4. Test functionality
# Register content, bind platforms, etc.

# 5. Monitor for stability
# Wait 7+ days

# 6. Deploy to mainnet (with multisig)
npm run deploy:upgradeable:ethereum
```

### Upgrading

```bash
# 1. Develop new version (V2)
# - Edit contracts/ContentRegistryV2.sol
# - Add new features
# - Adjust storage gap

# 2. Test locally
npm run build
npm test -- test/ContentRegistryUpgradeable.test.ts
npm run upgrade:simulate

# 3. Deploy to testnet
npm run upgrade:sepolia

# 4. Test on testnet
# Verify all functions work
# Check state preservation

# 5. Get approval (governance/multisig)
# Review code
# Security audit if needed

# 6. Upgrade mainnet
npm run upgrade:ethereum

# 7. Verify
# Check version: proxy.version() → "2.0.0"
# Test functions
# Monitor closely
```

## FAQ

**Q: Will upgrading change the contract address?**
A: No. The proxy address remains constant. Only the implementation changes.

**Q: Will existing data be lost?**
A: No. All data is stored in the proxy and is preserved during upgrades.

**Q: Can I upgrade back to a previous version?**
A: Yes, you can "upgrade" to any implementation, including older versions.

**Q: Who can upgrade the contract?**
A: Only the owner. For production, this should be a multisig or DAO.

**Q: How often can I upgrade?**
A: Technically unlimited, but recommend max once per 30 days for stability.

**Q: Do I need to upgrade?**
A: No. Upgrades are optional. V1 can run indefinitely if stable.

**Q: What if an upgrade goes wrong?**
A: You can upgrade back to the previous implementation. Always test first!

**Q: Can I add new functions in upgrades?**
A: Yes. New functions are safe to add.

**Q: Can I modify existing functions?**
A: Yes, but test thoroughly. Ensure backward compatibility.

**Q: What about gas costs?**
A: UUPS adds minimal overhead (~2000 gas per transaction). Much cheaper than redeploying.

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-01 | Initial upgradeable implementation |
| 2.0.0 | Example | Adds registration counter (demo only) |

---

**Need Help?** Check the [Upgrade Guide](./UPGRADE_GUIDE.md) or reach out to the team.
