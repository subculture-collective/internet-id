# Frequently Asked Questions (FAQ)

Get answers to the most common questions about Internet ID.

## 🎯 General Questions

### What is Internet ID?

Internet ID is a platform that helps creators prove ownership of their digital content. It creates a cryptographic "fingerprint" of your work and anchors it to a public blockchain, providing permanent, verifiable proof that you created it.

Think of it as a digital notary service that timestamps and authenticates your content.

### Why should I use Internet ID?

**For Creators:**

- Prove you created content before anyone else
- Combat impersonation and content theft
- Build trust with your audience
- Platform-independent proof (works across YouTube, TikTok, Twitter, etc.)

**For Audiences:**

- Verify content is from the real creator
- Distinguish authentic content from deepfakes
- Trust what you're watching/reading

### How is this different from copyright?

Internet ID doesn't replace copyright—it complements it:

| Aspect               | Copyright                              | Internet ID                |
| -------------------- | -------------------------------------- | -------------------------- |
| **Legal Protection** | Yes, full legal rights                 | No, just proof of creation |
| **Registration**     | Optional (automatic in most countries) | Voluntary opt-in           |
| **Cost**             | Often expensive to enforce             | ~$0.01 per registration    |
| **Speed**            | Can take months/years to enforce       | Instant verification       |
| **Proof**            | Must go through courts                 | Public blockchain proof    |

Use Internet ID for **instant, public proof**. Use copyright for **legal protection and enforcement**.

### Is Internet ID free?

**Account Creation**: Free  
**Connecting Wallet**: Free  
**Browsing/Viewing**: Free  
**Verifying Content**: Free

**Registration Costs**: Small blockchain gas fees

- Base: ~$0.01 per registration
- Polygon: ~$0.01 per registration
- Ethereum: ~$0.50+ per registration (not recommended)

See [Gas Fees Guide](./gas-fees.md) for ways to minimize costs.

### Do I need to know about cryptocurrency or blockchain?

No! While Internet ID uses blockchain technology, you don't need to understand how it works. Our guides walk you through:

- Setting up a wallet (5 minutes)
- Getting a small amount of crypto (~$5 worth)
- Registering content (click a button)

If you can use Twitter, you can use Internet ID.

## 🔐 Security & Privacy

### Is my content private?

**By default, YES!** You have two options:

**Privacy Mode (Default)**:

- Only the file's hash (fingerprint) is stored
- Your original file stays on your device
- Nobody can download or see your content
- Perfect for unreleased work, sensitive content, or personal files

**Public Mode (Opt-in)**:

- You choose to upload the file to IPFS
- Anyone can download the original
- Good for content you want to distribute publicly

### What data does Internet ID collect?

We collect minimal data:

- **On-chain**: Content hash, your wallet address, timestamp
- **Off-chain**: Manifest (file metadata, your signature)
- **Optional**: Email, social accounts (if you sign in for platform bindings)

We NEVER collect:

- Your private keys or recovery phrase
- Your original files (unless you opt in)
- Personally identifiable information (unless you provide it)

See [Privacy Policy](./privacy-security.md) for details.

### Can Internet ID access my wallet?

**No!** We can never:

- Access your funds
- See your recovery phrase
- Make transactions without your approval
- Control your wallet in any way

You approve every transaction. Your wallet, your keys, your control.

### What if Internet ID shuts down?

Your proof remains valid! Here's why:

- Content hashes are on public blockchains (permanent)
- Manifests are on IPFS (distributed storage)
- You can verify independently with open-source tools
- Anyone can build verification tools using the blockchain data

Internet ID the company could disappear, but your proof lives forever.

## 🔗 Platform Integration

### Which platforms can I bind to?

Currently supported:

- ✅ YouTube
- ✅ Twitter/X
- ✅ TikTok
- ✅ Instagram
- ✅ GitHub
- ✅ LinkedIn
- ✅ Discord

More platforms coming soon! Vote for your favorite in our Discord.

### Why do I need to bind platform links?

Platforms re-encode your content (change quality, format, compression), so the file hash changes. Binding creates a verified link between:

- Your original file (with hash A)
- Your platform post (with hash B)

This way, viewers can verify your YouTube video even though YouTube changed the file.

### Can I bind multiple platforms to one file?

Yes! You can bind as many platform links as you want to a single registered file. For example:

