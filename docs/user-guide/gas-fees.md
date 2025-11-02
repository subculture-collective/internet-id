# Gas Fees and Optimization

Learn how gas fees work and how to minimize costs when using Internet ID.

## 💡 What are Gas Fees?

Gas fees are small payments you make to blockchain validators who process your transactions. Think of them like postage stamps—you pay a small fee to have your transaction "delivered" and recorded on the blockchain.

### Why Do Gas Fees Exist?

1. **Compensate Validators**: They run computers that secure the network
2. **Prevent Spam**: Small fee prevents people from flooding the network with transactions
3. **Prioritize Transactions**: Higher fees = faster processing during congestion

### What Do You Pay For?

With Internet ID, you pay gas fees for:
- ✅ Registering content on-chain
- ✅ Binding platform links
- ✅ Updating content metadata (if stored on-chain)

You DON'T pay gas fees for:
- ❌ Connecting your wallet (free!)
- ❌ Signing manifests (free!)
- ❌ Uploading to IPFS (separate service, no gas)
- ❌ Viewing or verifying content (free!)

## 💰 How Much Do Gas Fees Cost?

Costs vary dramatically by network:

### Network Comparison

| Network | Average Fee | Speed | Recommended For |
|---------|------------|-------|-----------------|
| **Base** | ~$0.01 | 2-5 sec | ⭐ Most users (best value) |
| **Polygon** | ~$0.01 | 2-5 sec | ⭐ Cost-conscious users |
| **Arbitrum** | ~$0.05 | 1-3 sec | Balanced choice |
| **Optimism** | ~$0.05 | 1-3 sec | Balanced choice |
| **Ethereum** | $0.50-$5.00 | 12-15 sec | Critical content only |

### What $5 Gets You

| Network | Registrations | Bindings | Total Operations |
|---------|--------------|----------|------------------|
| Base | ~500 | ~500 | ~1000 |
| Polygon | ~500 | ~500 | ~1000 |
| Arbitrum | ~100 | ~100 | ~200 |
| Ethereum | ~10 | ~10 | ~20 |

**Recommendation**: Start with **Base** or **Polygon** for maximum value!

## 📊 Understanding Gas Components

Gas fees have two parts:

### 1. Gas Limit
**What it is**: Maximum computation allowed for your transaction

**Typical limits:**
- Register content: ~50,000 gas
- Bind platform: ~40,000 gas
- Simple transfer: ~21,000 gas

**You usually don't need to adjust this.** Internet ID sets appropriate limits automatically.

### 2. Gas Price
**What it is**: How much you pay per unit of gas

**Measured in**: gwei (1 gwei = 0.000000001 ETH)

**Example Calculation**:
```
Gas Limit: 50,000
Gas Price: 20 gwei
Total Cost: 50,000 × 20 = 1,000,000 gwei = 0.001 ETH ≈ $0.01
```

**Network determines gas price**, based on:
- Current demand (congestion)
- Block space available
- Time of day

## ⚡ Minimizing Gas Costs

### Strategy 1: Choose the Right Network

**Cheapest**: Base or Polygon (~$0.01)
- Perfect for most content
- Fast and reliable
- Minimal cost difference from Ethereum security

**When to use Ethereum** ($0.50-$5.00):
- Critical evidence (legal cases)
- High-value content (major releases)
- When maximum security matters
- Institutional requirements

**Cost Savings**: 50-500x cheaper on Base/Polygon vs Ethereum!

### Strategy 2: Time Your Transactions

Gas prices fluctuate based on network activity:

**Cheapest Times** (Base/Polygon):
- Prices are stable and low 24/7
- No need to optimize timing

**Cheapest Times** (Ethereum):
- Late night/early morning (2-8 AM EST)
- Weekends
- Outside of major events/NFT drops

**Most Expensive Times** (Ethereum):
- Business hours (9 AM - 5 PM EST)
- When major NFT/token launches happen
- During market volatility

