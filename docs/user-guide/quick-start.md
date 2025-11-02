# Quick Start: Register Your First Content

This tutorial will guide you through registering your first piece of content in about 5 minutes. We'll use the One-Shot workflow, which handles everything in a single step.

## ⏱️ What You'll Do

1. Select your file
2. Configure privacy settings
3. Register on blockchain
4. Get your verification badge
5. Share your proof

**Time needed**: 5 minutes  
**Cost**: ~$0.01 in gas fees  
**Difficulty**: Beginner

## ✅ Before You Start

Make sure you've completed:
- [ ] [Wallet setup](./getting-started.md#step-1-set-up-your-wallet)
- [ ] [Connected to Internet ID](./getting-started.md#step-4-connect-to-internet-id)
- [ ] Have at least $0.10 worth of ETH/MATIC in your wallet

Not ready? Go back to the [Getting Started Guide](./getting-started.md).

## 📋 Step-by-Step Instructions

### Step 1: Navigate to One-Shot Registration

1. Go to [app.internet-id.io](https://app.internet-id.io)
2. Make sure your wallet is connected (top right should show your address)
3. Click **"Register Content"** in the navigation menu
4. Select **"One-Shot Registration"** tab

### Step 2: Choose Your File

1. Click **"Choose File"** or drag and drop
2. Select your content file:
   - ✅ Videos (MP4, MOV, AVI, etc.)
   - ✅ Images (JPG, PNG, GIF, etc.)
   - ✅ Audio (MP3, WAV, FLAC, etc.)
   - ✅ Documents (PDF, TXT, etc.)
   
3. Wait for the file to load (large files may take a moment)

> 💡 **Tip**: Maximum file size is 100MB for web upload. For larger files, use the [CLI tool](./cli-usage.md).

### Step 3: Configure Privacy Settings

You'll see two important checkboxes:

#### Upload Original to IPFS (Optional)
```
☐ Upload file to IPFS (makes content publicly accessible)
```

**Unchecked (Default)** - Privacy Mode:
- Only the file's hash is used
- Your original file stays on your device
- Manifest is uploaded, but NOT the file
- **Recommended** for private or sensitive content

**Checked** - Public Mode:
- File is uploaded to IPFS
- Anyone can download the original
- Good for content you want to distribute
- **Recommended** for public releases

> 🔒 **Privacy Tip**: If you're not sure, leave this unchecked. You can always upload the file later, but you can't make it private once uploaded.

#### Automatically Bind Platform Link (Optional)
```
☐ Bind platform URL after registration
```

If you've already posted this content on YouTube, TikTok, etc., you can bind it immediately:
- Check this box
- Enter the platform URL (e.g., `https://youtube.com/watch?v=abc123`)
- Saves time by doing both steps at once

### Step 4: Review and Register

1. **Check the Summary Box**
   - File name and size
   - Content hash (this is your fingerprint!)
   - Network (e.g., Base)
   - Estimated gas fee

2. **Click "Register Content"**

3. **Approve in MetaMask**
   - MetaMask popup will appear
   - Review the gas fee (should be ~$0.01)
   - Click "Confirm"

4. **Wait for Confirmation**
   - Progress indicator will show: "Uploading manifest" → "Submitting transaction" → "Confirming"
   - Takes 5-15 seconds depending on network
   - Don't close the page!

### Step 5: Success! 🎉

You'll see a success message with:
- ✅ Your content hash
- ✅ Transaction hash (blockchain proof)
- ✅ Link to view on block explorer
- ✅ Your verification badge

## 🎨 Your Verification Badge

You now have a verification badge! Here's what to do with it:

### View Your Badge
1. Click **"View Details"** or go to Dashboard
2. Find your registered content
3. Click **"Share"** to see sharing options

### Badge Options
- **Badge Image**: SVG that links to verification page
- **QR Code**: Scannable code for easy verification
- **Verification Link**: Direct URL to public verification page
- **Embed Code**: HTML to add to your website

### Copy Everything at Once
Click **"Copy All"** to get:
```
Verification Badge: https://app.internet-id.io/api/badge/[hash]
Verification Link: https://app.internet-id.io/verify?hash=[hash]
QR Code: https://app.internet-id.io/api/qr?url=[verification_link]
Embed Code: <a href="..."><img src="..." /></a>
```

## 📢 Sharing Your Proof

### On Social Media
Add your verification link to:
- YouTube video descriptions
- Twitter/X bio or tweets
- Instagram bio or captions
- TikTok bio

Example:
```
Verified with Internet ID ✓
🔗 https://app.internet-id.io/verify?hash=abc123...
```

### On Your Website
Embed the badge:
```html
<a href="https://app.internet-id.io/verify?hash=abc123...">
  <img src="https://app.internet-id.io/api/badge/abc123..." 
       alt="Verified by Internet ID" 
       width="200" />
</a>
```

### In Video Content
Add QR code to:
- Video outro/credits
- Lower third graphics
- End screens

## 🔗 Binding to Platform Links

If you didn't bind during registration, you can do it now:

### Quick Bind
1. Go to your Dashboard
2. Find your registered content
3. Click **"Add Platform Link"**
4. Enter the URL (e.g., YouTube video URL)
5. Click **"Bind"** and confirm in MetaMask

### Supported Platforms
- YouTube
- Twitter/X
- TikTok
- Instagram
- GitHub
- LinkedIn
- Discord

See [Platform Bindings](./platform-bindings.md) for detailed guides for each platform.

## ✅ Verify It Works

Let's make sure everything is working:

1. **Test Your Verification Link**
   - Copy your verification URL
   - Open in a new browser tab (or incognito/private window)
   - You should see your content details and verification status

2. **Check the Blockchain**
   - Click the transaction hash link
   - View on block explorer (BaseScan, PolygonScan, etc.)
   - See your transaction permanently recorded

3. **Try the Browser Extension** (Optional)
   - Install [Internet ID extension](./browser-extension.md)
   - Visit your platform link (e.g., YouTube)
   - Extension should show verification badge

## 🎓 What You Learned

Congratulations! You now know how to:
- ✅ Register content on blockchain
- ✅ Generate a unique content fingerprint
- ✅ Create a verification badge
- ✅ Share proof of ownership
- ✅ Bind to platform links

## 🚀 Next Steps

### Go Deeper
- **[Upload and Register Content Guide](./uploading-content.md)** - Advanced registration options
- **[Platform Bindings](./platform-bindings.md)** - Connect all your platforms
- **[Managing Content](./managing-content.md)** - Update and manage your content

### Optimize
- **[Gas Fees Guide](./gas-fees.md)** - Minimize costs
- **[Batch Operations](./managing-content.md#batch-operations)** - Register multiple files at once

### Share
- **[Browser Extension](./browser-extension.md)** - Install for easy verification
- Tell other creators about Internet ID!

## 🆘 Troubleshooting

### Transaction Failed
- **Check balance**: Need enough for gas + small buffer
- **Try again**: Network congestion can cause failures
- **Increase gas**: Click "Edit" in MetaMask if transaction is stuck

### File Upload Failed
- **Check file size**: Must be under 100MB for web
- **Check internet connection**: Upload requires stable connection
- **Use CLI for large files**: See [CLI Usage Guide](./cli-usage.md)

### Can't See My Content
- **Wait a moment**: Can take 30-60 seconds to index
- **Refresh the page**: Browser cache might be stale
- **Check network**: Make sure you're on the same network you registered on

### Verification Link Doesn't Work
- **Wait for confirmation**: Need 1-2 block confirmations
- **Check URL**: Make sure you copied the full link
- **Try again**: Database might need a moment to update

## 💬 Get Help

Questions? We're here to help!

- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting Guide](./troubleshooting.md)** - Technical issues
- **Discord** - Community support
- **Email** - support@internet-id.io

## 🎉 Share Your Success

Registered your first content? Share it with the community!

- Tag us on Twitter: [@InternetID](https://twitter.com/internetid)
- Join our Discord and show off your badge
- Help other creators get started

Welcome to the Internet ID community! 🚀
