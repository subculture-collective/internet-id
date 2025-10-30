# Internet-ID Architecture

## Overview

Internet-ID is a decentralized content provenance system that enables creators to anchor their original content on-chain, proving authorship and creation time. The system consists of four main layers that work together to provide end-to-end content verification.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Web UI (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Upload Flow │  │ Verify Flow  │  │ Account/Auth │             │
│  │  (One-shot)  │  │  (Public)    │  │  (NextAuth)  │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                         │
│                    API Calls (REST)                                 │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                    Express API Server                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Upload     │  │   Register   │  │    Verify    │             │
│  │   /upload    │  │  /register   │  │   /verify    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│    ┌────┴────┐        ┌────┴────┐       ┌────┴────┐                │
│    │  IPFS   │        │ Web3/   │       │ Prisma  │                │
│    │ Service │        │ Ethers  │       │   ORM   │                │
│    └─────────┘        └────┬────┘       └────┬────┘                │
│                            │                  │                      │
│  Rate Limiting ◄──► Redis Cache ◄──────────┐ │                     │
└────────────────────────────┼────────────────┼─┼─────────────────────┘
                             │                │ │
                             │                │ │
┌────────────────────────────┼────────────────┘ │
│         Blockchain Layer   │                  │
│  ┌─────────────────────────▼────────────┐    │
│  │   ContentRegistry.sol (Smart Contract)│    │
│  │   • register(hash, manifestURI)       │    │
│  │   • bindPlatform(hash, platform, id)  │    │
│  │   • resolveByPlatform(platform, id)   │    │
│  └───────────────────────────────────────┘    │
│                                                │
│  Deployed on multiple EVM chains:              │
│  • Base, Base Sepolia (Recommended)           │
│  • Ethereum, Sepolia                          │
│  • Polygon, Polygon Amoy                      │
│  • Arbitrum, Optimism (+ testnets)            │
└────────────────────────────────────────────────┘
                                                 │
┌────────────────────────────────────────────────┼─────────────────────┐
│              Database Layer (Prisma)           │                     │
│  ┌────────────────────────────────────────────▼───────────────────┐ │
│  │  PostgreSQL / SQLite                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐ │ │
│  │  │  Users   │  │ Contents │  │  Platform  │  │ Verifications│ │ │
│  │  │          │  │          │  │  Bindings  │  │             │ │ │
│  │  └──────────┘  └──────────┘  └────────────┘  └─────────────┘ │ │
│  │  ┌──────────┐  ┌──────────┐                                   │ │
│  │  │ Accounts │  │ Sessions │  (NextAuth models)                │ │
│  │  └──────────┘  └──────────┘                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    External Storage (IPFS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Web3.Storage │  │    Pinata    │  │    Infura    │             │
│  │  (primary)   │  │  (fallback)  │  │  (fallback)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  Stores: Content files, Manifest JSON files                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Smart Contract Layer (ContentRegistry.sol)

**Purpose**: Immutable on-chain registry for content provenance

**Key Functions**:

- `register(contentHash, manifestURI)` - Anchor content hash and manifest location on-chain
- `bindPlatform(contentHash, platform, platformId)` - Link platform-specific IDs (e.g., YouTube video IDs) to original content
- `resolveByPlatform(platform, platformId)` - Look up content by platform binding

**Storage**:

- Mapping: `contentHash → Entry(creator, manifestURI, timestamp)`
- Mapping: `platformKey → contentHash` (for YouTube, TikTok, etc.)

**Multi-Chain**: Deployed on multiple EVM networks for flexibility and cost optimization.

### 2. API Server Layer (Express + TypeScript)

**Purpose**: Business logic, IPFS uploads, blockchain interactions, caching

**Key Endpoints**:

**Protected Endpoints** (require `x-api-key` header when `API_KEY` is set):

- `POST /api/upload` - Upload files to IPFS
- `POST /api/manifest` - Generate and optionally upload manifest JSON
- `POST /api/register` - Register content hash on-chain via ContentRegistry
- `POST /api/bind` - Bind single platform ID
- `POST /api/bind-many` - Bind multiple platform IDs in batch

**Public Endpoints**:

- `GET /api/health` - Server health check
- `GET /api/contents` - List registered content
- `POST /api/verify` - Verify file against manifest and on-chain entry
- `POST /api/proof` - Generate portable proof bundle
- `GET /api/resolve?platform=youtube&platformId=xxx` - Resolve platform binding
- `GET /api/badge/[hash]` - Generate SVG badge for content
- `GET /api/qr?url=...` - Generate QR code for share links

**Key Services**:

- **IPFS Service**: Multi-provider upload with automatic fallback (Web3.Storage → Pinata → Infura)
- **Registry Service**: Blockchain interactions using ethers.js
- **Cache Service**: Redis-based caching for performance (optional)
- **Rate Limiting**: Tiered rate limits (strict/moderate/relaxed) using Redis or in-memory store

**Dependencies**:

- Express.js for HTTP server
- Ethers.js v6 for blockchain interactions
- Prisma ORM for database access
- Multer for file uploads
- Redis for caching and rate limiting (optional)

### 3. Database Layer (Prisma + PostgreSQL/SQLite)

**Purpose**: Store content metadata, platform bindings, verifications, and user data

**Key Models**:

**Content Management**:

- `Content` - Registered content with hash, manifest URI, creator info
- `PlatformBinding` - Links content to platform-specific IDs
- `Verification` - History of verification attempts

**Authentication (NextAuth)**:

- `User` - User accounts (email, wallet address)
- `Account` - OAuth provider accounts (GitHub, Google, Twitter, etc.)
- `Session` - Active user sessions

**Schema Location**: Single source of truth at `prisma/schema.prisma`

**Generators**: Two Prisma clients generated from one schema:

- Root client for API/scripts: `./node_modules/@prisma/client`
- Web client for Next.js: `../web/node_modules/.prisma/client`

**Performance**: 17 indexes optimize queries for content lookup, creator filtering, and platform resolution.

### 4. Web UI Layer (Next.js App Router)

**Purpose**: User-facing interface for content registration, verification, and account management

**Key Pages/Features**:

**Upload & Registration**:

- `/upload` - Upload files to IPFS
- `/manifest` - Create manifest JSON
- `/register` - Register content on-chain
- `/oneshot` - One-click flow: upload → manifest → register (with optional content upload)

**Verification**:

- `/verify` - Public verification page (shareable)
- `/proof` - Generate portable proof bundles

**Platform Bindings**:

- `/bind` - Bind single platform ID
- `/bind-many` - Batch bind multiple platform IDs

**Account & Auth**:

- `/account` - User profile and linked OAuth accounts
- NextAuth integration for GitHub, Google, Twitter, TikTok, etc.

**Browse & Share**:

- `/contents` - Browse registered content
- Share block with badge, QR code, embed HTML

**Technologies**:

- Next.js 15 (App Router)
- NextAuth v4 for authentication
- React 18 (Server Components)
- Prisma Client (web generator)

### 5. IPFS Storage Layer

**Purpose**: Decentralized storage for content files and manifest JSON

**Providers** (with automatic fallback):

1. **Web3.Storage** - Primary, free tier available
2. **Pinata** - Fallback, JWT authentication
3. **Infura** - Fallback, project credentials required
4. **Local Kubo Node** - Optional, for self-hosting

**What Gets Stored**:

- Content files (videos, images, documents)
- Manifest JSON files (metadata + signature)

**Why IPFS**:

- Content-addressed (CID = hash of content)
- Decentralized and censorship-resistant
- Verifiable integrity

## Data Flow Examples

### Registration Flow (Complete)

```
1. Creator hashes content locally (SHA-256)
   └─> contentHash: 0xabc123...

2. Creator signs manifest JSON with private key
   └─> Manifest: { content_hash, content_uri, signature, creator }

3. Upload manifest to IPFS (via API)
   API (/api/upload) → IPFS Service → Web3.Storage
   └─> manifestCID: QmXyz789...
   └─> manifestURI: ipfs://QmXyz789...

4. Register on-chain (via API)
   API (/api/register) → Registry Service → ContentRegistry.register(hash, manifestURI)
   └─> Transaction broadcast to blockchain
   └─> Event emitted: ContentRegistered(hash, creator, manifestURI, timestamp)

5. Store metadata in database
   Prisma → Content table
   └─> Record: { contentHash, manifestUri, creatorAddress, txHash, ... }

6. Cache cleared (if Redis enabled)
   Cache Service invalidates related keys
```

### Verification Flow (Public)

```
1. Verifier provides file or platform URL
   └─> File: video.mp4
   └─> OR Platform URL: https://youtube.com/watch?v=abc123

2. Compute file hash (SHA-256)
   └─> contentHash: 0xabc123...

3. Fetch manifest from IPFS
   manifestURI → IPFS Gateway → manifest.json
   └─> Extract: content_hash, signature, creator

4. Verify signature
   ecrecover(signature) → recovered address
   └─> Compare with manifest.creator

5. Check on-chain registry
   ContentRegistry.entries[hash] → Entry
   └─> Verify: creator, manifestURI match

6. Return verification result
   API (/api/verify) → Response: { status: "valid", creator, timestamp, ... }
```

### Platform Binding Flow (YouTube Example)

```
1. Creator uploads master file to YouTube
   └─> YouTube re-encodes → different hash
   └─> Video ID: dQw4w9WgXcQ

2. Bind YouTube ID to original content hash
   API (/api/bind) → Registry Service
   └─> ContentRegistry.bindPlatform(hash, "youtube", "dQw4w9WgXcQ")
   └─> platformKey = keccak256("youtube:dQw4w9WgXcQ")

3. Store binding in database
   Prisma → PlatformBinding table
   └─> Record: { platform: "youtube", platformId: "dQw4w9WgXcQ", contentId: ... }

4. Verification via YouTube URL
   API (/api/resolve?platform=youtube&platformId=dQw4w9WgXcQ)
   └─> Lookup binding → contentHash
   └─> Fetch manifest and verify as usual
```

## Security Model

### Authentication & Authorization

- **API Key Protection**: Optional `API_KEY` environment variable protects sensitive endpoints
- **OAuth Integration**: NextAuth supports multiple providers (GitHub, Google, Twitter, TikTok, etc.)
- **Creator-Only Operations**: Smart contract enforces `onlyCreator` modifier for updates and bindings
- **Signature Verification**: Manifest signatures validated using ECDSA recovery

### Input Validation

- **Zod Schemas**: Comprehensive validation for all API inputs
- **XSS Prevention**: Sanitization of user-provided strings
- **SQL Injection**: Prisma ORM uses parameterized queries
- **Path Traversal**: File upload paths restricted to temp directories
- **Rate Limiting**: Tiered limits prevent abuse (strict/moderate/relaxed)

### Smart Contract Security

- **No External Calls**: No reentrancy risk
- **Integer Overflow**: Solidity 0.8+ built-in protection
- **Access Control**: `onlyCreator` modifier for sensitive operations
- **Timestamp-Based Existence**: Simple, gas-efficient checks

See: [Security Policy](../SECURITY_POLICY.md) | [Smart Contract Audit](./SMART_CONTRACT_AUDIT.md)

## Caching & Performance

### Redis Cache (Optional)

When `REDIS_URL` is configured, the API uses Redis for:

1. **Response Caching**:
   - Content metadata: 10 minutes
   - Manifest data: 15 minutes
   - Platform bindings: 3 minutes
   - Verification status: 5 minutes
   - IPFS gateway URLs: 30 minutes

2. **Rate Limiting**:
   - Distributed rate limiting across multiple API instances
   - Per-IP and per-API-key tracking

**Cache Strategy**: Cache-aside pattern with automatic invalidation on writes

**Monitoring**: `/api/cache/metrics` endpoint for hit rates and performance stats

### Database Indexes

17 indexes optimize common queries:

- Content lookup by hash (unique)
- Creator filtering (non-unique)
- Platform binding resolution (unique composite)
- Temporal queries (createdAt indexes)

See: [Caching Architecture](./CACHING_ARCHITECTURE.md) | [Database Indexing Strategy](./DATABASE_INDEXING_STRATEGY.md)

## Multi-Chain Support

### Why Multi-Chain?

- **Cost Optimization**: L2 chains (Base, Polygon, Arbitrum, Optimism) offer 10-100x lower gas costs
- **Network Effects**: Reach different ecosystems and user bases
- **Redundancy**: Deploy on multiple chains for resilience

### Deployment Model

- **Independent Contracts**: Each chain has its own ContentRegistry deployment
- **Saved Addresses**: Deployment info saved in `deployed/<network>.json`
- **Automatic Resolution**: Registry service selects contract based on `chainId`

### Supported Networks

**Mainnets**: Ethereum, Polygon, Base, Arbitrum, Optimism  
**Testnets**: Sepolia, Polygon Amoy, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia

See: [Multi-Chain Deployment Guide](./MULTI_CHAIN_DEPLOYMENT.md)

## Technology Stack Summary

| Layer           | Technology              | Purpose                                   |
| --------------- | ----------------------- | ----------------------------------------- |
| Smart Contracts | Solidity 0.8.20         | Immutable content registry                |
| Development     | Hardhat + TypeScript    | Contract compilation, testing, deployment |
| Blockchain      | Ethers.js v6            | Web3 interactions                         |
| API             | Express.js              | REST API server                           |
| Database        | Prisma ORM              | Type-safe database access                 |
| Storage         | PostgreSQL / SQLite     | Relational data storage                   |
| Cache           | Redis                   | Performance optimization                  |
| IPFS            | ipfs-http-client        | Decentralized file storage                |
| Web             | Next.js 15 (App Router) | User interface                            |
| Auth            | NextAuth v4             | OAuth integration                         |
| Validation      | Zod                     | Input validation schemas                  |
| Linting         | ESLint + Prettier       | Code quality                              |
| Testing         | Mocha + Chai            | Unit and integration tests                |
| CI/CD           | GitHub Actions          | Automated testing                         |

## Environment Configuration

See [Contributor Onboarding Guide](./CONTRIBUTOR_ONBOARDING.md) for detailed setup instructions.

## Further Reading

- [Contributor Onboarding Guide](./CONTRIBUTOR_ONBOARDING.md) - Setup, development workflow, testing
- [Smart Contract Audit](./SMART_CONTRACT_AUDIT.md) - Security analysis
- [Input Validation](./VALIDATION.md) - Zod schemas and security
- [Caching Architecture](./CACHING_ARCHITECTURE.md) - Redis caching details
- [Rate Limiting](./RATE_LIMITING.md) - Rate limit configuration
- [Multi-Chain Deployment](./MULTI_CHAIN_DEPLOYMENT.md) - Deployment guide
- [Database Indexing](./DATABASE_INDEXING_STRATEGY.md) - Query optimization
- [Platform Verification](./PLATFORM_VERIFICATION.md) - Platform binding details