**Check Current Gas Prices**:
- [Etherscan Gas Tracker](https://etherscan.io/gastracker)
- [ETH Gas Station](https://ethgasstation.info/)
- MetaMask shows estimated cost

### Strategy 3: Batch Operations

Register multiple pieces of content at once:

**Individual Registration**:
```
Register file 1: $0.01
Register file 2: $0.01
Register file 3: $0.01
Total: $0.03 + 3 transactions
```

**Batch Registration** (Coming Soon):
```
Register files 1, 2, 3: $0.02
Total: $0.02 + 1 transaction
```

**Savings**: ~33% cost reduction + fewer transactions

**How to Batch**:
- Use CLI tool for batch uploads
- Or wait for web UI batch feature
- See [CLI Batch Guide](./cli-usage.md#batch-operations)

### Strategy 4: Use Privacy Mode

When you don't need to upload the original file:

**Public Mode**:
```
Upload file to IPFS: Free
Upload manifest to IPFS: Free
Register on-chain: $0.01
Total: $0.01 + IPFS upload time
```

**Privacy Mode**:
```
Upload manifest to IPFS: Free
Register on-chain: $0.01
Total: $0.01 (faster!)
```

**Benefits**:
- Same proof of ownership
- Faster (no large file upload)
- More private
- Same gas cost

### Strategy 5: Optimize Gas Settings

MetaMask gives you three speed options:

#### Low (Slow)
- **Speed**: May take 1-2 minutes
- **Cost**: Cheapest
- **When to use**: Not in a hurry

#### Medium (Recommended)
- **Speed**: 15-30 seconds
- **Cost**: Standard
- **When to use**: Most transactions

#### High (Fast)
- **Speed**: < 15 seconds
- **Cost**: 10-20% more expensive
- **When to use**: Urgent, or network congestion

**Custom Gas Settings**:
1. Click "Edit" in MetaMask transaction popup
2. Choose "Advanced"
3. Manually set max fee and priority fee
4. See [Advanced Gas Guide](#advanced-gas-settings) below

### Strategy 6: Use Test Networks First

Practice on testnets with free tokens:

**Process**:
1. Switch to Base Sepolia testnet
2. Get free tokens from [faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
3. Practice registrations (free!)
4. Learn the process without spending money
5. Switch to mainnet when comfortable

**Benefits**:
- Learn without financial risk
- Test features and workflows
- Verify everything works
- Then do it for real with confidence

## 📈 Advanced Gas Settings

For power users who want fine control:

### EIP-1559 Gas Model

Modern Ethereum networks (including Base, Polygon) use EIP-1559:

**Components**:
1. **Base Fee**: Automatically adjusted by network (you can't change)
2. **Priority Fee (Tip)**: Extra tip to validators (you control)
3. **Max Fee**: Maximum you're willing to pay (you control)

**Formula**:
```
Total Fee = (Base Fee + Priority Fee) × Gas Limit
But capped at: Max Fee × Gas Limit
```

**Example**:
```
Base Fee: 0.01 gwei (network sets this)
Priority Fee: 1 gwei (your tip)
Max Fee: 2 gwei (your maximum)
Gas Limit: 50,000

If Base Fee stays at 0.01 gwei:
Actual Cost = (0.01 + 1) × 50,000 = 50,500 gwei ≈ $0.00005

If Base Fee spikes to 5 gwei:
Actual Cost capped at: 2 × 50,000 = 100,000 gwei ≈ $0.0001
```

### When to Adjust Settings

**Increase Priority Fee If**:
- Transaction stuck pending
- Network congestion
- Need faster confirmation

**Increase Max Fee If**:
- Transaction failing with "max fee too low"
- Extreme network congestion
- Critical urgency

**How to Adjust in MetaMask**:
1. Click "Edit" on transaction popup
2. Select "Advanced"
3. Set "Max base fee" (max fee)
4. Set "Priority fee" (tip)
5. Click "Save"

**Safe Defaults**:
- Max Fee: 2-3x current base fee
- Priority Fee: 1-2 gwei (Base/Polygon), 2-5 gwei (Ethereum)

## 🔍 Monitoring Gas Prices

### Real-Time Gas Trackers

**Ethereum**:
- [Etherscan Gas Tracker](https://etherscan.io/gastracker)
- [ETH Gas Station](https://ethgasstation.info/)
- [Blocknative Gas Estimator](https://www.blocknative.com/gas-estimator)

**Base**:
- [BaseScan](https://basescan.org/)
- Usually stable and low

**Polygon**:
- [PolygonScan Gas Tracker](https://polygonscan.com/gastracker)
- Usually stable and low

### In MetaMask

When you initiate a transaction:
1. MetaMask shows estimated gas fee
2. Shows in both native token (ETH/MATIC) and USD
3. Gives three speed options
4. Shows time estimates

**Review before confirming!**

## 💡 Gas Optimization Tips Summary

### Quick Wins
1. ✅ Use Base or Polygon (not Ethereum) → **50x savings**
2. ✅ Use Privacy Mode when possible → **faster, same cost**
3. ✅ Batch operations when available → **~33% savings**
4. ✅ Practice on testnet first → **free learning**

### Advanced Optimizations
5. ✅ Time transactions for low congestion (Ethereum only)
6. ✅ Use "Low" speed when not urgent → **slight savings**
7. ✅ Set custom gas settings → **optimize for your needs**
8. ✅ Monitor gas prices → **wait for lower fees**

### What NOT To Do
- ❌ Don't set gas limit too low (transaction will fail)
- ❌ Don't set max fee too low (transaction will fail)
- ❌ Don't spam transactions (each costs gas)
- ❌ Don't register the same content twice

## 📊 Cost Examples

### Scenario 1: Individual Creator

**Setup**:
- 20 videos to register
- 20 YouTube links to bind
- Network: Base

**Costs**:
```
Register 20 videos: 20 × $0.01 = $0.20
Bind 20 links: 20 × $0.01 = $0.20
Total: $0.40
```

**With $5**: Can register ~120 videos + bind 120 links

### Scenario 2: Musician

**Setup**:
- 12 songs (album)
- Multiple platforms per song (YouTube, Spotify via ID, TikTok)
- Network: Polygon

**Costs**:
```
Register 12 songs: 12 × $0.01 = $0.12
Bind 36 links (3 per song): 36 × $0.01 = $0.36
Total: $0.48
```

**With $5**: Can register ~10 albums + bind all links

### Scenario 3: Journalist

**Setup**:
- 50 source documents
- No public binding needed (privacy mode)
- Network: Base

**Costs**:
```
Register 50 docs: 50 × $0.01 = $0.50
Bindings: None
Total: $0.50
```

**With $5**: Can register ~500 documents

### Scenario 4: High-Value Content

**Setup**:
- 1 critical piece of evidence
- Need maximum security
- Network: Ethereum

**Costs**:
```
Register 1 file: 1 × $2.00 = $2.00
Bind 1 link: 1 × $2.00 = $2.00
Total: $4.00
```

**Trade-off**: Much higher cost, but maximum security and recognition

## 🆘 Gas Fee Troubleshooting

### Transaction Failed: "Insufficient Funds"

**Problem**: Not enough ETH/MATIC for gas + buffer

**Solution**:
1. Check balance in MetaMask
2. Need gas fee + small buffer (~$0.10)
3. Add more funds
4. Or switch to cheaper network

### Transaction Failed: "Out of Gas"

**Problem**: Gas limit too low for operation

**Solution**:
1. Increase gas limit by 20%
2. In MetaMask: Edit → Advanced → Increase limit
3. Retry transaction

### Transaction Stuck Pending

**Problem**: Gas price too low, not getting picked up

**Solution**:
1. Click transaction in MetaMask
2. Click "Speed Up"
3. Approve higher gas price
4. Should confirm within minutes

### Gas Price Seems Too High

**Problem**: MetaMask showing unexpectedly high fee

**Solution**:
1. Check current gas prices on block explorer
2. Wait if network congested
3. Switch to cheaper network
4. Or accept if urgent

## 📚 Learn More

- **[FAQ: Gas Fee Questions](./faq.md#blockchain-questions)** - Common questions
- **[Getting Started: Choose Network](./getting-started.md#step-2-choose-your-network)** - Network comparison
- **[Ethereum.org: Gas Explained](https://ethereum.org/en/developers/docs/gas/)** - Deep dive

## 💬 Questions?

Gas fees confusing?

- Check the [FAQ](./faq.md)
- Ask in [Discord](https://discord.gg/internetid)
- Email: support@internet-id.io

We're happy to help you optimize costs! 🚀
