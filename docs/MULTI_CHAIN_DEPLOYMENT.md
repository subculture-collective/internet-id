# Multi-Chain Deployment Guide

Internet-ID supports deployment across multiple EVM-compatible blockchain networks. This guide covers how to deploy, configure, and use the ContentRegistry contract on different chains.

## Supported Networks

### Production Networks (Mainnets)

| Network | Chain ID | Gas Token | Use Case | Cost |
|---------|----------|-----------|----------|------|
| Ethereum Mainnet | 1 | ETH | Maximum security | High |
| Polygon | 137 | MATIC | Low cost, high throughput | Low |
| Base | 8453 | ETH | Coinbase ecosystem, low cost | Low |
| Arbitrum One | 42161 | ETH | Low cost L2 | Low |
| Optimism | 10 | ETH | Low cost L2 | Low |

### Test Networks (Testnets)

| Network | Chain ID | Faucet | Explorer |
|---------|----------|--------|----------|
| Ethereum Sepolia | 11155111 | [Sepolia Faucet](https://sepoliafaucet.com/) | [Sepolia Etherscan](https://sepolia.etherscan.io) |
| Polygon Amoy | 80002 | [Amoy Faucet](https://faucet.polygon.technology/) | [Amoy PolygonScan](https://amoy.polygonscan.com) |
| Base Sepolia | 84532 | [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) | [Base Sepolia Scan](https://sepolia.basescan.org) |
| Arbitrum Sepolia | 421614 | [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia) | [Arbiscan Sepolia](https://sepolia.arbiscan.io) |
| Optimism Sepolia | 11155420 | [Optimism Faucet](https://app.optimism.io/faucet) | [Optimism Sepolia Scan](https://sepolia-optimism.etherscan.io) |

## Deployment Steps

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file (copy from `.env.example`):
   ```bash
   # Your deployer private key
   PRIVATE_KEY=your_private_key_here
   
   # Default RPC URL (used by scripts)
   RPC_URL=https://sepolia.base.org
   
   # Optional: Override RPC URLs for specific chains
   ETHEREUM_RPC_URL=https://your-eth-rpc.com
   POLYGON_RPC_URL=https://your-polygon-rpc.com
   BASE_RPC_URL=https://your-base-rpc.com
   ARBITRUM_RPC_URL=https://your-arbitrum-rpc.com
   OPTIMISM_RPC_URL=https://your-optimism-rpc.com
   ```

3. **Compile Contracts**
   ```bash
   npm run build
   ```

### Deploy to Testnet

Start with a testnet to ensure everything works correctly:

```bash
# Base Sepolia (recommended for testing)
npm run deploy:base-sepolia

# Or other testnets
npm run deploy:sepolia          # Ethereum Sepolia
npm run deploy:polygon-amoy     # Polygon Amoy
npm run deploy:arbitrum-sepolia # Arbitrum Sepolia
npm run deploy:optimism-sepolia # Optimism Sepolia
```

**Output:**
```
ContentRegistry deployed to: 0x1234567890123456789012345678901234567890
Saved address to: /path/to/deployed/baseSepolia.json
```

### Deploy to Mainnet

⚠️ **Warning**: Mainnet deployments cost real money. Ensure you have:
- Sufficient gas tokens (ETH, MATIC, etc.)
- Verified your deployment works on testnet
- Reviewed gas costs for your target chain

```bash
# Low-cost L2 options (recommended for most users)
npm run deploy:polygon    # Polygon mainnet (very low cost)
npm run deploy:base       # Base mainnet (low cost L2)
npm run deploy:arbitrum   # Arbitrum One (low cost L2)
npm run deploy:optimism   # Optimism mainnet (low cost L2)

# High-security option (expensive)
npm run deploy:ethereum   # Ethereum mainnet
```

### Deployment File Structure

After deployment, the contract address is saved in `deployed/<network>.json`:

```
deployed/
├── ethereum.json         # Ethereum Mainnet
├── sepolia.json         # Ethereum Sepolia
├── polygon.json         # Polygon
├── polygonAmoy.json     # Polygon Amoy
├── base.json            # Base
├── baseSepolia.json     # Base Sepolia
├── arbitrum.json        # Arbitrum One
├── arbitrumSepolia.json # Arbitrum Sepolia
├── optimism.json        # Optimism
└── optimismSepolia.json # Optimism Sepolia
```

Each file contains:
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

## Using Multi-Chain Deployments

### Registry Service

The registry service automatically resolves contract addresses based on chain ID:

```typescript
import { 
  resolveDefaultRegistry,
  getRegistryAddress,
  getAllRegistryAddresses,
  getProviderForChain
} from "./scripts/services/registry.service";

// Get registry for current network
const { registryAddress, chainId } = await resolveDefaultRegistry();

// Get registry for specific chain
const polygonAddress = await getRegistryAddress(137);

// Get all deployed registries
const allAddresses = await getAllRegistryAddresses();
// Returns: { 1: "0x...", 137: "0x...", 8453: "0x...", ... }

// Get provider for specific chain
const provider = getProviderForChain(137);
```

### Cross-Chain Verification

The API supports cross-chain platform binding resolution:

```bash
# Check all chains for a platform binding
curl "http://localhost:3001/api/resolve/cross-chain?platform=youtube&platformId=dQw4w9WgXcQ"
```

Response includes chain information:
```json
{
  "platform": "youtube",
  "platformId": "dQw4w9WgXcQ",
  "creator": "0x1234...",
  "contentHash": "0xabcd...",
  "manifestURI": "ipfs://...",
  "timestamp": 1234567890,
  "registryAddress": "0x5678...",
  "chainId": 137,
  "chainName": "Polygon"
}
```

### Web App Integration

The web app automatically supports all chains:

```typescript
import { getChainById, getExplorerTxUrl } from "../lib/chains";

// Get chain details
const chain = getChainById(137);
console.log(chain?.displayName); // "Polygon"

// Get explorer URLs
const txUrl = getExplorerTxUrl(137, "0x1234...");
// Returns: "https://polygonscan.com/tx/0x1234..."
```

## Best Practices

### Choosing a Chain

**For Development:**
- Start with **Base Sepolia** or **Polygon Amoy** (free testnet tokens)
- Test cross-chain features on multiple testnets

**For Production:**

- **Low Cost, High Volume**: Use **Polygon** or **Base**
  - Great for frequent verifications
  - Transactions cost pennies
  - Good user experience

- **L2 Ecosystems**: Use **Arbitrum** or **Optimism**
  - Lower costs than Ethereum mainnet
  - Strong ecosystem support
  - Good for DeFi integration

- **Maximum Security**: Use **Ethereum Mainnet**
  - Highest security and decentralization
  - Higher gas costs
  - Best for high-value content

### Multi-Chain Strategy

1. **Deploy to one chain initially** (e.g., Polygon for low cost)
2. **Test thoroughly** with real verifications
3. **Deploy to additional chains** as needed for:
   - Geographic distribution
   - Ecosystem alignment
   - Risk diversification

### Gas Optimization

- Deploy during low-traffic periods for lower gas costs
- Consider batching operations on higher-cost chains
- Use L2s (Base, Arbitrum, Optimism) for frequent operations
- Keep Polygon for highest-volume use cases

## Troubleshooting

### Deployment Fails

**Error: Insufficient funds**
```
Solution: Ensure wallet has gas tokens for the target chain
- Check balance at block explorer
- Use faucets for testnets
- Fund wallet for mainnet deployments
```

**Error: Network not configured**
```
Solution: Check hardhat.config.ts includes the network
- Verify chain is in SUPPORTED_CHAINS (config/chains.ts)
- Check RPC URL is accessible
- Consider using custom RPC via environment variable
```

### Resolution Issues

**Error: Registry address not configured**
```
Solution: Deploy contract to the target chain first
- Run appropriate deploy:* script
- Verify deployed/<network>.json exists
- Check file contains valid address
```

**Cross-chain resolution returns 404**
```
Solution: Platform binding doesn't exist on any chain
- Verify content was registered on-chain
- Check platform binding was created
- Ensure you're checking the right platform/platformId
```

## Advanced Configuration

### Custom RPC Providers

Override default RPC URLs via environment variables:

```bash
# Use Alchemy
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Use Infura
BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_KEY

# Use Ankr
ARBITRUM_RPC_URL=https://rpc.ankr.com/arbitrum
```

### Adding New Chains

To add support for a new EVM chain:

1. Add chain configuration to `config/chains.ts`:
   ```typescript
   mychain: {
     chainId: 99999, // Use the actual chain ID from chainlist.org
     name: "mychain",
     displayName: "My Chain",
     rpcUrl: "https://rpc.mychain.io",
     blockExplorer: "https://explorer.mychain.io",
     nativeCurrency: { name: "My Token", symbol: "MYT", decimals: 18 },
     testnet: false,
   }
   ```

2. Add network to `hardhat.config.ts`:
   ```typescript
   mychain: {
     url: SUPPORTED_CHAINS.mychain.rpcUrl,
     accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
     chainId: SUPPORTED_CHAINS.mychain.chainId,
   }
   ```

3. Add deployment script to `package.json`:
   ```json
   "deploy:mychain": "hardhat run --network mychain scripts/deploy.ts"
   ```

4. Add deployment file mapping in `scripts/services/registry.service.ts`:
   ```typescript
   99999: "mychain.json"
   ```

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/subculture-collective/internet-id/issues)
- Check existing [documentation](../README.md)
- Review [security policy](../SECURITY_POLICY.md)
