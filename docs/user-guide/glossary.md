# Glossary of Terms

Quick reference for key terms and concepts used in Internet ID.

## A

### API (Application Programming Interface)
A set of tools and protocols that allows different software applications to communicate. Internet ID provides an API for developers to integrate content verification into their apps.

### Address (Wallet Address)
A unique string of characters (e.g., `0x1234...5678`) that identifies your wallet on the blockchain. Like a bank account number, but for crypto.

## B

### Base
A Layer 2 blockchain built by Coinbase. One of the cheapest and fastest networks for Internet ID registrations (~$0.01 per transaction).

### Binding (Platform Binding)
Linking platform content (like a YouTube video) to your registered original file. Necessary because platforms re-encode content, changing the hash.

### Block
A group of transactions recorded on a blockchain. Each block is linked to the previous one, forming a chain (hence "blockchain").

### Blockchain
A distributed, immutable ledger that records transactions across many computers. Used by Internet ID to permanently anchor content hashes.

### Block Explorer
A website that lets you search and view blockchain transactions. Examples: Etherscan, BaseScan, PolygonScan.

## C

### Chain ID
A unique number identifying a specific blockchain network. Examples: 1 (Ethereum), 8453 (Base), 137 (Polygon).

### CID (Content Identifier)
A unique identifier used by IPFS to address content. Starts with `Qm` or `bafy`. Example: `QmX5ZQMx...abc123`

### Confirmation
Verification that a blockchain transaction has been included in a block. Usually need 1-2 confirmations for finality.

### Content Hash
A unique "fingerprint" of a file, created using cryptographic hashing (SHA-256). Same file always produces the same hash; different files produce different hashes.

### Creator
The person or entity who created and registered content. Identified by their wallet address.

### Crypto (Cryptocurrency)
Digital currency that uses cryptography for security. Used to pay gas fees on blockchains (ETH, MATIC, etc.).

## D

### Deepfake
Synthetic media (video, audio, image) created or manipulated using AI, often to impersonate someone.

### DApp (Decentralized Application)
An application that runs on a blockchain or peer-to-peer network, rather than on centralized servers.

## E

### ETH (Ether)
The native cryptocurrency of Ethereum and Ethereum-compatible networks. Used to pay gas fees.

### Ethereum
The second-largest blockchain network. More expensive than Layer 2s, but highly secure and decentralized.

## F

### Faucet
A website or service that gives away small amounts of cryptocurrency for free. Used to get testnet tokens for practice.

