# Internet-ID: Human-Created Content Anchoring

[![CI](https://github.com/subculture-collective/internet-id/actions/workflows/ci.yml/badge.svg)](https://github.com/subculture-collective/internet-id/actions/workflows/ci.yml)

This repo scaffolds a minimal on-chain content provenance flow:

- A creator hashes their content and signs a manifest.
- The manifest and content are stored off-chain (e.g., IPFS/Web3.Storage).
- A small registry contract on an L2 anchors the content hash and a URI to the manifest.
- Verifiers can recompute the hash, check the signature, and confirm the on-chain anchor.

> Note: This proves provenance, not truth. It helps distinguish opted-in human-created content from anonymous deepfakes.

Looking for a plain-English overview? See the pitch: [PITCH.md](./PITCH.md)

## Stack

- Solidity (ContentRegistry)
- Hardhat + TypeScript
- Ethers v6
- IPFS uploads via Infura, Web3.Storage, or Pinata
- Express API with optional API key protection
- **Comprehensive input validation** using Zod (see [docs/VALIDATION.md](./docs/VALIDATION.md))
- Prisma ORM (SQLite by default; Postgres optional)
- Next.js App Router web UI (optional)
- NextAuth for sign-in (GitHub/Google to start), Prisma adapter

## Security

This project implements comprehensive security measures across smart contracts and API:

### Smart Contract Security
- ✅ Automated security analysis completed (Slither)
- ✅ No critical or high severity vulnerabilities found
- ✅ Comprehensive access control with `onlyCreator` modifier
- ✅ No reentrancy risks (no external calls)
- ✅ Integer overflow protection (Solidity 0.8+)
- 📋 Professional audit planned before mainnet launch

See: [Smart Contract Audit Report](./docs/SMART_CONTRACT_AUDIT.md) | [Security Policy](./SECURITY_POLICY.md)

### API Security
- ✅ Comprehensive input validation and sanitization
- ✅ XSS (Cross-Site Scripting) prevention
- ✅ SQL injection protection via Prisma ORM
- ✅ Command injection prevention
- ✅ Path traversal protection
- ✅ File upload security with size limits and type restrictions
- ✅ Rate limiting (when configured with Redis)

See: [Input Validation Documentation](./docs/VALIDATION.md) | [Security Implementation Summary](./SECURITY_IMPLEMENTATION_SUMMARY.md)

### Reporting Security Issues

We take security seriously. If you discover a vulnerability, please report it responsibly:
- **Email**: security@subculture.io (or use GitHub Security Advisory)
- **DO NOT** open public issues for security vulnerabilities
- See our [Security Policy](./SECURITY_POLICY.md) for details and potential rewards

## Code Quality

This project uses ESLint and Prettier to maintain consistent code style and catch common issues:

- **ESLint**: Configured for both Node.js/Hardhat scripts (TypeScript) and Next.js app
- **Prettier**: Shared formatting config across the monorepo

### Linting & Formatting

```bash
# Run linters across the entire monorepo
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Format all code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

For the web package specifically:

```bash
cd web
npm run lint        # ESLint for Next.js app
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

Configuration files:
- Root ESLint: `.eslintrc.json` (TypeScript + Node.js)
- Web ESLint: `web/.eslintrc.json` (Next.js)
- Prettier: `.prettierrc.json` (shared)

## Continuous Integration

This project uses GitHub Actions to ensure code quality and prevent regressions. The CI workflow runs automatically on pull requests and pushes to the main branch.

### CI Workflow

The workflow includes two parallel jobs:

1. **Backend Job**: 
   - Installs dependencies
   - Runs ESLint on root package
   - Checks code formatting with Prettier
   - Compiles Solidity contracts with Hardhat
   - Runs all backend tests

2. **Web Job**:
   - Installs dependencies for both root and web packages
   - Runs ESLint on Next.js app
   - Checks code formatting
   - Builds the Next.js application

View the [CI workflow configuration](.github/workflows/ci.yml) and [workflow runs](https://github.com/subculture-collective/internet-id/actions/workflows/ci.yml).

**Note**: This CI workflow is part of the project roadmap to guard against regressions (see [#10](https://github.com/subculture-collective/internet-id/issues/10)).

## Setup

1. Install deps
2. Configure `.env` (see `.env.example`):
   - `PRIVATE_KEY` of the deployer/creator account
   - `RPC_URL` for Base Sepolia (or your preferred network)
   - `IPFS_API_URL` and optional `IPFS_PROJECT_ID`/`IPFS_PROJECT_SECRET` for IPFS uploads

- Optional: `API_KEY` to require `x-api-key` on sensitive endpoints
- Database: by default uses SQLite via `DATABASE_URL=file:./dev.db`. For Postgres, see below.

### Web app env

If you plan to use the included web UI (`web/`), set:

- `NEXT_PUBLIC_API_BASE` – base URL for the Express API (e.g., `http://localhost:3001`)
- `NEXT_PUBLIC_API_KEY` – if your API enforces `x-api-key`
- `NEXT_PUBLIC_SITE_BASE` – the canonical origin for generating share links/badges (e.g., `https://yourdomain.com`). Falls back to `window.location.origin`.
- Auth providers (when using sign-in): set provider secrets in `web/.env.local`
  - `GITHUB_ID`, `GITHUB_SECRET`
  - `GOOGLE_ID`, `GOOGLE_SECRET`
  - `NEXTAUTH_URL` (e.g., `http://localhost:3000`)
  - `NEXTAUTH_SECRET` (generate a random string)

## Scripts

- `build` – compile contracts
- `deploy:base-sepolia` – deploy `ContentRegistry` to Base Sepolia
- `register` – hash a file and register its hash + manifest URI on-chain
  - `RPC_URL` for Base Sepolia (or your preferred network). For local, you can use `LOCAL_RPC_URL=http://127.0.0.1:8545`.
  - For IPFS uploads: `IPFS_API_URL` and optional `IPFS_PROJECT_ID`/`IPFS_PROJECT_SECRET`
- `verify` – verify a file against its manifest and on-chain registry
- `bind:youtube` – bind a YouTube videoId to a previously registered master file
- `verify:youtube` – verify a YouTube URL/ID via on-chain binding + manifest
- `start:api` – start the Express API server (default port 3001)
- `lint` – run ESLint on both root and web packages
- `lint:fix` – automatically fix ESLint issues where possible
- `format` – format all code with Prettier
- `format:check` – check if code is formatted correctly
- Web: from `web/` workspace
  - `npm run dev` – start Next.js dev server on :3000
  - `npm run build && npm start` – production build/start
  - `npm run prisma:generate` – generate Prisma Client for web (uses root schema)
  - `npm run lint` – run ESLint on web package
  - `npm run lint:fix` – automatically fix ESLint issues in web package
  - `npm run format` – format web code with Prettier

## Quickstart

1. Compile and deploy

```
npm i
npx hardhat compile
npx hardhat run --network baseSepolia scripts/deploy.ts
```

Local node option (no faucets needed)

```
# Terminal A: start local node (prefunded accounts)
npm run node

# Terminal B: deploy locally
npm run deploy:local
```

2. Upload your content and manifest

```

## IPFS providers

Set one of the following in `.env` before uploading. By default, the uploader tries providers in this order and falls back on failures: Web3.Storage → Pinata → Infura. You can also run a local IPFS node.

- Infura IPFS: `IPFS_API_URL`, `IPFS_PROJECT_ID`, `IPFS_PROJECT_SECRET`
- Web3.Storage: `WEB3_STORAGE_TOKEN`
- Pinata: `PINATA_JWT`
 - Local IPFS node: `IPFS_PROVIDER=local` and (optionally) `IPFS_API_URL=http://127.0.0.1:5001`
  - Note: If both Web3.Storage and Pinata are set, Web3.Storage is attempted first. 5xx errors automatically trigger fallback.

Force a specific provider (optional)

- Set `IPFS_PROVIDER=web3storage|pinata|infura` in `.env` to force the uploader to use one provider only (no fallback). Helpful while debugging credentials.
 - For local node usage, set `IPFS_PROVIDER=local`.

Troubleshooting

- 401 Unauthorized (Infura): Ensure you created an IPFS project and used those credentials. Ethereum RPC keys won’t work for IPFS. Check `IPFS_PROJECT_ID` and `IPFS_PROJECT_SECRET`.
- 503/5xx (Web3.Storage/Pinata): Temporary outage or maintenance. Either wait, or set `IPFS_PROVIDER` to try another provider.
- Slow or timeouts: The uploader retries with exponential backoff. You can re-run the command; CIDs are content-addressed and idempotent across providers.

Local IPFS quickstart (optional)

If you prefer not to use third-party providers, you can run a local Kubo node:

1. Install IPFS (Kubo) from https://github.com/ipfs/kubo
2. Initialize and start the daemon:

```

ipfs init
ipfs daemon

```

3. In `.env`, set:

```

IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001

```

4. Upload with the same script; it will hit your local node.

Upload your content and note the CID

```

npm run upload:ipfs -- ./path/to/file

# Make manifest.json (safer: use PRIVATE_KEY from .env)

npm run manifest -- ./path/to/file ipfs://<CID>

# Alternatively (less secure; your key appears in shell history):

npm run manifest -- ./path/to/file ipfs://<CID> <PRIVATE_KEY>

# Optionally upload manifest.json too

npm run upload:ipfs -- ./manifest.json

```

3. Anchor on-chain

```

# Use the manifest URI (e.g., ipfs://<manifestCID>) and deployed address

npm run register -- ./path/to/file ipfs://<manifestCID> 0xYourRegistryAddress

```

4. Verify a file

```

npm run verify -- ./path/to/file ipfs://<manifestCID> 0xYourRegistryAddress

```

5. Generate a portable proof bundle (optional)

```

npm run proof -- ./path/to/file ipfs://<manifestCID> 0xYourRegistryAddress

```

This writes `proof.json` with the file hash, manifest details, recovered signer, on-chain entry, and the registration tx (best effort). You can share this alongside your content.

## Web UI (optional)

The Next.js app in `web/` provides end-to-end flows:

- Upload to IPFS
- One-shot: Upload → manifest → register (can also bind links)
- Manifest creation
- Register on-chain
- Verify and Proof generation
- Bind platform links (single or batch)
- Browse registered contents (with inline verify and Share block)
- Account: Sign in, register, and link platform identities (profile)

Run locally:

```

cd web
npm i
npm run dev

```

Set `NEXT_PUBLIC_API_BASE` to the API origin (default `http://localhost:3001`).

### Privacy by default

The One‑shot flow does not upload the video by default. It computes the hash locally, builds a manifest, uploads the manifest, and registers on-chain. You can opt-in to upload the video to IPFS via a checkbox. The manifest’s `content_uri` may be omitted when not uploading, preserving privacy while still enabling provenance.

### Public Verify page

Viewers can verify a platform link without downloading your master file. The web app exposes a public Verify page at `/verify` and backend endpoints to resolve bindings:

- `GET /api/resolve` – map a URL or `platform+platformId` to the on-chain binding
- `GET /api/public-verify` – resolve binding and return manifest summary

### Sharing and badges

Each registered content gets a shareable badge and QR codes. In the UI, the Share block provides:

- Badge image (SVG): `/api/badge/[hash]?theme=dark|light&w=120..640`
- QR code PNG: `/api/qr?url=<encoded_share_url>`
- Share link to the public Verify page: `/verify?platform=...&platformId=...`
- Embed HTML snippet: `<a href="..."><img src="/api/badge/[hash]" /></a>`
- Copy All button: copies a bundle of badge URL, per-link share URLs, QR URLs, and embed HTML

Tip: Set `NEXT_PUBLIC_SITE_BASE` so badges/links use your canonical host when sharing.

### Verifying account ownership via OAuth

To confirm a creator controls a given platform account, use OAuth sign-in and link their provider account(s) to their user profile. Start with GitHub/Google for baseline auth, and add platform-specific providers as available (e.g., X/Twitter, YouTube via Google scopes, etc.). When a user binds a platform URL/ID, you can check their linked Accounts in the database to enforce ownership if desired.

## API server

- Start the API: `npm run start:api`
- If `API_KEY` is set in `.env`, the following endpoints require header `x-api-key: $API_KEY`:
  - POST /api/upload
  - POST /api/manifest
  - POST /api/register
  - POST /api/bind

Other endpoints like /api/verify and /api/proof are public by default.

When calling from the Next.js UI or curl, include the header if enabled:

```

curl -H "x-api-key: $API_KEY" -F file=@./video.mp4 \
 -F registryAddress=0x... -F manifestURI=ipfs://... \
 http://localhost:3001/api/register

```

## Database

By default, the project uses a local SQLite file for easy setup.

1) Generate Prisma client and apply migrations:

```

npm run db:generate
npm run db:migrate

```

2) Inspect data (optional):

```

npm run db:studio

```

### Prisma Schema - Single Source of Truth

⚠️ **Important**: The repository uses a **single Prisma schema** at `prisma/schema.prisma`.

This schema generates two separate Prisma Clients:
- **Root client** (for API/scripts): `./node_modules/@prisma/client`
- **Web client** (for Next.js): `../web/node_modules/.prisma/client`

**Never create duplicate schemas** like `web/prisma/schema.prisma`. The single schema ensures:
- No schema drift between API and web
- Single migration history
- One place to update models

See `prisma/README.md` for detailed documentation.

### Database Performance & Indexing

The database schema includes comprehensive indexes for optimal query performance:
- **17 indexes** across all tables prevent full table scans
- **Composite indexes** optimize common multi-column queries
- **Foreign key indexes** ensure fast JOINs
- Performance target: Sub-100ms queries for 100k+ records

To verify indexes after migration:
```bash
npm run db:verify-indexes
```

See detailed documentation:
- [Database Indexing Strategy](docs/DATABASE_INDEXING_STRATEGY.md)
- [Query Optimization Examples](docs/QUERY_OPTIMIZATION_EXAMPLES.md)
- [Optimization Summary](docs/DATABASE_OPTIMIZATION_SUMMARY.md)

### Optional: Postgres via Docker

If you prefer Postgres, a `docker-compose.yml` is included.

1) Start Postgres:

```

docker compose up -d

```

2) In `.env`, set `DATABASE_URL` to a Postgres URL (see `.env.example`).

3) Re-run Prisma generate/migrate so the client matches the Postgres schema.

