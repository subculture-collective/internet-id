# Using the CLI Tool

The Internet ID Command Line Interface (CLI) provides a powerful way to register and verify content from your terminal.

## 📋 Table of Contents

- [What is the CLI?](#what-is-the-cli)
- [Installation](#installation)
- [Configuration](#configuration)
- [Basic Commands](#basic-commands)
- [Advanced Usage](#advanced-usage)
- [Automation & Scripting](#automation--scripting)
- [Troubleshooting](#troubleshooting)

## What is the CLI?

The CLI tool is perfect for:

- **Power Users**: Terminal enthusiasts who prefer command-line workflows
- **Automation**: Scripting and batch operations
- **CI/CD Integration**: Automated content registration in pipelines
- **Large Files**: No 100MB size limit like web UI
- **Batch Operations**: Register hundreds of files at once
- **Server Environments**: Headless Linux servers

## Installation

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Terminal/command line access

### Install Globally

```bash
npm install -g @internet-id/cli

# Or with yarn
yarn global add @internet-id/cli

# Verify installation
internet-id --version
```

### Install Locally (Project-specific)

```bash
npm install @internet-id/cli

# Use with npx
npx internet-id --version
```

### Build from Source

```bash
git clone https://github.com/subculture-collective/internet-id.git
cd internet-id/cli
npm install
npm run build
npm link

# Now available globally
internet-id --version
```

## Configuration

### Initial Setup

Run the interactive configuration wizard:

```bash
internet-id init
```

This will prompt you for:

1. **Wallet Private Key**
   - Used to sign manifests and transactions
   - Stored securely in local config
   - Never transmitted anywhere except blockchain

2. **RPC URL**
   - Blockchain node endpoint
   - Choose network (Base, Polygon, etc.)
   - Or use default public RPCs

3. **Registry Contract Address**
   - ContentRegistry contract
   - Pre-filled for mainnet networks
   - Or enter custom address

4. **IPFS Provider**
   - Choose: Web3.Storage, Pinata, Infura, or Local
   - Enter API credentials
   - Test connection

5. **API Base URL** (Optional)
   - For additional services
   - Default: https://app.internet-id.io/api

**Example session**:
```bash
$ internet-id init

Welcome to Internet ID CLI!

Let's configure your environment...

? Select network: Base (recommended)
? Enter your wallet private key: [hidden]
? RPC URL (default: https://mainnet.base.org): [press enter]
? Registry contract address (default: 0x...): [press enter]
? Select IPFS provider: Web3.Storage
? Enter Web3.Storage token: eyJhbGc...
? API base URL (optional): [press enter]

✓ Configuration saved to ~/.internet-id/config.json
✓ Testing connection...
✓ Everything looks good!

Ready to register content! Try: internet-id upload ./my-file.mp4
```

### Configuration File

Config stored at `~/.internet-id/config.json`:

```json
{
  "network": "base",
  "rpcUrl": "https://mainnet.base.org",
  "registryAddress": "0x...",
  "privateKey": "encrypted:...",
  "ipfs": {
    "provider": "web3storage",
    "token": "encrypted:..."
  },
  "apiBaseUrl": "https://app.internet-id.io/api"
}
```

**Security**: Private key and tokens are encrypted at rest.

### Manual Configuration

Edit config file directly:

```bash
# Open config
nano ~/.internet-id/config.json

# Or use environment variables
export INTERNET_ID_NETWORK=base
export INTERNET_ID_PRIVATE_KEY=0x...
export INTERNET_ID_RPC_URL=https://...
export INTERNET_ID_REGISTRY_ADDRESS=0x...
```

### View Current Config

```bash
internet-id config show

# Output:
# Network: base
# RPC URL: https://mainnet.base.org
# Registry: 0x1234...5678
# IPFS Provider: web3storage
# API Base URL: https://app.internet-id.io/api
```

### Update Config

```bash
# Change network
internet-id config set network polygon

# Change RPC URL
internet-id config set rpcUrl https://polygon-rpc.com

# Update IPFS token
internet-id config set ipfs.token YOUR_NEW_TOKEN
```

## Basic Commands

### Upload and Register Content

**One command to register** (recommended):

```bash
internet-id upload ./my-video.mp4
```

This:
1. Hashes the file
2. Creates and signs manifest
3. Uploads manifest to IPFS
4. Registers hash on blockchain

**Options**:
```bash
# Also upload file to IPFS (public mode)
internet-id upload ./my-video.mp4 --upload-content

# Add metadata
internet-id upload ./my-video.mp4 \
  --title "My Amazing Video" \
  --description "A groundbreaking work" \
  --tags "video,creative,2025"

# Specify network
internet-id upload ./my-video.mp4 --network polygon

# Privacy mode with metadata
internet-id upload ./my-video.mp4 \
  --title "Private Document" \
  --description "Confidential research" \
  --no-upload-content  # Explicit privacy mode
```

### Verify Content

**Verify a file**:

```bash
internet-id verify ./my-video.mp4
```

**Verify by manifest URI**:

```bash
internet-id verify --manifest-uri ipfs://QmXyz123...
```

**Verify by platform URL**:

```bash
internet-id verify --url https://youtube.com/watch?v=abc123
```

**Output example**:
```
✓ Verification successful!

Content Hash: 9f86d081884c7d659a2feaa0...
Creator: 0x1234567890abcdef...
Registered: 2025-11-02 14:30:00 UTC
Network: Base
Transaction: 0xabcdef1234...

Manifest Details:
  Title: My Amazing Video
  Description: A groundbreaking work
  Tags: video, creative, 2025
  
View on BaseScan: https://basescan.org/tx/0xabcdef...
```

### Bind to Platform

**Bind to YouTube**:

```bash
internet-id bind youtube \
  --file ./my-video.mp4 \
  --video-id abc123xyz
```

**Bind to Twitter**:

```bash
internet-id bind twitter \
  --file ./my-image.jpg \
  --tweet-id 1234567890
```

**Bind to TikTok**:

```bash
internet-id bind tiktok \
  --file ./my-video.mp4 \
  --video-id 9876543210
```

**Bind by content hash** (if already registered):

```bash
internet-id bind youtube \
  --hash 9f86d081884c7d659a2feaa0... \
  --video-id abc123xyz
```

### Generate Proof Bundle

Create portable proof JSON:

```bash
internet-id proof ./my-video.mp4

# Output file: proof.json
```

**Custom output**:

```bash
internet-id proof ./my-video.mp4 --output my-proof.json
```

**Proof JSON contains**:
- Content hash
- Manifest details
- On-chain entry
- Transaction receipt
- Verification instructions

### List Registered Content

```bash
internet-id list

# With filters
internet-id list --creator 0x1234...

# By date range
internet-id list --since 2025-01-01 --until 2025-12-31

# Output to JSON
internet-id list --format json > my-content.json
```

## Advanced Usage

### Batch Operations

**Register entire directory**:

```bash
internet-id batch-upload ./my-videos/
```

**With options**:

```bash
internet-id batch-upload ./my-videos/ \
  --upload-content \
  --tags "batch,2025" \
  --network base \
  --parallel 3  # Upload 3 at a time
```

**From file list**:

```bash
# Create list
cat > files.txt << EOF
/path/to/video1.mp4
/path/to/video2.mp4
/path/to/video3.mp4
EOF

# Batch upload
internet-id batch-upload --from-file files.txt
```

**Batch bind**:

```bash
# Create bindings file
cat > bindings.json << EOF
{
  "file": "./my-video.mp4",
  "bindings": [
    {"platform": "youtube", "id": "abc123"},
    {"platform": "twitter", "id": "456789"},
    {"platform": "tiktok", "id": "xyz890"}
  ]
}
EOF

# Apply bindings
internet-id batch-bind bindings.json
```

### Custom Manifests

**Create manifest without registering**:

```bash
internet-id manifest ./my-video.mp4 \
  --output manifest.json
```

**Register from existing manifest**:

```bash
internet-id register \
  --manifest-file manifest.json \
  --file ./my-video.mp4
```

**Edit and re-sign manifest**:

```bash
# Edit manifest.json (add metadata, etc.)
nano manifest.json

# Re-sign
internet-id manifest resign manifest.json
```

### Watch Directory

**Auto-register new files** (daemon mode):

```bash
internet-id watch ./my-content-folder \
  --interval 60 \
  --upload-content \
  --tags "auto-registered"
```

Monitors directory and registers any new files automatically.

**Use case**: Content creation workflow where you want everything registered immediately.

### Integration with Other Tools

**Pipe to jq for JSON processing**:

```bash
internet-id list --format json | jq '.[] | select(.tags[] == "important")'
```

**Use in shell scripts**:

```bash
#!/bin/bash
for file in ./videos/*.mp4; do
  echo "Registering $file..."
  internet-id upload "$file" --title "$(basename "$file")"
done
```

**CI/CD Integration** (GitHub Actions):

```yaml
name: Register Content

on:
  push:
    paths:
      - 'content/**'

jobs:
  register:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install CLI
        run: npm install -g @internet-id/cli
      
      - name: Configure CLI
        env:
          PRIVATE_KEY: ${{ secrets.INTERNET_ID_PRIVATE_KEY }}
          WEB3_STORAGE_TOKEN: ${{ secrets.WEB3_STORAGE_TOKEN }}
        run: |
          internet-id config set network base
          internet-id config set privateKey $PRIVATE_KEY
          internet-id config set ipfs.token $WEB3_STORAGE_TOKEN
      
      - name: Register new content
        run: |
          internet-id batch-upload ./content/ \
            --tags "ci-registered,$(date +%Y-%m-%d)"
```

### Export and Backup

**Export all content metadata**:

```bash
internet-id export --format json > backup.json
```

**Export with proofs**:

```bash
internet-id export --include-proofs > backup-with-proofs.json
```

**Import from backup**:

```bash
internet-id import backup.json
```

## Automation & Scripting

### Script Examples

**Register all videos in a directory**:

```bash
#!/bin/bash
# register-videos.sh

DIRECTORY="./my-videos"
NETWORK="base"
TAGS="video,batch-$(date +%Y%m%d)"

for file in "$DIRECTORY"/*.mp4; do
  echo "Processing: $file"
  
  internet-id upload "$file" \
    --network "$NETWORK" \
    --title "$(basename "$file" .mp4)" \
    --tags "$TAGS" \
    --upload-content
  
  if [ $? -eq 0 ]; then
    echo "✓ Success: $file"
  else
    echo "✗ Failed: $file"
  fi
done

echo "Done!"
```

**Monitor and auto-bind YouTube uploads**:

```bash
#!/bin/bash
# auto-bind-youtube.sh

# List unbound registered content
internet-id list --unbound --format json | \
  jq -r '.[] | [.hash, .title] | @tsv' | \
  while IFS=$'\t' read -r hash title; do
    echo "Checking: $title"
    
    # Check if video exists on YouTube (custom logic)
    video_id=$(check_youtube_for_title "$title")
    
    if [ -n "$video_id" ]; then
      echo "Found on YouTube: $video_id"
      internet-id bind youtube --hash "$hash" --video-id "$video_id"
    fi
  done
```

**Generate report of all content**:

```bash
#!/bin/bash
# generate-report.sh

internet-id list --format json | \
  jq -r '
    ["Hash", "Title", "Registered", "Platforms"],
    (.[] | [
      .hash[0:16] + "...",
      .metadata.title // "Untitled",
      .timestamp | strftime("%Y-%m-%d"),
      (.bindings | length | tostring)
    ]),
    ["", "", "", ""]
  | @tsv' | \
  column -t -s $'\t' > content-report.txt

cat content-report.txt
```

### Cron Jobs

**Daily backup** (crontab):

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/internet-id export --include-proofs > ~/backups/internet-id-$(date +%Y%m%d).json 2>&1
```

**Hourly directory watch**:

```bash
# Check for new content every hour
0 * * * * cd /path/to/content && /usr/local/bin/internet-id batch-upload . --tags "auto" 2>&1 | logger -t internet-id
```

## Troubleshooting

### Command Not Found

**Problem**: `internet-id: command not found`

**Solutions**:

```bash
# Check if installed
npm list -g @internet-id/cli

# Install if missing
npm install -g @internet-id/cli

# Or add to PATH
export PATH=$PATH:$(npm bin -g)
```

### Configuration Errors

**Problem**: Config file not found or invalid

**Solutions**:

```bash
# Re-initialize
internet-id init --force

# Or manually create
mkdir -p ~/.internet-id
internet-id init
```

### Transaction Failures

**Problem**: Transaction reverts or fails

**Solutions**:

```bash
# Check balance
internet-id balance

# Increase gas limit
internet-id upload ./file.mp4 --gas-limit 100000

# Try different network
internet-id upload ./file.mp4 --network polygon
```

### IPFS Upload Failures

**Problem**: IPFS upload times out or fails

**Solutions**:

```bash
# Try different provider
internet-id config set ipfs.provider pinata
internet-id config set ipfs.token YOUR_PINATA_TOKEN

# Or use local IPFS
internet-id config set ipfs.provider local
internet-id config set ipfs.url http://127.0.0.1:5001
```

### Permission Errors

**Problem**: Cannot write config file

**Solutions**:

```bash
# Check permissions
ls -la ~/.internet-id/

# Fix permissions
chmod 700 ~/.internet-id
chmod 600 ~/.internet-id/config.json
```

## CLI Reference

### Global Options

```bash
--network <name>        Network to use (base, polygon, ethereum, etc.)
--rpc-url <url>         Custom RPC endpoint
--registry <address>    Custom registry contract address
--private-key <key>     Wallet private key (overrides config)
--verbose              Show detailed output
--quiet                Minimal output only
--json                 Output in JSON format
--help                 Show help
--version              Show version
```

### All Commands

```bash
internet-id init                # Interactive configuration
internet-id upload <file>       # Register content
internet-id verify <file|url>   # Verify content
internet-id bind <platform>     # Bind to platform
internet-id proof <file>        # Generate proof bundle
internet-id list                # List registered content
internet-id manifest <file>     # Create manifest
internet-id register            # Register from manifest
internet-id batch-upload <dir>  # Batch register
internet-id batch-bind <file>   # Batch bind platforms
internet-id watch <dir>         # Watch directory
internet-id export              # Export data
internet-id import <file>       # Import data
internet-id config              # Manage configuration
internet-id balance             # Check wallet balance
internet-id help [command]      # Get help
```

### Environment Variables

```bash
INTERNET_ID_NETWORK             Default network
INTERNET_ID_PRIVATE_KEY         Wallet private key
INTERNET_ID_RPC_URL             RPC endpoint
INTERNET_ID_REGISTRY_ADDRESS    Registry contract
INTERNET_ID_IPFS_PROVIDER       IPFS provider
INTERNET_ID_IPFS_TOKEN          IPFS API token
INTERNET_ID_API_BASE_URL        API base URL
```

## Next Steps

- **[Uploading Content](./uploading-content.md)** - Registration details
- **[Platform Bindings](./platform-bindings.md)** - Binding guide
- **[Managing Content](./managing-content.md)** - Organization tips
- **[FAQ](./faq.md)** - Common questions

## Get Help

CLI questions?

- **CLI Help**: `internet-id help`
- **Command Help**: `internet-id help upload`
- **GitHub Issues**: Report bugs
- **Discord**: Community support
- **Email**: support@internet-id.io

Happy registering! 🚀
