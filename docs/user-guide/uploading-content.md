# Uploading and Registering Content

This comprehensive guide covers everything you need to know about registering your content with Internet ID.

## 📋 Table of Contents

- [Understanding Registration](#understanding-registration)
- [Supported File Types](#supported-file-types)
- [Registration Methods](#registration-methods)
- [Privacy Options](#privacy-options)
- [Step-by-Step Guides](#step-by-step-guides)
- [Best Practices](#best-practices)
- [Advanced Options](#advanced-options)

## Understanding Registration

When you register content with Internet ID, three things happen:

1. **Hash Generation**: A unique fingerprint (SHA-256 hash) is created from your file
2. **Manifest Creation**: A signed manifest proves you created it
3. **Blockchain Anchoring**: The hash is recorded on a public blockchain

```
Your File → Hash (fingerprint) → Signed Manifest → Blockchain Registry
```

This creates permanent, verifiable proof of ownership.

## Supported File Types

Internet ID supports virtually any file type:

### Media Files
- **Videos**: MP4, MOV, AVI, MKV, WEBM, FLV, WMV
- **Images**: JPG, JPEG, PNG, GIF, SVG, WEBP, BMP, TIFF
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A

### Documents
- **Text**: TXT, MD, RTF
- **Documents**: PDF, DOC, DOCX
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX

### Code & Data
- **Code**: JS, TS, PY, JAVA, C, CPP, GO, RUST
- **Data**: JSON, XML, YAML, SQL
- **Archives**: ZIP, TAR, GZ

### Size Limits
- **Web Upload**: 100 MB max
- **CLI Upload**: No limit (but IPFS may have practical limits)
- **Local Hash Only**: No limit (file stays on your device)

> 💡 **Tip**: For files over 100MB, use the [CLI tool](./cli-usage.md) for better performance.

## Registration Methods

Internet ID offers three ways to register content:

### 1. One-Shot Registration (Recommended)

**Best for**: Quick, single-file registration

**What it does**:
- Uploads manifest to IPFS
- Registers hash on blockchain
- Optionally uploads file to IPFS
- Optionally binds platform link

**Pros**:
- Simplest method (one click)
- Fastest workflow
- Great for beginners

**Cons**:
- One file at a time
- Less control over individual steps

**How to use**: See [Quick Start Tutorial](./quick-start.md)

### 2. Step-by-Step Registration

**Best for**: Fine-grained control, understanding the process

**What it does**:
1. **Upload File** (optional) → Get IPFS CID
2. **Create Manifest** → Generate and sign manifest
3. **Upload Manifest** → Store manifest on IPFS
4. **Register On-Chain** → Anchor hash to blockchain

**Pros**:
- Full control over each step
- Can reuse manifests
- Educational (see how it works)

**Cons**:
- More steps
- Takes longer

**How to use**: See [Step-by-Step Guide](#step-by-step-registration-guide) below

### 3. CLI Registration

**Best for**: Automation, large files, batch operations

**What it does**: Same as One-Shot but via command line

**Pros**:
- Scriptable/automatable
- No file size limits
- Batch processing
- CI/CD integration

**Cons**:
- Requires terminal/command-line knowledge
- More initial setup

**How to use**: See [CLI Usage Guide](./cli-usage.md)

## Privacy Options

Internet ID gives you complete control over privacy:

### Privacy Mode (Default) 🔒

**What's stored**:
- ✅ Content hash (fingerprint)
- ✅ Manifest (metadata + signature)
- ❌ Original file (stays on your device)

**Who can see what**:
- Anyone can see the hash exists
- Anyone can see when it was registered
- Nobody can download your original file
- Nobody can see file contents

**Best for**:
- Unreleased content
- Sensitive material
- Personal files
- Anything you want to keep private

**How to enable**:
```
☐ Upload file to IPFS
```
Leave this checkbox **unchecked** during registration.

### Public Mode 🌐

**What's stored**:
- ✅ Content hash
- ✅ Manifest
- ✅ Original file on IPFS

**Who can see what**:
- Anyone can download the original file
- File is publicly accessible
- Permanent (can't be deleted from IPFS)

**Best for**:
- Content you want to distribute
- Public releases
- Open-source projects
- Marketing materials

**How to enable**:
```
☑ Upload file to IPFS
```
Check this checkbox during registration.

> ⚠️ **Warning**: Once uploaded to IPFS, files cannot be deleted. Make sure you want to make it public!

### Hybrid Approach

You can combine privacy and public modes:

1. **Register privately first**: Don't upload original
2. **Get feedback/approval**: Share hash and manifest
3. **Upload later if needed**: Upload to IPFS after verification
4. **Bind to public posts**: Link to platform versions

This lets you prove ownership before public release!

## Step-by-Step Guides

### One-Shot Registration Guide

Already covered in [Quick Start Tutorial](./quick-start.md)! This is the recommended method for most users.

### Step-by-Step Registration Guide

For more control over the process:

#### Step 1: Upload File to IPFS (Optional)

1. Navigate to **Register Content** → **Step-by-Step** tab
2. Go to **Step 1: Upload File**
3. Click **"Choose File"** and select your content
4. Click **"Upload to IPFS"**
5. Wait for upload (may take 1-5 minutes for large files)
6. Copy the **IPFS CID** (e.g., `QmXyz123...`)

**Skip this step** if you want privacy mode!

#### Step 2: Create and Sign Manifest

1. Go to **Step 2: Create Manifest**
2. If you uploaded file, the CID will auto-fill
3. Fill in optional metadata:
   - **Title**: Name of your content
   - **Description**: What is this content?
   - **Tags**: Keywords for searching
   - **License**: Rights (e.g., "All Rights Reserved", "CC-BY")
4. Click **"Generate Manifest"**
5. Your wallet will prompt you to **sign the manifest**
6. Click **"Sign"** (no gas fees for signing!)
7. Manifest will be generated with your signature

#### Step 3: Upload Manifest

1. Go to **Step 3: Upload Manifest**
2. The manifest from Step 2 will auto-load
3. Click **"Upload Manifest to IPFS"**
4. Wait for upload (usually < 30 seconds)
5. Copy the **Manifest CID** (e.g., `QmAbc456...`)

#### Step 4: Register On-Chain

1. Go to **Step 4: Register**
2. The manifest CID will auto-fill
3. Review summary:
   - Content hash
   - Manifest URI (ipfs://QmAbc456...)
   - Network
   - Estimated gas fee
4. Click **"Register"**
5. Confirm transaction in MetaMask
6. Wait for confirmation (5-15 seconds)
7. Success! View your content in Dashboard

### CLI Registration

For command-line registration:

```bash
# Install CLI
npm install -g @internet-id/cli

# Configure
internet-id init

# Register (privacy mode - default)
internet-id upload ./my-video.mp4

# Register (public mode)
internet-id upload ./my-video.mp4 --upload-content

# Register with metadata
internet-id upload ./my-video.mp4 \
  --title "My Amazing Video" \
  --description "A groundbreaking work" \
  --tags "video,creative"
```

See [CLI Usage Guide](./cli-usage.md) for complete documentation.

## Best Practices

### File Preparation

**Before Registration:**
1. ✅ Finalize your content (edits change the hash!)
2. ✅ Choose high quality (don't compress excessively)
3. ✅ Use descriptive filenames
4. ✅ Remove sensitive metadata if needed (EXIF data, etc.)
5. ✅ Test with a small file first

**Metadata Tips:**
- Use clear, descriptive titles
- Add comprehensive descriptions
- Include relevant tags for discoverability
- Specify license/rights
- Add contact information if appropriate

### When to Register

**Good Times to Register:**
- ✅ Before public release (prove you created it first)
- ✅ At creation time (best provenance)
- ✅ Before sharing drafts (protect early versions)
- ✅ For important milestones (album releases, film premieres)

**Can Still Register Later:**
- After posting online (better late than never!)
- For older content (backdate your library)
- When you discover deepfakes/impersonation

### Choosing a Network

**Base (Recommended)**:
- Very cheap (~$0.01)
- Fast (2-5 seconds)
- Growing adoption
- Good for most users

**Polygon**:
- Also very cheap (~$0.01)
- Fast (2-5 seconds)
- More established
- Good alternative to Base

**Ethereum**:
- Most secure
- Most expensive ($0.50-5.00)
- Slower (12-15 seconds)
- Only for very important content

**Testnet** (Practice):
- Free test tokens
- Same process as mainnet
- No real value
- Great for learning

See [Network Comparison](./getting-started.md#step-2-choose-your-network) for details.

### Security Best Practices

**Protect Your Wallet:**
- Store recovery phrase securely (paper, not digital)
- Never share your private key
- Use strong passwords
- Enable wallet lock
- Be cautious of phishing

**Transaction Safety:**
- Always review gas fees before confirming
- Check you're on the correct network
- Verify contract address (if shown)
- Don't approve suspicious transactions

**Content Safety:**
- Consider privacy before uploading to IPFS
- Remove personal information from files
- Watermark images if concerned about theft
- Register before public release when possible

## Advanced Options

### Custom Metadata Fields

You can add custom metadata to your manifest:

```json
{
  "content_hash": "9f86d081...",
  "metadata": {
    "title": "My Content",
    "description": "...",
    "license": "CC-BY-4.0",
    "tags": ["video", "tutorial"],
    "custom_field": "custom_value"  // Add your own!
  }
}
```

Custom fields are preserved and included in verification.

### Batch Registration

Register multiple files at once:

**Web UI:**
1. Go to **Register Content** → **Batch Registration**
2. Select multiple files
3. Configure shared settings
4. Review each file's details
5. Register all at once (pays gas for each)

**CLI:**
```bash
# Register entire directory
internet-id batch-upload ./my-content-folder

# With custom settings
internet-id batch-upload ./videos \
  --network base \
  --privacy-mode
```

See [Managing Content - Batch Operations](./managing-content.md#batch-operations) for more.

### Using Custom IPFS Providers

By default, Internet ID uses public IPFS gateways. You can specify your own:

**In Web UI:**
1. Settings → IPFS Configuration
2. Choose: Web3.Storage, Pinata, Infura, or Local
3. Add API credentials
4. Test connection

**In CLI:**
```bash
internet-id config set ipfs.provider web3storage
internet-id config set ipfs.token YOUR_TOKEN
```

See [Advanced Configuration](./managing-content.md#advanced-configuration).

### Multi-Network Registration

Register the same content on multiple blockchains for redundancy:

**Why?**
- Broader reach
- Network redundancy
- Different audiences prefer different chains

**How:**
1. Register on first network (e.g., Base)
2. Switch network in wallet
3. Register same file again on second network (e.g., Polygon)
4. Each registration is independent

**Cost:** Gas fees on each network (2x $0.01 = $0.02 total)

## Common Workflows

### Workflow 1: Pre-Release Protection

```
1. Create content (video, music, art)
2. Register privately (privacy mode)
3. Share hash with stakeholders for verification
4. Release publicly when ready
5. Bind to platform links
6. Share verification badge
```

### Workflow 2: Public Content Distribution

```
1. Create content
2. Register publicly (upload to IPFS)
3. Register on blockchain
4. Share IPFS link + verification
5. Post on platforms
6. Bind platform links
```

### Workflow 3: Backfill Existing Content

```
1. Gather existing content from platforms
2. Download original files if available
3. Register all originals (batch)
4. Bind to existing platform URLs
5. Update descriptions with verification links
```

## What Happens After Registration?

After successful registration, you have:

1. **Blockchain Record**: Permanent proof on-chain
2. **Content Hash**: Unique fingerprint of your file
3. **Manifest**: Signed proof of creation
4. **Transaction Hash**: Receipt of registration
5. **Verification Badge**: Shareable proof
6. **Public Verification Page**: Anyone can check

You can now:
- Share your verification badge
- Bind to platform links
- Verify content anytime
- Prove you created it first

## Troubleshooting Registration

### Upload Fails

**File too large:**
- Use CLI for files over 100MB
- Compress file (but hash will change!)
- Use privacy mode (don't upload file)

**Network timeout:**
- Check internet connection
- Try again (uploads are resumable on CLI)
- Switch IPFS provider

**IPFS error:**
- Check IPFS provider status
- Try different provider
- Use local IPFS node

### Manifest Creation Fails

**Wallet won't sign:**
- Make sure wallet is unlocked
- Check you're on the correct account
- Try refreshing the page
- Update wallet extension

**Invalid metadata:**
- Check special characters in title/description
- Ensure proper JSON format (if custom fields)
- Try removing custom metadata

### Registration Transaction Fails

**Insufficient funds:**
- Need more ETH/MATIC for gas
- Check you're on the right network
- Add a small buffer ($0.10 extra)

**Transaction stuck:**
- Increase gas price in wallet
- Wait (can take minutes during congestion)
- Cancel and retry

**Wrong network:**
- Switch wallet to match app network
- Refresh the page after switching

See [Troubleshooting Guide](./troubleshooting.md) for more solutions.

## Next Steps

Now that you know how to register content:

- **[Platform Bindings](./platform-bindings.md)** - Connect to YouTube, Twitter, etc.
- **[Verifying Content](./verifying-content.md)** - Check ownership proof
- **[Managing Content](./managing-content.md)** - Update and organize
- **[Gas Fees Guide](./gas-fees.md)** - Minimize costs

## Get Help

Questions about registration?

- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting](./troubleshooting.md)** - Technical issues
- **Discord** - Community support
- **Email** - support@internet-id.io
