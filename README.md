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
- IPFS uploads via ipfs-http-client

## Setup

1. Install deps
2. Configure `.env` (see `.env.example`):
   - `PRIVATE_KEY` of the deployer/creator account
   - `RPC_URL` for Base Sepolia (or your preferred network)
   - `IPFS_API_URL` and optional `IPFS_PROJECT_ID`/`IPFS_PROJECT_SECRET` for IPFS uploads

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

npx hardhat run --network baseSepolia scripts/deploy.ts

```

Local node option (no faucets needed)

```

# Terminal A: start local node (prefunded accounts)

npm run node

# Terminal B: deploy locally

npm run deploy:local
npm i
npx hardhat compile
npx hardhat run --network baseSepolia scripts/deploy.ts

```

2. Upload your content and manifest

```

# Upload your content file and note the CID

npm run upload:ipfs -- ./path/to/file

# Make manifest.json (you can also upload it and use the ipfs:// URL)

npm run manifest -- ./path/to/file ipfs://<CID> $PRIVATE_KEY

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