- Register original video once
- Bind to YouTube version
- Bind to Twitter version
- Bind to TikTok version
- All point back to the same original proof

### Do I need to bind every platform?

No, it's optional. Binding is useful when:

- You've posted on platforms that re-encode (YouTube, TikTok)
- You want easy verification for viewers
- You want to use the browser extension

You can skip binding if you only want to prove you created the original file.

## ⛓️ Blockchain Questions

### Why use blockchain?

Blockchain provides:

- **Immutability**: Can't be changed or deleted
- **Transparency**: Anyone can verify
- **Decentralization**: No single point of failure
- **Timestamp**: Permanent proof of "when"
- **Ownership**: Cryptographically proven

Traditional databases can be hacked, manipulated, or taken offline. Blockchain can't.

### Which blockchain should I use?

We recommend **Base** for most users:

- Very low fees (~$0.01)
- Fast transactions (2-5 seconds)
- Backed by Coinbase (reliable)
- Growing ecosystem

Other options:

- **Polygon**: Also very cheap, more established
- **Arbitrum/Optimism**: Good balance of cost and security
- **Ethereum**: Most secure but expensive (~$0.50+ per transaction)

See [Network Comparison](./getting-started.md#step-2-choose-your-network) for details.

### What are gas fees?

Gas fees are small payments to blockchain validators who process your transaction. Think of it like a stamp on a letter—you pay a tiny fee to have it delivered.

**Typical Costs:**

- Base: $0.01 per registration
- Polygon: $0.01 per registration
- Ethereum: $0.50-5.00 per registration

See [Gas Fees Guide](./gas-fees.md) for optimization tips.

### Can I use multiple blockchains?

Yes! You can register the same content on multiple blockchains. Each registration is independent. This provides:

- Redundancy (if one blockchain has issues)
- Flexibility (use cheap networks for tests, secure networks for important content)
- Broader reach (users can verify on their preferred network)

### What if gas fees spike?

Networks like Base and Polygon have very stable, low fees. But if fees spike:

- Wait a few minutes/hours (fees fluctuate)
- Use a different network (switch to Polygon if Base is expensive)
- Batch multiple registrations (register 10 files at once)

See [Gas Optimization](./gas-fees.md#minimizing-costs).

## 🛠️ Technical Questions

### What's a content hash?

A content hash is a unique "fingerprint" of your file created using cryptography (SHA-256 algorithm). Key properties:

- **Unique**: Different files = different hashes
- **Deterministic**: Same file = same hash (always)
- **One-way**: Can't recreate file from hash
- **Sensitive**: Change one pixel = completely different hash

Example hash: `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`

### What's in a manifest?

A manifest is a small JSON file that contains:

```json
{
  "content_hash": "9f86d081...",
  "content_uri": "ipfs://Qm...", // optional
  "created_at": "2025-11-02T...",
  "creator": "0x1234...",
  "signature": "0xabcd...",
  "metadata": {
    "name": "My Video",
    "description": "..."
    // optional fields
  }
}
```

The manifest is signed with your wallet, proving you created it.

### What's IPFS?

IPFS (InterPlanetary File System) is a distributed storage network. Instead of storing files on one server, IPFS spreads them across thousands of computers worldwide.

Benefits:

- Can't be censored or taken down
- No single point of failure
- Content-addressed (hash is the address)
- Works forever (as long as anyone hosts it)

### Can I verify content without Internet ID?

Yes! Everything is open-source. You can:

1. Read the content hash from the blockchain
2. Download the manifest from IPFS
3. Recompute the file hash yourself
4. Verify the signature matches
5. Confirm on-chain entry matches

See [Manual Verification](./verifying-content.md#manual-verification) guide.

### Is the code open-source?

Yes! Everything is on GitHub:

- Smart contracts: https://github.com/subculture-collective/internet-id/tree/main/contracts
- Web app: https://github.com/subculture-collective/internet-id/tree/main/web
- API: https://github.com/subculture-collective/internet-id/tree/main/scripts
- CLI: https://github.com/subculture-collective/internet-id/tree/main/cli

Contributions welcome!

## 📱 Browser Extension

### Do I need the browser extension?

No, it's optional. The extension provides:

- One-click verification on YouTube, Twitter, etc.
- Automatic verification badges on platform pages
- Quick access to register new content

You can use Internet ID without it, but the extension makes verification much easier.

### Is the extension safe?

Yes! The extension:

- Is open-source (you can audit the code)
- Requests minimal permissions
- Doesn't track you
- Only communicates with Internet ID API
- Stores data locally only

See [Extension Security](./browser-extension.md#security) for details.

### Why isn't it on the Chrome Web Store yet?

We're working on it! Currently in review. For now:

- Download from GitHub
- Install as unpacked extension
- Follow [installation guide](./browser-extension.md)

## 💰 Cost & Billing

### How much does it cost to register content?

**Per Registration**: ~$0.01 on Base or Polygon

**How far does $5 go?**

- Base: ~500 registrations
- Polygon: ~500 registrations
- Ethereum: ~10 registrations (expensive!)

**Other Costs:**

- Binding platform links: ~$0.01 each
- Updating metadata: ~$0.01 per update
- Verifying content: FREE
- Viewing content: FREE

### Can I get free registrations?

**Test Networks**: Use Base Sepolia or Polygon Amoy testnets with free test tokens to practice.

**Mainnet**: No, gas fees go to blockchain validators (not Internet ID). We don't control or receive these fees.

### Are there subscription plans?

Not currently. Internet ID uses a pay-per-use model (pay gas fees only).

Future plans may include:

- Premium features (batch operations, analytics)
- White-label solutions for businesses
- API access tiers

But core registration will always be available to anyone with gas fees.

## 🆘 Troubleshooting

### My transaction failed. What now?

Common causes:

1. **Insufficient balance**: Need gas + small buffer
2. **Network congestion**: Try again in a few minutes
3. **Wrong network**: Make sure wallet network matches app network
4. **Outdated settings**: Clear cache, refresh page

See [Troubleshooting Guide](./troubleshooting.md#transaction-failures) for detailed steps.

### I can't connect my wallet

Try:

1. Refresh the page
2. Unlock MetaMask
3. Check you're on the correct network
4. Clear browser cache
5. Try a different browser
6. Update MetaMask to latest version

See [Troubleshooting Guide](./troubleshooting.md#wallet-issues).

### Where did my content go?

Check:

- Are you on the same network you registered on?
- Did the transaction confirm? (Check on block explorer)
- Did you refresh the page?
- Are you connected with the same wallet?

See [Troubleshooting Guide](./troubleshooting.md#content-not-showing).

### How do I contact support?

- **[Troubleshooting Guide](./troubleshooting.md)** - Check here first
- **Discord** - Community support (fastest)
- **Email** - support@internet-id.io (24-48 hour response)
- **GitHub Issues** - For bugs and feature requests

## 🎓 Learning More

### Where can I learn more?

- **[What is Internet ID?](./what-is-internet-id.md)** - Concept overview
- **[Getting Started](./getting-started.md)** - Setup guide
- **[Quick Start Tutorial](./quick-start.md)** - Register in 5 minutes
- **[Full User Guide](./INDEX.md)** - Complete documentation

### Can I try without spending money?

Yes! Use test networks:

1. Get free test tokens from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
2. Register test content
3. Try all features risk-free
4. Switch to mainnet when ready

See [Getting Started Guide](./getting-started.md#getting-test-funds-free) for details.

### I want to build on Internet ID. Where do I start?

Check out developer resources:

- **[Developer Onboarding](../DEVELOPER_ONBOARDING.md)** - For builders
- **[Public API Docs](../PUBLIC_API.md)** - API reference
- **[SDK Documentation](../../sdk/typescript/README.md)** - TypeScript SDK
- **[CLI Documentation](../../cli/README.md)** - Command-line tool

## 💬 Community

### How can I get involved?

- **Discord** - Chat with users and team
- **Twitter** - Follow [@InternetID](https://twitter.com/internetid)
- **GitHub** - Contribute code
- **Feedback** - Share ideas and suggestions

### Can I suggest features?

Yes! We love feedback. Share ideas:

- Discord #feature-requests channel
- GitHub Issues
- Email: feedback@internet-id.io

### Is there a bug bounty program?

Yes! Report security vulnerabilities:

- Email: security@subculture.io
- Use GitHub Security Advisory
- See [Security Policy](../SECURITY_POLICY.md)

Rewards available for critical findings.

---

## 📚 Still Have Questions?

Can't find your answer?

1. Check the [complete user guide](./INDEX.md)
2. Ask in [Discord community](https://discord.gg/internetid)
3. Email us: support@internet-id.io

We're here to help! 🚀
