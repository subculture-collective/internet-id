# ContentRegistry Upgrade Guide

## Overview

The ContentRegistry contract has been refactored to use the **UUPS (Universal Upgradeable Proxy Standard)** pattern, enabling safe contract upgrades while preserving state and maintaining the same contract address.

## Table of Contents

1. [Architecture](#architecture)
2. [Upgrade Pattern: UUPS](#upgrade-pattern-uups)
3. [Governance and Security](#governance-and-security)
4. [Deployment Process](#deployment-process)
5. [Upgrade Process](#upgrade-process)
6. [Testing Upgrades](#testing-upgrades)
7. [Risks and Mitigation](#risks-and-mitigation)
8. [Emergency Procedures](#emergency-procedures)
9. [Upgrade Checklist](#upgrade-checklist)

## Architecture

### Components

1. **Proxy Contract**: ERC1967 UUPS Proxy
   - Holds all state (storage)
   - Delegates calls to implementation
   - Address never changes
   - Users interact with this address

2. **Implementation Contract**: ContentRegistryV1/V2
   - Contains business logic
   - No state storage (except in proxy context)
   - Can be upgraded
   - New implementation = new address

3. **Owner Account**: EOA or Multisig
   - Controls upgrade authorization
   - Only entity that can execute upgrades
   - Should use multisig or DAO for production

### Storage Layout

```solidity
// ContentRegistryV1 Storage Layout
struct Entry {
    address creator;      // Slot 0 (20 bytes)
    uint64 timestamp;     // Slot 0 (8 bytes) - packed with creator
    string manifestURI;   // Slot 1+
}

mapping(bytes32 => Entry) public entries;                    // Slot 0
mapping(bytes32 => bytes32) public platformToHash;          // Slot 1
mapping(bytes32 => bytes32[]) public hashToPlatformKeys;    // Slot 2
uint256[47] private __gap;                                   // Slot 3-49 (reserved)
```

**Critical**: The `__gap` reserves 47 storage slots for future variables. When adding new state variables in upgrades, reduce the gap accordingly.

## Upgrade Pattern: UUPS

### Why UUPS?

We chose UUPS over other patterns for these reasons:

1. **Gas Efficiency**: Cheaper for users (no delegatecall overhead in proxy)
2. **Simplicity**: Upgrade logic in implementation, not proxy
3. **Security**: Smaller, simpler proxy = less attack surface
4. **Recommended**: OpenZeppelin's recommendation for new projects

### UUPS vs. Alternatives

| Feature | UUPS | Transparent Proxy | Diamond |
|---------|------|-------------------|---------|
| Gas Cost (users) | Low | High | Medium |
| Complexity | Low | Medium | High |
| Upgrade Logic | Implementation | Proxy | Proxy |
| Multi-facet | No | No | Yes |
| Best For | Single contract | Legacy | Complex systems |

### How UUPS Works

```
User Call
    ↓
Proxy (delegatecall)
    ↓
Implementation (executes with proxy's storage)
    ↓
Result returned to user
```

## Governance and Security

### Access Control

- **Ownership**: Uses OpenZeppelin's `OwnableUpgradeable`
- **Upgrade Authorization**: Only owner can upgrade via `_authorizeUpgrade()`
- **Owner Transfer**: Supports ownership transfer for governance evolution

### Recommended Governance Models

#### Development/Staging
```
Single EOA → Fast iteration
```

#### Production (Recommended)
```
Gnosis Safe Multisig (3-of-5) → Distributed control
```

#### Long-term (Optional)
```
Governor DAO Contract → Community governance
  ↓
Timelock (48h delay) → Review period
  ↓
Upgrade Execution → On-chain transparency
```

### Security Features

1. **Initializer Protection**: Prevents re-initialization attacks
2. **Owner-Only Upgrades**: Only authorized account can upgrade
3. **Storage Gap**: Prevents storage collisions in upgrades
4. **Version Tracking**: Each implementation reports its version
5. **Event Emission**: `Upgraded` event logs all upgrades

## Deployment Process

### Prerequisites

```bash
# Install dependencies
npm install --legacy-peer-deps

# Compile contracts
npm run build

# Run tests
npm test
```

### Deploy to Network

1. **Configure Environment**

```bash
# .env file
PRIVATE_KEY=your_deployer_private_key
RPC_URL=https://your-rpc-endpoint
```

2. **Deploy Upgradeable Contract**

```bash
# Local testing
npx hardhat run scripts/deploy-upgradeable.ts --network localhost

# Testnet (e.g., Sepolia)
npx hardhat run scripts/deploy-upgradeable.ts --network sepolia

# Mainnet (production)
npx hardhat run scripts/deploy-upgradeable.ts --network ethereum
```

3. **Save Deployment Info**

The script automatically saves deployment information to:
```
deployed/{network}-upgradeable.json
```

Example content:
```json
{
  "proxy": "0x...",
  "implementation": "0x...",
  "owner": "0x...",
  "version": "1.0.0",
  "deployedAt": "2024-01-01T00:00:00.000Z",
  "network": "sepolia"
}
```

**CRITICAL**: Backup this file! You need the proxy address for all future upgrades.

## Upgrade Process

### Pre-Upgrade Checklist

- [ ] New implementation contract written and tested
- [ ] Storage layout verified (no collisions)
- [ ] Upgrade tests pass locally
- [ ] Simulation script executed successfully
- [ ] Code review completed
- [ ] Security audit completed (for major upgrades)
- [ ] Governance approval obtained
- [ ] Backup of current state taken
- [ ] Emergency rollback plan prepared

### Upgrade Execution

1. **Test in Local Environment**

```bash
# Run simulation script
npx hardhat run scripts/simulate-upgrade.ts

# Expected output: All checks pass ✓
```

2. **Deploy to Testnet First**

```bash
# Upgrade on testnet
npx hardhat run scripts/upgrade-to-v2.ts --network sepolia

# Verify functionality
# - Test all old functions work
# - Test new functions work
# - Verify state preserved
```

3. **Production Upgrade**

```bash
# Final verification
npm run build
npm test

# Execute upgrade (with multisig if production)
npx hardhat run scripts/upgrade-to-v2.ts --network ethereum
```

4. **Post-Upgrade Verification**

```bash
# Verify contract on block explorer
npx hardhat verify --network ethereum <implementation_address>

# Check version
# Call version() function on proxy
# Expected: "2.0.0"

# Smoke test critical functions
# - Register new content
# - Update manifest
# - Bind platform
# - Resolve platform
```

## Testing Upgrades

### Test Hierarchy

1. **Unit Tests** (`test/ContentRegistryUpgradeable.test.ts`)
   - Deployment and initialization
   - V1 functionality
   - Storage layout preservation
   - Function selector compatibility
   - V2 new features
   - Upgrade authorization

2. **Simulation Script** (`scripts/simulate-upgrade.ts`)
   - Full lifecycle test
   - State preservation validation
   - Authorization checks
   - User interaction scenarios

3. **Testnet Testing**
   - Real network conditions
   - Gas cost validation
   - Multi-user scenarios
   - Extended period observation

### Running Tests

```bash
# Unit tests
npm test -- test/ContentRegistryUpgradeable.test.ts

# Simulation
npx hardhat run scripts/simulate-upgrade.ts

# All tests
npm test
```

### Critical Test Cases

✅ **Storage Preservation**
```javascript
// Verify data survives upgrade
entry_before = proxy_v1.entries(hash)
upgrade_to_v2()
entry_after = proxy_v2.entries(hash)
assert(entry_before == entry_after)
```

✅ **Function Compatibility**
```javascript
// Verify old functions still work
upgrade_to_v2()
proxy_v2.register(new_hash, uri) // V1 function
assert(works)
```

✅ **Authorization**
```javascript
// Verify only owner can upgrade
upgrade_as_non_owner() // Should fail
upgrade_as_owner() // Should succeed
```

## Risks and Mitigation

### Risk Matrix

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Storage collision | Critical | Low | Storage gap, tests |
| Unauthorized upgrade | Critical | Low | Owner-only access |
| Function selector clash | High | Low | Comprehensive tests |
| Implementation bug | High | Medium | Audits, tests |
| Gas cost increase | Medium | Medium | Optimization, benchmarks |
| State loss | Critical | Very Low | Proxy pattern prevents this |

### Mitigation Strategies

1. **Storage Collisions**
   - Always use `__gap` in implementation contracts
   - Reduce gap when adding variables
   - Run OpenZeppelin upgrade validation
   - Document storage layout changes

2. **Unauthorized Upgrades**
   - Use multisig (3-of-5 or 5-of-9) for production
   - Implement timelock for review period
   - Monitor upgrade events
   - Require multiple signatures

3. **Implementation Bugs**
   - Extensive unit testing (>90% coverage)
   - Integration testing on testnet
   - Security audits for major upgrades
   - Bug bounty program
   - Gradual rollout strategy

4. **Function Selector Clashes**
   - Test all V1 functions after upgrade
   - Verify function signatures don't change
   - Use function selector analysis tools
   - Document all function changes

## Emergency Procedures

### Emergency Rollback

If a critical bug is discovered post-upgrade:

1. **Immediate Actions**
   ```bash
   # Pause contract (if pausable functionality added)
   # Transfer ownership to timelock if needed
   
   # Redeploy previous implementation
   # Execute upgrade back to previous version
   npx hardhat run scripts/rollback-upgrade.ts --network ethereum
   ```

2. **Communication**
   - Notify users immediately
   - Post on status page
   - Update documentation
   - Explain issue and resolution

3. **Root Cause Analysis**
   - Identify bug source
   - Document failure mode
   - Update test suite
   - Revise upgrade process

### Emergency Contact

```
Security Contact: security@subculture.io
Discord: [emergency-channel]
Twitter: @subculture_dev
```

## Upgrade Checklist

### Pre-Development

- [ ] Evaluate upgrade pattern (UUPS ✓)
- [ ] Design storage layout with `__gap`
- [ ] Define governance model
- [ ] Set up test infrastructure

### Development

- [ ] Write implementation contract
- [ ] Add storage gap (`__gap`)
- [ ] Implement `_authorizeUpgrade`
- [ ] Write comprehensive tests
- [ ] Update documentation

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests pass
- [ ] Gas benchmarks acceptable
- [ ] Simulation successful
- [ ] Security audit (if needed)
- [ ] Governance approval

### Deployment (Testnet)

- [ ] Deploy to testnet
- [ ] Verify contract
- [ ] Test all functions
- [ ] Monitor for 24-48 hours
- [ ] Get user feedback

### Deployment (Mainnet)

- [ ] Final review of checklist
- [ ] Backup current state
- [ ] Notify users of upgrade
- [ ] Execute upgrade
- [ ] Verify deployment
- [ ] Monitor closely
- [ ] Update documentation

### Post-Deployment

- [ ] Verify all functions work
- [ ] Monitor error logs
- [ ] Check gas costs
- [ ] Update block explorer
- [ ] Announce completion
- [ ] Post-mortem review

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | Initial | First upgradeable implementation |
| 2.0.0 | Example | Adds registration counter (demo) |

## Additional Resources

- [OpenZeppelin Upgrades Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Pattern Explanation](https://eips.ethereum.org/EIPS/eip-1822)
- [ERC-1967 Proxy Standard](https://eips.ethereum.org/EIPS/eip-1967)
- [Gnosis Safe Multisig](https://safe.global/)

## Support

For questions or issues related to upgrades:
- GitHub Issues: [repository-link]
- Discord: [discord-link]
- Email: security@subculture.io
