# Troubleshooting Guide

This guide helps you solve common issues when using Internet ID.

## 🔍 Quick Diagnosis

**Not sure what's wrong?** Follow this checklist:

1. ☐ Is MetaMask/wallet unlocked?
2. ☐ Are you on the correct network?
3. ☐ Do you have sufficient balance for gas?
4. ☐ Is your internet connection stable?
5. ☐ Have you tried refreshing the page?
6. ☐ Is your browser up to date?

If all checked and still having issues, see specific problems below.

## 🔐 Wallet Issues

### Can't Connect Wallet

**Symptoms**: "Connect Wallet" button doesn't work, wallet popup doesn't appear

**Solutions:**

1. **Make sure wallet extension is installed**
   - Check browser extensions
   - Install MetaMask from [metamask.io](https://metamask.io)
   - Restart browser after installation

2. **Unlock your wallet**
   - Click the wallet extension icon
   - Enter your password
   - Try connecting again

3. **Refresh the page**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear cache if needed

4. **Check permissions**
   - Wallet might have rejected the connection
   - Open wallet → Settings → Connected Sites
   - Remove Internet ID if listed, try reconnecting

5. **Try different browser**
   - Chrome, Firefox, Brave all support MetaMask
   - Some privacy-focused browsers block wallet connections

6. **Update wallet extension**
   - Open extension store
   - Check for MetaMask updates
   - Update and restart browser

**Still not working?**
- Disable other wallet extensions (conflicts can occur)
- Try incognito/private mode
- Check browser console for errors (F12 → Console tab)

### Wrong Network

**Symptoms**: Transaction fails, content doesn't appear, "Unsupported Network" error

**Solutions:**

1. **Check current network**
   - Look at top-right of Internet ID app
   - Open MetaMask and check network dropdown

2. **Switch to correct network**
   - Click network dropdown in MetaMask
   - Select correct network (e.g., "Base")
   - Refresh Internet ID page

3. **Add network if missing**
   - Internet ID will prompt you to add network
   - Click "Add Network" or "Switch Network"
   - Approve in MetaMask
   - Or add manually from [Chainlist.org](https://chainlist.org)

4. **Common network names:**
   - Base Mainnet
   - Polygon
   - Ethereum Mainnet
   - Base Sepolia (testnet)
   - Polygon Amoy (testnet)

### Insufficient Balance

**Symptoms**: "Insufficient funds", "Not enough ETH for gas", transaction fails immediately

**Solutions:**

1. **Check your balance**
   - Open MetaMask
   - Look at top (should show ETH or MATIC balance)
   - Need at least $0.10 worth for gas fees

2. **Make sure you're checking correct network**
   - ETH on Ethereum ≠ ETH on Base
   - Switch to the network you're using
   - Check balance again

3. **Add funds**
   - Buy on exchange (Coinbase, Kraken)
   - Use on-ramp in MetaMask
   - Get test tokens from faucet (testnets only)
   - See [Getting Started - Fund Your Wallet](./getting-started.md#step-3-fund-your-wallet)

4. **Use cheaper network**
   - Switch to Base or Polygon (~$0.01 fees)
   - Instead of Ethereum ($0.50+ fees)

## 📤 Upload & Registration Issues

### File Upload Fails

**Symptoms**: Upload stalls, error message, "IPFS upload failed"

**Solutions:**

1. **Check file size**
   - Web UI: 100MB max
   - For larger files, use CLI tool
   - Or use privacy mode (don't upload file)

2. **Check internet connection**
   - Need stable connection for uploads
   - Try smaller file to test connection
   - Use wired connection if available

3. **Try different IPFS provider**
   - Settings → IPFS Configuration
   - Switch from Web3.Storage to Pinata (or vice versa)
   - Or use local IPFS node

4. **Retry upload**
   - Click "Retry" if shown
   - Or refresh page and try again
   - File upload is idempotent (same file = same CID)

5. **Use privacy mode instead**
   - Don't upload file to IPFS
   - Just register the hash
   - File stays on your device

### Transaction Fails

**Symptoms**: MetaMask shows "Transaction failed", "Reverted", or "Out of gas"

**Solutions:**

1. **Check balance (again)**
   - Need gas + small buffer
   - Add $0.10-0.50 worth of ETH/MATIC

2. **Increase gas limit**
   - In MetaMask transaction popup
   - Click "Edit" → "Advanced"
   - Increase gas limit by 20%
   - Don't touch gas price (usually)

3. **Check network congestion**
   - Visit network explorer (BaseScan, PolygonScan)
   - If congested, wait 10-30 minutes
   - Or increase gas price

4. **Retry with higher gas**
   - Cancel failed transaction
   - Try registering again
   - MetaMask will suggest higher gas

5. **Switch networks**
   - If Base is congested, try Polygon
   - Or wait for congestion to clear

### Transaction Stuck/Pending

**Symptoms**: Transaction shows "Pending" for many minutes, never confirms

**Solutions:**

1. **Wait first**
   - Base/Polygon: Usually < 30 seconds
   - Ethereum: Can take 5-15 minutes
   - Check block explorer (link in MetaMask)

2. **Speed up transaction**
   - Click pending transaction in MetaMask
   - Click "Speed Up"
   - Approve higher gas fee
   - Transaction should confirm faster

3. **Cancel and retry**
   - Only if stuck for 10+ minutes
   - Click pending transaction in MetaMask
   - Click "Cancel"
   - Approve cancellation (small gas fee)
   - Wait for cancellation to confirm
   - Try registration again

4. **Check nonce issues**
   - Multiple pending transactions can block each other
   - Cancel or speed up the earliest one first
   - Others will follow

### Content Hash Mismatch

**Symptoms**: "Hash doesn't match", verification fails, "Invalid content"

**Causes & Solutions:**

**File was modified:**
- Even tiny changes alter the hash
- Make sure you're using the exact same file
- Check file size and modification date

**Downloaded/re-encoded file:**
- Platforms like YouTube change files
- Use the original file, not downloaded version
- Or use platform binding instead

**File corruption:**
- Re-download or re-export file
- Check file opens correctly
- Use a file integrity tool to verify

## 👁️ Content Visibility Issues

### Content Doesn't Appear in Dashboard

**Symptoms**: Registered content, but don't see it in dashboard

**Solutions:**

1. **Wait a moment**
   - Can take 30-60 seconds to index
   - Refresh page after waiting

2. **Check you're on correct network**
   - Content on Base won't show when viewing Polygon
   - Switch wallet to the network you registered on
   - Refresh page

3. **Check connected wallet**
   - Content tied to wallet address that registered it
   - Make sure you're using the same wallet
   - Check address matches

4. **Check transaction confirmed**
   - Visit block explorer (link from MetaMask)
   - Make sure transaction shows as "Success"
   - If pending, wait for confirmation
   - If failed, need to register again

5. **Clear cache**
   - Browser cache might be stale
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache entirely

### Verification Link Doesn't Work

**Symptoms**: Verification URL shows "Not found", "Invalid content", or error

**Solutions:**

1. **Wait for confirmation**
   - Need 1-2 block confirmations
   - Can take 30 seconds to 2 minutes
   - Check block explorer

2. **Check URL is complete**
   - Make sure you copied entire URL
   - Should start with `https://app.internet-id.io/verify?`
   - Check no characters were cut off

3. **Check network parameter**
   - URL should include network/chain ID
   - Example: `?hash=abc123&chainId=8453`
   - If missing, verification might fail

4. **Database sync delay**
   - Very rare, but can take a few minutes
   - Wait 5 minutes and try again
   - Check transaction confirmed on-chain

## 🔗 Platform Binding Issues

### Can't Bind Platform URL

**Symptoms**: "Invalid URL", "Platform not supported", binding fails

**Solutions:**

1. **Check URL format**
   - YouTube: `https://youtube.com/watch?v=VIDEO_ID`
   - Twitter: `https://twitter.com/user/status/TWEET_ID`
   - Must be full URL, not shortened link

2. **Check platform supported**
   - Currently: YouTube, Twitter, TikTok, Instagram, GitHub, LinkedIn, Discord
   - More coming soon
   - Check [Platform Bindings Guide](./platform-bindings.md)

3. **Content must be registered first**
   - Can only bind to already-registered content
   - Register content, then bind

4. **URL must be public**
   - Private/unlisted content might not work
   - Make content public or use direct ID

### Verification Badge Doesn't Appear

**Symptoms**: Browser extension doesn't show badge, can't see verification on platform

**Solutions:**

1. **Check extension installed**
   - See browser extensions list
   - Install from [Extension Guide](./browser-extension.md)

2. **Check extension enabled**
   - Extension icon should be colored (not gray)
   - Click icon → Check "Enable badge display"

3. **Check binding exists**
   - Visit Dashboard
   - Find content and check platform bindings
   - Make sure you bound the correct URL

4. **Refresh platform page**
   - Extension checks on page load
   - Reload the platform page (Ctrl+R or Cmd+R)

5. **Check cache**
   - Extension caches for 5 minutes
   - Wait 5 minutes and refresh
   - Or clear extension cache in settings

6. **Check platform supported**
   - Currently: YouTube, Twitter (badges)
   - Other platforms: Coming soon

## 🌐 Network & Connection Issues

### Slow or Timeout Errors

**Symptoms**: "Request timeout", "Network error", very slow loading

**Solutions:**

1. **Check internet connection**
   - Test other websites
   - Restart router if needed
   - Use wired connection if available

2. **Check RPC provider status**
   - Networks have RPC endpoints that can be slow
   - Switch RPC in MetaMask:
     - Settings → Networks → [Your Network] → Edit
     - Try different RPC URL from [Chainlist](https://chainlist.org)

3. **Try different network**
   - If Base is slow, try Polygon
   - Or switch to testnet to test

4. **Use VPN or different DNS**
   - Some ISPs block blockchain RPCs
   - Try Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)
   - Or use VPN

### IPFS Access Issues

**Symptoms**: Can't view manifests, "IPFS gateway timeout", content not loading

**Solutions:**

1. **Try different IPFS gateway**
   - Replace `gateway.ipfs.io` with:
   - `cloudflare-ipfs.com`
   - `dweb.link`
   - `ipfs.io`

2. **Wait and retry**
   - IPFS can be slow first time
   - Content gets cached after first access
   - Try again in 1-2 minutes

3. **Check IPFS CID is correct**
   - Should start with `Qm` or `bafy`
   - Check no characters missing
   - Verify CID in your dashboard

4. **Use local IPFS node** (Advanced)
   - Install IPFS Desktop
   - Run local node
   - Configure Internet ID to use local gateway

## 💻 Browser & App Issues

### Browser Extension Not Working

**Symptoms**: Extension icon gray, popup doesn't open, verification doesn't work

**Solutions:**

1. **Check extension installed correctly**
   - Browser extensions list should show "Internet ID"
   - If not, reinstall from [Extension Guide](./browser-extension.md)

2. **Update extension**
   - Check for updates in extension store
   - Or reinstall latest version from GitHub

3. **Check permissions**
   - Extension needs certain permissions
   - Browser → Extensions → Internet ID → Permissions
   - Make sure all required permissions granted

4. **Check API endpoint configured**
   - Click extension icon → Settings
   - API endpoint should be set
   - Default: `https://app.internet-id.io/api`

5. **Check platform supported**
   - Extension only works on supported platforms
   - See list in [Extension Guide](./browser-extension.md#supported-platforms)

6. **Reload extension**
   - Browser → Extensions → Toggle extension off/on
   - Or remove and reinstall

### Web App Issues

**Symptoms**: Page won't load, features not working, errors in UI

**Solutions:**

1. **Clear browser cache**
   - Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
   - Clear cached images and files
   - Close and reopen browser

2. **Disable browser extensions**
   - Ad blockers can interfere
   - Privacy extensions might block wallet
   - Disable temporarily to test

3. **Try different browser**
   - Chrome, Firefox, Brave all supported
   - Safari works but less tested

4. **Check browser console**
   - Press F12 → Console tab
   - Look for error messages (red text)
   - Share errors with support if asking for help

5. **Update browser**
   - Make sure using latest version
   - Older browsers might not support modern features

## 🆘 Getting More Help

### Before Contacting Support

Please gather:
1. What you were trying to do
2. What happened instead
3. Error messages (screenshot if possible)
4. Browser and version
5. Wallet and version
6. Network you're using
7. Transaction hash (if applicable)

### How to Get Help

**Community Support (Fastest):**
- Discord: https://discord.gg/internetid
- Active community can often help immediately

**Check Existing Resources:**
- [FAQ](./faq.md) - Common questions
- [User Guide Index](./INDEX.md) - All documentation
- [GitHub Issues](https://github.com/subculture-collective/internet-id/issues) - Known issues

**Contact Support:**
- Email: support@internet-id.io
- Response time: 24-48 hours
- Include information from "Before Contacting Support" above

**Report Bugs:**
- [GitHub Issues](https://github.com/subculture-collective/internet-id/issues/new)
- Choose "Bug Report" template
- Provide detailed reproduction steps

**Security Issues:**
- Email: security@subculture.io
- Use GitHub Security Advisory for sensitive issues
- See [Security Policy](../SECURITY_POLICY.md)

## 📚 Related Guides

- [Getting Started](./getting-started.md) - Setup instructions
- [FAQ](./faq.md) - Common questions
- [Uploading Content](./uploading-content.md) - Registration guide
- [Platform Bindings](./platform-bindings.md) - Binding guide
- [Browser Extension](./browser-extension.md) - Extension guide