If you previously generated SQLite migrations, clear them before switching:

```

rm -rf prisma/migrations/\*
npm run db:migrate

```

### Database Backup and Disaster Recovery

The project includes comprehensive automated backup and disaster recovery capabilities for production deployments:

- **Automated Backups**: Daily full backups and hourly incremental backups via WAL archiving
- **Point-in-Time Recovery (PITR)**: Restore database to any specific timestamp
- **Encrypted Storage**: S3-compatible backup storage with encryption at rest
- **Monitoring & Alerts**: Automated backup verification and health checks
- **Disaster Recovery Runbook**: Tested procedures with RTO/RPO targets

See detailed documentation:
- [Database Backup & Recovery Guide](docs/ops/DATABASE_BACKUP_RECOVERY.md) - Complete setup and usage
- [Disaster Recovery Runbook](docs/ops/DISASTER_RECOVERY_RUNBOOK.md) - Emergency procedures and scenarios
- [Backup Monitoring](docs/ops/BACKUP_MONITORING.md) - Monitoring and alerting configuration
- [Ops Scripts](ops/README.md) - Backup and restore scripts

Quick start:
```bash
# Run manual backup
cd ops/backup
./backup-database.sh full

# Restore from backup
cd ops/restore
./restore-database.sh full

# Verify backups
cd ops/backup
./verify-backup.sh
```

