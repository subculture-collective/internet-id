# Platform Bindings

Learn how to connect your registered content to YouTube, Twitter, TikTok, and other platforms.

## 📋 Table of Contents

- [What are Platform Bindings?](#what-are-platform-bindings)
- [Why Bind to Platforms?](#why-bind-to-platforms)
- [Supported Platforms](#supported-platforms)
- [How to Bind Content](#how-to-bind-content)
- [Platform-Specific Guides](#platform-specific-guides)
- [Managing Bindings](#managing-bindings)
- [Best Practices](#best-practices)

## What are Platform Bindings?

A **platform binding** connects your registered original file to the version posted on a platform (YouTube, Twitter, TikTok, etc.).

### The Problem

When you upload to platforms, they re-encode your content:
- **YouTube** changes resolution, bitrate, codec
- **Twitter** compresses images and videos
- **TikTok** applies filters and adjustments
- **Instagram** resizes and optimizes

This changes the file hash, breaking direct verification.

### The Solution

Platform bindings create a verified link:

```
Original File (Hash A) ←→ YouTube Video (Hash B)
     ↓                           ↓
Registered on Blockchain    Platform Post
```

Now viewers can verify your YouTube video even though the hash changed!

## Why Bind to Platforms?

### For Creators

1. **Enable Easy Verification**
   - Viewers can verify directly from platform
   - No need to download original file
   - Works with browser extension

2. **Build Trust**
   - Show verification badge on platform
   - Prove authenticity across platforms
   - Combat impersonators

3. **Cross-Platform Proof**
   - Same content on multiple platforms
   - All point back to one original
   - Consistent proof of ownership

4. **Future-Proof**
   - Bindings survive re-uploads
   - Platform changes don't affect proof
   - Permanent record

### For Viewers

1. **Instant Verification**
   - Verify without leaving platform
   - Click badge or use extension
   - No downloads needed

2. **Trust Signal**
   - See at a glance if verified
   - Check creator's other content
   - Distinguish real from fake

3. **Easy Access**
   - QR codes in videos
   - Links in descriptions
   - Badges on pages

## Supported Platforms

### Currently Supported ✅

| Platform | Binding Type | Auto-Detection | Badge Support |
|----------|-------------|----------------|---------------|
| **YouTube** | Video ID | ✅ Yes | ✅ Yes |
| **Twitter/X** | Tweet ID | ✅ Yes | ✅ Yes |
| **TikTok** | Video ID | ✅ Yes | 🔄 Coming soon |
| **Instagram** | Post ID | ✅ Yes | 🔄 Coming soon |
| **GitHub** | Commit/File | ✅ Yes | 🔄 Coming soon |
| **LinkedIn** | Post ID | ✅ Yes | 🔄 Coming soon |
| **Discord** | Message ID | ✅ Yes | 🔄 Coming soon |

### Coming Soon 🔄

- Spotify (via platform ID)
- Twitch (clips and VODs)
- Reddit (posts)
- Medium (articles)
- Vimeo (videos)
- SoundCloud (tracks)

**Want a platform added?** [Request it](https://discord.gg/internetid) or [vote on GitHub](https://github.com/subculture-collective/internet-id/discussions)!

## How to Bind Content

There are three ways to bind content to platforms:

### Method 1: During Registration (Easiest)

Bind when you first register:

1. **Upload and Register** content (One-Shot or step-by-step)
2. **Check** "Bind platform URL after registration"
3. **Enter** platform URL
4. **Confirm** in wallet
5. Done! Content is registered and bound

**Pros**: Fastest, one transaction
**Cons**: Must have platform URL before registration

### Method 2: From Dashboard (Most Common)

Bind after registration:

1. Go to **Dashboard**
2. Find your registered content
3. Click **"Add Platform Link"**
4. Enter platform URL
5. Click **"Bind"**
6. Confirm in MetaMask (~$0.01 gas)
7. Wait for confirmation

**Pros**: Can bind anytime, flexible
**Cons**: Separate transaction (extra gas fee)

### Method 3: Using CLI (Power Users)

Bind via command line:

```bash
# Bind YouTube video
internet-id bind youtube \
  --file ./my-video.mp4 \
  --video-id abc123xyz \
  --registry 0xRegistryAddress

# Bind Twitter post
internet-id bind twitter \
  --file ./my-image.jpg \
  --tweet-id 1234567890 \
  --registry 0xRegistryAddress
```

**Pros**: Scriptable, batch operations
**Cons**: Requires CLI setup

See [CLI Guide](./cli-usage.md) for details.

## Platform-Specific Guides

### YouTube Binding

#### Step 1: Upload to YouTube

1. Upload your video to YouTube normally
2. Wait for processing to complete
3. Note the video ID from URL:
   ```
   https://www.youtube.com/watch?v=abc123xyz
                                    ^^^^^^^^^
                                    Video ID
   ```

#### Step 2: Bind to Internet ID

**Web UI**:
1. Dashboard → Your content → "Add Platform Link"
2. Select **"YouTube"** from dropdown
3. Enter video ID or full URL
4. Click "Bind" and confirm transaction
5. Wait 15-30 seconds for confirmation

**CLI**:
```bash
npm run bind:youtube -- ./original-video.mp4 abc123xyz 0xRegistryAddr
```

#### Step 3: Share Verification

Add to your video description:

```
✓ Verified with Internet ID
🔗 Verify: https://app.internet-id.io/verify?platform=youtube&id=abc123xyz
📱 Scan QR in video to verify
```

**Pro Tip**: Add QR code in video outro for easy mobile verification!

### Twitter/X Binding

#### Step 1: Post on Twitter

1. Post your content (image, video, or link)
2. Wait for post to be published
3. Copy the tweet URL:
   ```
   https://twitter.com/username/status/1234567890
                                       ^^^^^^^^^^
                                       Tweet ID
   ```

#### Step 2: Bind to Internet ID

**Web UI**:
1. Dashboard → Your content → "Add Platform Link"
2. Select **"Twitter"** from dropdown
3. Enter tweet ID or full URL
4. Click "Bind" and confirm
5. Wait for confirmation

**CLI**:
```bash
# For tweet with media
npm run bind:twitter -- ./original-media.jpg 1234567890 0xRegistryAddr
```

#### Step 3: Share in Bio

Add to your Twitter bio:

```
Content verified with Internet ID ✓
🔗 app.internet-id.io/verify
```

### TikTok Binding

#### Step 1: Upload to TikTok

1. Upload video to TikTok
2. Wait for processing
3. Copy video URL from share menu:
   ```
   https://tiktok.com/@user/video/1234567890
                                   ^^^^^^^^^^
                                   Video ID
   ```

#### Step 2: Bind to Internet ID

**Web UI**:
1. Dashboard → Your content → "Add Platform Link"
2. Select **"TikTok"** from dropdown
3. Enter video ID or full URL
4. Click "Bind" and confirm

**CLI**:
```bash
npm run bind:tiktok -- ./original-video.mp4 1234567890 0xRegistryAddr
```

#### Step 3: Add to Caption

Include in your TikTok caption:

```
✓ Verified creator
🔗 Link in bio for proof
```

### Instagram Binding

#### Step 1: Post on Instagram

1. Post your content
2. Open post in browser (not app)
3. Copy post ID from URL:
   ```
   https://instagram.com/p/ABC123xyz/
                          ^^^^^^^^^
                          Post ID
   ```

#### Step 2: Bind to Internet ID

**Web UI**:
1. Dashboard → Your content → "Add Platform Link"
2. Select **"Instagram"** from dropdown
3. Enter post ID or full URL
4. Click "Bind" and confirm

**CLI**:
```bash
npm run bind:instagram -- ./original-image.jpg ABC123xyz 0xRegistryAddr
```

#### Step 3: Add to Bio

Link in your Instagram bio:

```
✓ Verified with Internet ID
🔗 Link: app.internet-id.io/verify
```

### GitHub Binding

#### Step 1: Publish on GitHub

1. Commit and push your code/document
2. Get the commit hash or file URL
3. Example:
   ```
   https://github.com/user/repo/blob/main/file.md
   Or commit: abc123def456...
   ```

#### Step 2: Bind to Internet ID

**Web UI**:
1. Dashboard → Your content → "Add Platform Link"
2. Select **"GitHub"** from dropdown
3. Enter commit hash or file URL
4. Click "Bind" and confirm

**CLI**:
```bash
npm run bind:github -- ./original-file.md abc123commit 0xRegistryAddr
```

#### Step 3: Add Badge to README

Add to your repository README:

```markdown
[![Verified](https://app.internet-id.io/api/badge/HASH)](https://app.internet-id.io/verify?hash=HASH)
```

## Managing Bindings

### View All Bindings

**Dashboard View**:
1. Go to Dashboard
2. Click on any registered content
3. Scroll to "Platform Bindings" section
4. See all linked platforms

**Example Display**:
```
Platform Bindings:
✓ YouTube: youtube.com/watch?v=abc123
✓ Twitter: twitter.com/user/status/456789
✓ TikTok: tiktok.com/@user/video/123456
```

### Add New Binding

From content details:
1. Click **"Add Platform Link"**
2. Choose platform from dropdown
3. Enter URL or ID
4. Confirm transaction
5. Binding appears in list

### Update Binding

If you need to change a platform URL:
1. Currently requires removing old and adding new
2. Future: Direct update feature coming soon

**Workaround**:
1. Note the current bindings
2. Use CLI or contact support for bulk changes

### Remove Binding

To remove a binding:
1. Go to content details
2. Find binding to remove
3. Click **"Remove"** (❌ icon)
4. Confirm transaction (~$0.01 gas)
5. Binding is removed from on-chain registry

**Note**: This doesn't delete the platform content, just the binding.

### Batch Bind Multiple Platforms

Bind one original to many platforms at once:

**Web UI**:
1. Content details → "Add Multiple Bindings"
2. Enter all platform URLs
3. Review gas cost (one transaction per binding)
4. Confirm all at once
5. Wait for confirmations

**CLI** (Recommended for batch):
```bash
# Create bindings file
cat > bindings.json << EOF
[
  {"platform": "youtube", "id": "abc123"},
  {"platform": "twitter", "id": "456789"},
  {"platform": "tiktok", "id": "123456"}
]
EOF

# Batch bind
internet-id batch-bind ./original.mp4 bindings.json
```

Saves time and can be more gas-efficient.

## Best Practices

### When to Bind

**Recommended Timing**:
1. ✅ **Register original first** - Always register before uploading to platforms
2. ✅ **Bind immediately after upload** - As soon as platform URL is available
3. ✅ **Bind all platforms** - Don't skip any where you post
4. ✅ **Bind retroactively** - Even old content benefits from bindings

**Avoid**:
- ❌ Binding before uploading to platform (URL won't exist yet)
- ❌ Binding to wrong platform type (e.g., YouTube ID as Twitter)
- ❌ Binding to private/unlisted content that may be removed

### Organizing Bindings

**Use Descriptive Names**:
- Add platform name to content title in manifest
- Example: "My Video - YouTube", "My Video - Twitter Cut"

**Group Related Content**:
- Use tags to group: #youtube, #twitter, #full-version, #teaser
- Makes it easier to find and manage

**Document Your Bindings**:
- Keep a spreadsheet of content and platform URLs
- Especially useful for large content libraries

### Verification Workflow

**Complete Flow**:
1. Create content
2. Register with Internet ID (get hash)
3. Upload to platform(s)
4. Bind each platform URL
5. Add verification links to descriptions
6. Share verification badge
7. Monitor with browser extension

### Security Considerations

**Binding Permissions**:
- Only the original creator wallet can bind
- Prevents others from fraudulent bindings
- Keep your wallet secure!

**Verify Bindings**:
- After binding, verify it works
- Check verification page shows binding
- Test with browser extension

**Platform Account Security**:
- Bind only to accounts you control
- If account compromised, bindings still prove original ownership
- But attacker could confuse viewers

## Common Binding Scenarios

### Scenario 1: Multi-Platform Release

**Goal**: Release same content on YouTube, Twitter, TikTok

**Workflow**:
1. Create and finalize content
2. Register original with Internet ID
3. Upload to YouTube (bind immediately)
4. Upload to Twitter (bind immediately)
5. Upload to TikTok (bind immediately)
6. All three now point to same original proof

**Benefits**:
- Consistent verification across platforms
- Viewers can check any platform
- Proves all are from same creator

### Scenario 2: Teaser and Full Version

**Goal**: Post teaser on Twitter, full video on YouTube

**Workflow**:
1. Create full video (5 minutes)
2. Create teaser (30 seconds)
3. Register both as separate content
4. Bind full video to YouTube
5. Bind teaser to Twitter
6. Link between them in descriptions

**Alternative**:
- Register only full version
- Note teaser is "derived work" in manifest
- Bind both to same registration (with note)

### Scenario 3: Retroactive Binding

**Goal**: Bind old content already posted

**Workflow**:
1. Gather all platform URLs for existing content
2. Find or recreate original files
3. Register original files (even if old)
4. Bind to existing platform URLs
5. Update descriptions with verification links

**Note**: Registration date will be "now", not original post date. That's OK—it still proves you're claiming it!

### Scenario 4: Re-upload After Takedown

**Goal**: Re-upload content that was removed

**Workflow**:
1. Original binding exists to old URL (now dead)
2. Re-upload to platform (get new URL)
3. Add new binding to new URL
4. Keep old binding (shows history)
5. Note in description: "Re-uploaded, still verified"

**Benefits**:
- Proves continuity
- Shows censorship history
- Maintains verification

## Troubleshooting Bindings

### Binding Transaction Fails

**Problem**: Transaction reverts or fails

**Solutions**:
1. Check you're the creator (only creator can bind)
2. Check content is registered
3. Check sufficient gas balance
4. Try increasing gas limit
5. See [Troubleshooting Guide](./troubleshooting.md)

### Binding Doesn't Show in Verification

**Problem**: Bound but verification doesn't show it

**Solutions**:
1. Wait 1-2 minutes for indexing
2. Refresh verification page
3. Clear browser cache
4. Check transaction confirmed on block explorer
5. Check correct network selected

### Platform URL Not Recognized

**Problem**: "Invalid URL" error

**Solutions**:
1. Check URL format matches platform standard
2. Use full URL, not shortened link
3. Make sure platform is supported
4. Try entering just the ID instead

### Browser Extension Doesn't Show Badge

**Problem**: Extension doesn't detect bound content

**Solutions**:
1. Refresh platform page
2. Check extension is enabled
3. Wait for cache to clear (5 minutes)
4. Check binding exists in dashboard
5. See [Extension Guide](./browser-extension.md)

## Next Steps

Now that you know how to bind platforms:

- **[Verifying Content](./verifying-content.md)** - How to verify bindings
- **[Browser Extension](./browser-extension.md)** - Install for auto-detection
- **[Managing Content](./managing-content.md)** - Organize your content
- **[CLI Usage](./cli-usage.md)** - Batch binding via CLI

## Get Help

Questions about platform bindings?

- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting](./troubleshooting.md)** - Technical issues
- **Discord** - Community support
- **Email** - support@internet-id.io
