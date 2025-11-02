# Verifying Content

Learn how to verify content ownership using Internet ID.

## 📋 Table of Contents

- [What is Verification?](#what-is-verification)
- [Quick Verification Methods](#quick-verification-methods)
- [Understanding Verification Results](#understanding-verification-results)
- [Using the Browser Extension](#using-the-browser-extension)
- [Manual Verification](#manual-verification)
- [Verifying Platform Content](#verifying-platform-content)
- [Common Verification Scenarios](#common-verification-scenarios)

## What is Verification?

Verification is the process of checking whether content matches its registered proof on the blockchain. When you verify content, Internet ID confirms:

1. ✅ The content hash matches what was registered
2. ✅ The manifest was signed by the claimed creator
3. ✅ The on-chain record exists and is valid
4. ✅ (Optional) Platform bindings are correct

**Verification is FREE** - no wallet or gas fees required!

## Quick Verification Methods

### Method 1: Verification Link (Easiest)

If the creator shared a verification link:

1. **Click the link** (e.g., `https://app.internet-id.io/verify?hash=abc123...`)
2. **View results** instantly
3. No registration or wallet needed

**When to use**: When you have a direct link from the creator

### Method 2: Platform URL

If you found content on a platform:

1. Go to [app.internet-id.io/verify](https://app.internet-id.io/verify)
2. Paste the platform URL (YouTube, Twitter, etc.)
3. Click **"Verify"**
4. View results

**When to use**: When viewing content on YouTube, Twitter, TikTok, etc.

### Method 3: File Upload

If you have the original file:

1. Go to [app.internet-id.io/verify](https://app.internet-id.io/verify)
2. Click **"Upload File"** tab
3. Select the file
4. Click **"Verify"**
5. View results

**When to use**: When you have the file and want to check if it's registered

### Method 4: Browser Extension (Most Convenient)

If you installed the browser extension:

1. **Visit platform content** (YouTube, Twitter, etc.)
2. **Look for the badge** on the page
3. **Click extension icon** for details
4. Or **click the badge** to view full verification

**When to use**: When browsing supported platforms regularly

## Understanding Verification Results

When verification completes, you'll see one of these results:

### ✅ Verified

**What it means**:
- Content hash matches on-chain record
- Creator's signature is valid
- On-chain record exists
- Everything checks out!

**Verification details shown**:
- ✅ Content hash (fingerprint)
- ✅ Creator wallet address
- ✅ Registration date/time
- ✅ Network (blockchain)
- ✅ Transaction hash (proof)
- ✅ Manifest details (if available)

**Trust level**: High - This content is registered by the claimed creator

**Example**:
```
✅ VERIFIED

Content Hash: 9f86d081884c7d659a2feaa0...
Creator: 0x1234567890abcdef...
Registered: Nov 1, 2025 at 2:30 PM UTC
Network: Base
Transaction: 0xabcdef1234567890...

View on BaseScan | Download Manifest | Share
```

### ❌ Not Verified

**What it means**:
- No matching record found on blockchain
- Content hash doesn't match any registration
- Either not registered, or file was modified

**Possible reasons**:
1. Content was never registered
2. File was modified (hash changed)
3. Creator used a different network (check other networks)
4. Registration hasn't confirmed yet (wait a minute)

**What to do**:
- Try other networks (switch network dropdown)
- Check if you have the original file (not re-encoded version)
- Contact the creator to confirm registration
- Check for platform binding (use platform URL instead)

**Example**:
```
❌ NOT VERIFIED

Content Hash: 9f86d081884c7d659a2feaa0...
No matching registration found on Base network.

Try:
- Switching to different network
- Verifying by platform URL instead
- Checking with content creator
```

### ⚠️ Partially Verified

**What it means**:
- Platform binding exists, but something is inconsistent
- Usually means the file was re-encoded by the platform

**What's checked**:
- ✅ Platform binding exists
- ✅ Original file was registered
- ⚠️ Current file hash differs (expected for platforms)

**This is NORMAL for YouTube, TikTok, etc.** - they re-encode all uploads.

**Example**:
```
⚠️ PLATFORM VERIFIED

YouTube Video ID: abc123xyz
Linked to Content Hash: 9f86d081884c7d659a2feaa0...
Creator: 0x1234567890abcdef...
Registered: Nov 1, 2025

Note: Platform re-encoded this content (expected behavior).
The original file was verified and bound to this video.
```

### ⏳ Pending

**What it means**:
- Transaction is still being processed
- On-chain record not yet confirmed

**What to do**:
- Wait 30-60 seconds
- Refresh the page
- Check transaction on block explorer

**Example**:
```
⏳ PENDING VERIFICATION

Transaction: 0xabcdef1234567890...
Status: Waiting for confirmation...

This usually takes 15-30 seconds.
```

## Verification Details Explained

Let's break down what each verification detail means:

### Content Hash
```
9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```
- Unique fingerprint of the file
- Created using SHA-256 algorithm
- Same file = same hash (always)
- Different file = different hash

### Creator Address
```
0x1234567890abcdef1234567890abcdef12345678
```
- Wallet address that registered the content
- Proves who claimed ownership
- Can be verified on blockchain
- Public information (safe to share)

### Registration Date
```
Nov 1, 2025 at 2:30 PM UTC
```
- When content was anchored on-chain
- Proves "I had this by this date"
- Timezone: Always shown in UTC
- Check transaction for exact timestamp

### Network
```
Base (Chain ID: 8453)
```
- Which blockchain holds the record
- Important for finding the registration
- Different networks are independent
- Must check the correct network

### Transaction Hash
```
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```
- Permanent receipt of registration
- Click to view on block explorer
- Cannot be faked or altered
- Public proof anyone can verify

### Manifest
```json
{
  "content_hash": "9f86d081...",
  "created_at": "2025-11-01T14:30:00Z",
  "creator": "0x1234...",
  "signature": "0xabcd...",
  "metadata": { ... }
}
```
- Contains metadata about the content
- Signed by creator's wallet
- Stored on IPFS
- May include title, description, license

## Using the Browser Extension

The Internet ID browser extension makes verification seamless.

### Installing the Extension

See [Browser Extension Guide](./browser-extension.md) for installation instructions.

### How It Works

1. **Automatic Detection**
   - Extension detects when you're on a supported platform
   - Checks if current content has verification
   - Shows badge if verified

2. **Visual Indicators**
   - ✅ Green badge = Verified
   - ⚠️ Yellow badge = Platform verified
   - No badge = Not verified

3. **One-Click Details**
   - Click badge or extension icon
   - See full verification details
   - Quick access to actions

### Supported Platforms

Currently supported for automatic badges:
- ✅ YouTube
- ✅ Twitter/X
- 🔄 Coming soon: TikTok, Instagram, GitHub

Can manually verify any platform using:
- Extension popup → "Verify URL"
- Paste any platform URL

### Extension Features

**Auto-Verify**:
- Automatically checks content when you visit
- Toggle on/off in settings
- Default: On

**Badge Display**:
- Shows badge on verified content
- Toggle on/off in settings
- Choose badge position (top-left, top-right, etc.)

**Quick Actions**:
- View full verification
- Copy verification link
- Share on social media
- Download proof bundle

**Cache**:
- Results cached for 5 minutes
- Reduces API calls
- Click "Refresh" to force re-check

## Manual Verification

For advanced users who want to verify independently:

### Step 1: Get the Content Hash

If you have the file:

```bash
# On Linux/Mac
sha256sum your-file.mp4

# On Windows (PowerShell)
Get-FileHash your-file.mp4 -Algorithm SHA256

# Result: 9f86d081884c7d659a2feaa0...
```

### Step 2: Query the Blockchain

Using ethers.js or web3.js:

```javascript
const registry = new ethers.Contract(
  REGISTRY_ADDRESS,
  REGISTRY_ABI,
  provider
);

const contentHash = "0x9f86d081884c7d659a2feaa0...";
const entry = await registry.entries(contentHash);

console.log("Creator:", entry.creator);
console.log("Timestamp:", entry.timestamp);
console.log("Manifest URI:", entry.manifestURI);
```

### Step 3: Verify Manifest Signature

Download manifest from IPFS:

```bash
# Get manifest
curl https://ipfs.io/ipfs/QmXyz123... > manifest.json

# Verify signature (using ethers.js)
const recovered = ethers.verifyMessage(
  JSON.stringify(manifestData),
  manifest.signature
);

console.log("Signer:", recovered);
# Should match entry.creator
```

### Step 4: Verify Content Hash

```bash
# Hash your file
sha256sum your-file.mp4 > computed-hash.txt

# Compare with manifest
jq -r .content_hash manifest.json > manifest-hash.txt

# Should match
diff computed-hash.txt manifest-hash.txt
```

If all steps pass: ✅ Verified independently!

## Verifying Platform Content

Each platform requires a slightly different approach:

### YouTube

**Direct Verification**:
1. Copy video URL: `https://youtube.com/watch?v=VIDEO_ID`
2. Paste into Internet ID verify page
3. Results show if bound to registered content

**With Extension**:
- Badge appears on video page (if verified)
- Click badge for details

**What's Verified**:
- YouTube video ID is bound to registered content
- Original file was registered before upload
- Creator wallet matches

### Twitter/X

**Direct Verification**:
1. Copy tweet URL: `https://twitter.com/user/status/TWEET_ID`
2. Paste into verify page
3. Check if media in tweet is verified

**With Extension**:
- Badge on tweets with verified media
- Click badge for full details

### TikTok

**Direct Verification**:
1. Copy TikTok URL: `https://tiktok.com/@user/video/VIDEO_ID`
2. Paste into verify page
3. Check verification status

### Instagram

**Direct Verification**:
1. Copy post URL: `https://instagram.com/p/POST_ID/`
2. Paste into verify page
3. Verify media in post

### GitHub

**Direct Verification**:
1. Copy commit or file URL
2. Paste into verify page
3. Verify code or document

## Common Verification Scenarios

### Scenario 1: Verifying a YouTube Video

**Goal**: Check if a YouTube video is from the real creator

**Steps**:
1. Visit the YouTube video
2. Look for Internet ID badge (if extension installed)
3. Or copy URL and paste into [app.internet-id.io/verify](https://app.internet-id.io/verify)
4. Check creator address matches known creator
5. Check registration date (should be before upload date)

**Red Flags**:
- Registration date after upload date (suspicious)
- Creator address doesn't match official creator
- No binding found (might be fake)

### Scenario 2: Verifying a File You Downloaded

**Goal**: Confirm a file matches its claimed registration

**Steps**:
1. Go to [app.internet-id.io/verify](https://app.internet-id.io/verify)
2. Click "Upload File" tab
3. Select the downloaded file
4. Click "Verify"
5. Check hash matches on-chain record

**If Verified**: File is authentic and matches registration
**If Not Verified**: File may be modified, corrupted, or never registered

### Scenario 3: Checking Multiple Platforms

**Goal**: Verify content across multiple platforms

**Steps**:
1. Verify on first platform (e.g., YouTube)
2. Note the content hash
3. Verify on second platform (e.g., Twitter)
4. Check if same content hash
5. All should point to same original registration

**Expected**: Same content hash across all platforms = consistent proof

### Scenario 4: Investigating Potential Deepfake

**Goal**: Determine if suspicious content is verified

**Steps**:
1. Try to verify the suspicious content
2. If not verified: More likely to be fake
3. If verified: Check registration date
4. Check creator's other verified content
5. Look for inconsistencies

**Remember**: Internet ID proves who registered it, not if content is "real"

### Scenario 5: Verifying Before Sharing

**Goal**: Check content before sharing to avoid spreading fakes

**Steps**:
1. Find content you want to share
2. Verify using platform URL or file
3. Check results and creator
4. If verified, share confidently
5. If not verified, be cautious and note in your share

**Pro Tip**: Include verification link when sharing!

## Verification Best Practices

### For Verifiers (Viewers)

1. ✅ **Always verify before trusting**
   - Takes seconds
   - Provides confidence
   - Catches fakes

2. ✅ **Check the creator address**
   - Compare with known official address
   - Beware of impersonators
   - Check creator's other content

3. ✅ **Check registration date**
   - Should be before public release
   - Very old dates might be retroactive
   - Very new dates might be defensive

4. ✅ **Look for platform bindings**
   - YouTube re-encodes, needs binding
   - Direct file verification only works for originals
   - Bindings are expected and normal

5. ✅ **Use browser extension**
   - Automatic checking
   - Visual badges
   - Saves time

### For Creators

1. ✅ **Share verification links**
   - In video descriptions
   - In social bios
   - With press releases

2. ✅ **Add badges visibly**
   - Website footer
   - Video outros
   - Profile images

3. ✅ **Educate your audience**
   - Explain Internet ID
   - Show how to verify
   - Build trust over time

4. ✅ **Bind all platforms**
   - Don't just register original
   - Bind YouTube, Twitter, TikTok, etc.
   - Makes verification easier

5. ✅ **Publish your creator address**
   - On your website
   - In your bio
   - So people know it's really you

## Verification Limitations

**Internet ID Proves**:
- ✅ Someone with this wallet registered this content
- ✅ It was registered at this specific time
- ✅ The content hash matches (if verifying original file)

**Internet ID Does NOT Prove**:
- ❌ The content is "true" or "accurate"
- ❌ The creator is who they claim to be (identity)
- ❌ The content is original (could be stolen and registered)
- ❌ The content is authentic (could be AI-generated and registered)

**Internet ID is one signal among many.** Use it alongside:
- Verified social accounts
- Official websites
- Multiple sources
- Critical thinking

## Troubleshooting Verification

### Can't Verify Platform URL

**Problem**: "Invalid URL" or "Platform not supported"

**Solutions**:
- Check URL format is correct
- Make sure platform is supported
- Try direct file verification
- See [Troubleshooting Guide](./troubleshooting.md)

### File Verification Fails

**Problem**: "Hash doesn't match" or "Not verified"

**Solutions**:
- Make sure you have the original file (not re-encoded)
- Check file hasn't been modified
- Try verifying by platform URL instead
- Verify on different network

### Extension Not Showing Badge

**Problem**: No badge appears on platform

**Solutions**:
- Check extension is installed and enabled
- Refresh the platform page
- Check "Enable badges" in extension settings
- Verify content is actually bound to platform

See [Troubleshooting Guide](./troubleshooting.md) for more help.

## Next Steps

Now that you know how to verify:

- **[Platform Bindings](./platform-bindings.md)** - How to bind your content
- **[Browser Extension Guide](./browser-extension.md)** - Install extension
- **[FAQ](./faq.md)** - Common questions
- **[Managing Content](./managing-content.md)** - Manage your registrations

## Get Help

Questions about verification?

- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting](./troubleshooting.md)** - Technical issues
- **Discord** - Community support
- **Email** - support@internet-id.io
