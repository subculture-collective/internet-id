# Internet-ID: Human-Created Content Anchoring

This repo scaffolds a minimal on-chain content provenance flow:

- A creator hashes their content and signs a manifest.
- The manifest and content are stored off-chain (e.g., IPFS/Web3.Storage).
- A small registry contract on an L2 anchors the content hash and a URI to the manifest.
- Verifiers can recompute the hash, check the signature, and confirm the on-chain anchor.

> Note: This proves provenance, not truth. It helps distinguish opted-in human-created content from anonymous deepfakes.

## Stack

- Solidity (ContentRegistry)
- Hardhat + TypeScript
- Ethers v6
- IPFS uploads via Infura, Web3.Storage, or Pinata
- Express API with optional API key protection
- Prisma ORM (SQLite by default; Postgres optional)

## Setup

1. Install deps
2. Configure `.env` (see `.env.example`):
   - `PRIVATE_KEY` of the deployer/creator account
   - `RPC_URL` for Base Sepolia (or your preferred network)
   - `IPFS_API_URL` and optional `IPFS_PROJECT_ID`/`IPFS_PROJECT_SECRET` for IPFS uploads

- Optional: `API_KEY` to require `x-api-key` on sensitive endpoints
- Database: by default uses SQLite via `DATABASE_URL=file:./dev.db`. For Postgres, see below.

## Scripts

- `build` – compile contracts
- `deploy:base-sepolia` – deploy `ContentRegistry` to Base Sepolia
- `register` – hash a file and register its hash + manifest URI on-chain
  - `RPC_URL` for Base Sepolia (or your preferred network). For local, you can use `LOCAL_RPC_URL=http://127.0.0.1:8545`.
  - For IPFS uploads: `IPFS_API_URL` and optional `IPFS_PROJECT_ID`/`IPFS_PROJECT_SECRET`
- `verify` – verify a file against its manifest and on-chain registry
- `bind:youtube` – bind a YouTube videoId to a previously registered master file
- `verify:youtube` – verify a YouTube URL/ID via on-chain binding + manifest

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
```
