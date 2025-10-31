# Internet ID CLI

Command-line tool for Internet ID content registration and verification.

## Installation

### Global Installation (npm)

```bash
npm install -g @internet-id/cli
```

### Local Installation (from source)

```bash
cd cli
npm install
npm run build
npm link
```

## Quick Start

### 1. Initialize Configuration

Configure your credentials and settings:

```bash
internet-id init
```

You'll be prompted for:

- **API URL**: Internet ID API endpoint (default: http://localhost:3001)
- **API Key**: Optional API key for protected endpoints
- **Private Key**: Your Ethereum private key for signing content (required)
- **RPC URL**: Blockchain RPC endpoint (default: https://sepolia.base.org)
- **Registry Address**: ContentRegistry contract address
- **IPFS Provider**: Choose from web3storage, pinata, infura, or local
- **Provider Credentials**: Token/credentials for your chosen IPFS provider

Configuration is saved to `~/.internet-id.json`

### 2. Upload and Register Content

Upload a file, create a manifest, and register it on-chain:

```bash
# Privacy mode (default): Only manifest is uploaded to IPFS
internet-id upload ./my-video.mp4

# Upload content to IPFS as well
internet-id upload ./my-video.mp4 --upload-content
```

**Privacy Mode (Default)**:

- Computes content hash locally
- Creates and uploads manifest to IPFS
- Registers on-chain with manifest URI
- Original content stays private on your machine

**With Content Upload**:

- Uploads content to IPFS
- Creates manifest with content URI
- Uploads manifest to IPFS
- Registers everything on-chain

### 3. Verify Content

Verify content against manifest and on-chain registry:

```bash
# Verify by file path (looks up on-chain entry)
internet-id verify ./my-video.mp4

# Verify by manifest URI
internet-id verify ipfs://QmXxx...
```

Verification checks:

- ✓ Content hash matches manifest
- ✓ Signature is valid
- ✓ On-chain entry exists and matches
- ✓ Creator address is consistent

## Command Reference

### `internet-id init`

Configure credentials and settings interactively.

**Example:**

```bash
internet-id init
```

### `internet-id upload <file>`

Upload and register content on-chain.

**Arguments:**

- `<file>` - Path to file to upload

**Options:**

- `-u, --upload-content` - Upload content to IPFS (default: privacy mode)
- `-k, --private-key <key>` - Private key for signing (overrides config)
- `-r, --rpc-url <url>` - RPC URL (overrides config)
- `-g, --registry <address>` - Registry contract address (overrides config)
- `-p, --ipfs-provider <provider>` - IPFS provider (web3storage, pinata, infura, local)

**Examples:**

```bash
# Privacy mode (default)
internet-id upload ./video.mp4

# Upload content to IPFS
internet-id upload ./video.mp4 --upload-content

# Override registry address
internet-id upload ./video.mp4 --registry 0x123...

# Use different IPFS provider
internet-id upload ./video.mp4 --ipfs-provider pinata
```

### `internet-id verify <input>`

Verify content against manifest and on-chain registry.

**Arguments:**

- `<input>` - File path or manifest URI

**Options:**

- `-r, --rpc-url <url>` - RPC URL (overrides config)
- `-g, --registry <address>` - Registry contract address (overrides config)

**Examples:**

```bash
# Verify by file path
internet-id verify ./video.mp4

# Verify by manifest URI
internet-id verify ipfs://QmXxx...

# Override RPC URL
internet-id verify ./video.mp4 --rpc-url https://mainnet.base.org
```

## Configuration File

Configuration is stored in `~/.internet-id.json`:

```json
{
  "apiUrl": "http://localhost:3001",
  "apiKey": "optional-api-key",
  "privateKey": "your-private-key",
  "rpcUrl": "https://sepolia.base.org",
  "registryAddress": "0x123...",
  "ipfsProvider": "web3storage",
  "web3StorageToken": "your-token"
}
```

You can manually edit this file or reconfigure with `internet-id init`.

## IPFS Providers

### Web3.Storage

```bash
# During init, select 'web3storage' and provide your token
# Get token from: https://web3.storage
```

### Pinata

```bash
# During init, select 'pinata' and provide your JWT
# Get JWT from: https://pinata.cloud
```

### Infura

```bash
# During init, select 'infura' and provide:
# - Project ID
# - Project Secret
# Get credentials from: https://infura.io
```

### Local IPFS Node

```bash
# Start local IPFS daemon first:
ipfs daemon

# During init, select 'local' and provide API URL (default: http://127.0.0.1:5001)
```

## Multi-Chain Support

The CLI supports multiple EVM-compatible chains:

**Testnets:**

- Base Sepolia: `https://sepolia.base.org`
- Ethereum Sepolia: `https://ethereum-sepolia-rpc.publicnode.com`
- Polygon Amoy: `https://rpc-amoy.polygon.technology`

**Mainnets:**

- Base: `https://mainnet.base.org`
- Ethereum: `https://eth.llamarpc.com`
- Polygon: `https://polygon-rpc.com`

Configure the RPC URL during `init` or override with `--rpc-url`.

## Troubleshooting

### "Private key not configured"

Run `internet-id init` to configure your credentials.

### "Registry address not configured"

You need to deploy the ContentRegistry contract and configure its address with `internet-id init`.

### "IPFS upload failed"

Check your IPFS provider credentials. You can reconfigure with `internet-id init`.

### "Transaction failed"

- Ensure you have sufficient gas tokens (ETH, MATIC, etc.)
- Verify the registry address is correct
- Check the RPC URL is accessible

## Security

- Never commit or share your `~/.internet-id.json` file
- Keep your private key secure
- Consider using a dedicated wallet for content registration
- Use testnets for testing before mainnet deployments

## Examples

### Complete Workflow

```bash
# 1. Configure (one time)
internet-id init

# 2. Upload and register content
internet-id upload ./my-creation.jpg --upload-content

# 3. Verify it worked
internet-id verify ./my-creation.jpg

# 4. Share the manifest URI with others
# They can verify without downloading your original file
internet-id verify ipfs://QmYourManifestCID...
```

### Automation Script

```bash
#!/bin/bash
# Batch register multiple files

for file in *.jpg; do
  echo "Registering $file..."
  internet-id upload "$file"
done
```

## Related

- [Internet ID SDK](../sdk/typescript/README.md) - TypeScript/JavaScript SDK
- [Internet ID API](../README.md#api-reference-summary) - REST API documentation
- [Web App](../web/README.md) - Web interface

## License

MIT