### Fingerprint
See [Content Hash](#content-hash). A unique identifier of a file.

## G

### Gas
The unit measuring computational work on a blockchain. You pay gas fees to have transactions processed.

### Gas Fee (Gas Price)
The cost to execute a transaction on a blockchain, paid to validators/miners. Varies by network and congestion.

### Gateway (IPFS Gateway)
A server that provides HTTP access to IPFS content. Examples: gateway.ipfs.io, cloudflare-ipfs.com

### gwei
A denomination of ETH. 1 gwei = 0.000000001 ETH. Gas prices are often shown in gwei.

## H

### Hash
See [Content Hash](#content-hash). A fixed-size string produced by a cryptographic function from any input data.

### Hexadecimal (Hex)
Base-16 number system using 0-9 and A-F. Wallet addresses and hashes are in hex. Example: `0x1a2b3c`

## I

### Immutable
Cannot be changed or deleted. Blockchain records are immutable—once written, they're permanent.

### IPFS (InterPlanetary File System)
A distributed file storage protocol. Content is stored across many nodes worldwide, making it censorship-resistant.

## K

### Keys
**Private Key**: Secret key that controls your wallet. Never share!  
**Public Key**: Derived from private key, used to create wallet address. Safe to share.

## L

### L1 (Layer 1)
A base blockchain network (e.g., Ethereum, Bitcoin). Processes transactions directly on-chain.

### L2 (Layer 2)
A network built on top of a base blockchain (L1) to improve speed and reduce costs. Examples: Base, Polygon, Arbitrum, Optimism.

## M

### Mainnet
The main production blockchain network where transactions have real value. Opposite of testnet.

### Manifest
A JSON file containing metadata about your content, including the hash, your signature, and optional details like title and description.

### MATIC
The native cryptocurrency of the Polygon network. Used to pay gas fees on Polygon.

### MetaMask
A popular browser extension and mobile app that acts as a crypto wallet and gateway to blockchain apps.

### Mnemonic (Seed Phrase, Recovery Phrase)
A list of 12-24 words that can restore your entire wallet. Must be kept secret and safe!

## N

### Network
A specific blockchain or blockchain environment. Examples: Ethereum Mainnet, Base, Polygon, Base Sepolia Testnet.

### NFT (Non-Fungible Token)
A unique digital asset on a blockchain. Internet ID is NOT about NFTs—it's about content provenance, not token ownership.

### Node
A computer that participates in a blockchain network by validating and relaying transactions.

### Nonce
A number used once. In blockchain, it's a counter that ensures transactions from an account are processed in order.

## O

### On-Chain
Data or actions that are recorded on the blockchain. Internet ID stores content hashes on-chain.

### Off-Chain
Data stored outside the blockchain. Internet ID stores manifests and optionally files off-chain (IPFS).

## P

### Platform
A content-sharing website or service like YouTube, Twitter, TikTok, Instagram, etc.

### Polygon
A Layer 2 network for Ethereum. Very cheap gas fees (~$0.01) and fast transactions.

### Private Key
See [Keys](#keys). The secret that controls your wallet. NEVER share it!

### Proof (Proof Bundle)
A JSON file containing all evidence of content provenance: hash, manifest, signature, on-chain record, transaction receipt.

### Provenance
The history and origin of an object. Internet ID provides digital provenance for content.

## Q

### QR Code
A 2D barcode that can be scanned to quickly access information. Internet ID generates QR codes for verification links.

## R

### Registry (Content Registry)
The smart contract on the blockchain that stores content hashes and manifests URIs. The core of Internet ID.

### Recovery Phrase
See [Mnemonic](#mnemonic-seed-phrase-recovery-phrase). 12-24 words that restore your wallet.

### Re-encoding
When a platform (like YouTube) changes your file format, compression, or resolution, creating a different file with a different hash.

### RPC (Remote Procedure Call)
A protocol that allows your app to communicate with a blockchain. RPC URLs are endpoints that connect to blockchain nodes.

## S

### Seed Phrase
See [Mnemonic](#mnemonic-seed-phrase-recovery-phrase). 12-24 words that restore your wallet.

### Sepolia
An Ethereum testnet (test network) where you can practice without spending real money.

### Signature (Digital Signature)
Cryptographic proof that you signed something with your private key. Used to prove you created a manifest.

### Smart Contract
A program that runs on a blockchain. Internet ID's ContentRegistry is a smart contract.

### Solidity
The programming language used to write Ethereum smart contracts.

## T

### Testnet (Test Network)
A blockchain network used for testing, where tokens have no real value. Examples: Base Sepolia, Polygon Amoy.

### Transaction (Tx)
An action recorded on the blockchain, such as registering content. Requires a gas fee.

### Transaction Hash (Tx Hash)
A unique identifier for a transaction. Example: `0xabc123...789xyz`. Used to look up transactions on block explorers.

## U

### URI (Uniform Resource Identifier)
A string that identifies a resource. Internet ID uses IPFS URIs like `ipfs://QmXyz123...`

## V

### Verification
The process of checking that content matches its registered hash and that the creator's signature is valid.

### Verification Badge
A visual indicator (image or icon) showing that content has been verified by Internet ID.

## W

### Wallet
Software that stores your private keys and allows you to interact with blockchains. Examples: MetaMask, Coinbase Wallet, Rainbow.

### Web3
The vision of a decentralized internet built on blockchain technology.

### Web3.Storage
A service that provides free IPFS storage. One of the IPFS providers supported by Internet ID.

## Z

### Zero-Knowledge Proof
A cryptographic method to prove something is true without revealing the information itself. Not currently used by Internet ID, but planned for future features.

---

## Related Resources

- **[What is Internet ID?](./what-is-internet-id.md)** - Overview and concepts
- **[FAQ](./faq.md)** - Frequently asked questions
- **[Getting Started](./getting-started.md)** - Setup guide
- **[User Guide Index](./INDEX.md)** - All documentation

## External Resources

- **[Ethereum.org Glossary](https://ethereum.org/en/glossary/)** - Comprehensive Ethereum terms
- **[IPFS Documentation](https://docs.ipfs.tech/)** - Learn about IPFS
- **[MetaMask Support](https://support.metamask.io/)** - Wallet help

---

**Can't find a term?** [Let us know](mailto:docs@internet-id.io) and we'll add it!