## Verification sketch

- Recompute the file hash (sha256) and compare with `content_hash` in manifest and on-chain `entries[hash]`.
- Verify `signature` in manifest was produced by the creator key.
- Confirm the creator matches the on-chain entry’s `creator`.

## YouTube flow

Because YouTube re-encodes media, the on-platform bytes won’t match your master file hash. Use a binding:

1) Anchor your master file as usual (upload → manifest → register)
2) After uploading to YouTube, get the `videoId` (from the URL)
3) Bind the YouTube video to the master file:

```

npm run bind:youtube -- ./master.mp4 <YouTubeVideoId> 0xRegistry

```

4) Verify a YouTube URL or ID later:

```

npm run verify:youtube -- https://www.youtube.com/watch?v=<YouTubeVideoId> 0xRegistry

```

## Next steps

- Add C2PA manifest embedding for images/video.
- Support Merkle batch anchoring.
- Add selective disclosure/zk proof of “is a real person” VC.

## API reference (summary)

Auth: If `API_KEY` is set, include `x-api-key: $API_KEY` in requests for protected endpoints.

- `GET /api/health` – server status
- `GET /api/network` – returns `chainId`
- `GET /api/registry` – default registry address (if configured)
- `POST /api/upload` – upload file to IPFS (protected)
- `POST /api/manifest` – build and optionally upload manifest (protected)
- `POST /api/register` – register content hash + manifest on-chain (protected)
- `POST /api/bind` – bind a single platform ID (protected)
- `POST /api/bind-many` – bind multiple platform IDs at once (protected)
- `POST /api/verify` – verify a file against manifest + on-chain
- `POST /api/proof` – generate `proof.json`
- `GET /api/contents` – list registered contents
- `GET /api/verifications` – list recent verifications
- `GET /api/resolve` – resolve URL or platform+id to on-chain binding
- `GET /api/public-verify` – public verification summary for a binding
- Web-only:
  - `GET /api/badge/[hash]` – SVG badge with `theme` and `w` (width)
  - `GET /api/qr?url=...` – QR PNG for a share URL
```
