# Privacy and Security

Learn how Internet ID protects your privacy and secures your content.

## 🔒 Privacy Overview

Internet ID is designed with **privacy by default**:

- 🔐 **Your original files stay private** (unless you choose to upload)
- 🔐 **Minimal data collection** (only what's necessary)
- 🔐 **No tracking** (we don't monitor your activity)
- 🔐 **You control your data** (wallet-based ownership)
- 🔐 **Open source** (audit the code yourself)

## 🛡️ What Data is Stored?

### On Blockchain (Public, Permanent)

**What's stored**:

```
- Content hash (SHA-256 fingerprint)
- Your wallet address
- Timestamp (when registered)
- Manifest URI (pointer to IPFS)
```

**Example on-chain record**:

```json
{
  "contentHash": "0x9f86d081884c7d659a2feaa0...",
  "creator": "0x1234567890abcdef...",
  "timestamp": 1698777600,
  "manifestURI": "ipfs://QmXyz123..."
}
```

**Privacy implications**:

- ✅ Content hash reveals nothing about the file
- ✅ Wallet address is pseudonymous (not tied to real identity)
- ✅ No file content stored on-chain
- ⚠️ This data is public and permanent

### On IPFS (Public, Distributed)

**What's stored**:

```
Manifest (always):
- Content hash
- Your signature
- Optional metadata (title, description)

Original file (only if you opt-in):
- Your entire file
```

**Example manifest**:

```json
{
  "content_hash": "9f86d081884c7d659a2feaa0...",
  "created_at": "2025-11-02T00:00:00Z",
  "creator": "0x1234567890abcdef...",
  "signature": "0xabcdef...",
  "metadata": {
    "title": "My Video",
    "description": "Optional description"
  }
}
```

**Privacy implications**:

- ✅ Manifest hash is derived from content, not personally identifiable
- ✅ You control what metadata to include
- ⚠️ If you upload file to IPFS, it's publicly accessible
- ⚠️ IPFS content can't be deleted (design feature)

### In Our Database (Private, Controlled)

**What's stored**:

```
- Platform bindings (YouTube URL ↔ Content hash)
- Optional: Email (if you sign in)
- Optional: Linked social accounts (if you connect)
- API usage stats (rate limiting)
```

**Privacy implications**:

- ✅ Not stored on public blockchain
- ✅ Can be deleted upon request (GDPR compliant)
- ✅ Protected by standard database security
- ✅ Not shared with third parties

### What We DON'T Store

- ❌ Private keys (you control these)
- ❌ Wallet passwords
- ❌ File contents (unless you opt-in to upload)
- ❌ Browsing history
- ❌ IP addresses (beyond standard server logs)
- ❌ Analytics beyond essential metrics

## 🔐 Privacy Modes

### Privacy Mode (Default) 🔒

**What happens**:

1. File is hashed locally on your device
2. Manifest is created and signed
3. Manifest uploaded to IPFS
4. Hash registered on blockchain
5. **Original file NEVER leaves your device**

**What's public**:

- Content hash (reveals nothing about content)
- Your wallet address (pseudonymous)
- Manifest metadata (you control what's included)

**What's private**:

- Original file (stays on your device)
- File content (nobody can see it)
- File name (not included in hash or manifest)

**Best for**:

- Unreleased content
- Sensitive material
- Personal files
- Anything you want to keep private

**Example**: Register your unpublished book manuscript. Proves you had it by date X, but nobody can read it unless you share separately.

### Public Mode 🌐

**What happens**:

1. File is hashed locally
2. Manifest created and signed
3. **File uploaded to IPFS**
4. Manifest uploaded to IPFS
5. Hash registered on blockchain

**What's public**:

- Everything in Privacy Mode, PLUS:
- Original file on IPFS (anyone can download)

**Best for**:

- Content you want to distribute
- Public releases
- Open source projects
- Marketing materials

**Example**: Register and upload your music video. Anyone can download and verify it's authentic.

### Which Mode to Choose?

**Use Privacy Mode when**:

- ✅ Content is not yet public
- ✅ You want to keep the file private
- ✅ You only need proof of creation
- ✅ You'll share file through other means

**Use Public Mode when**:

- ✅ Content is already public or will be
- ✅ You want to distribute via IPFS
- ✅ You want one canonical source
- ✅ Permanent public access is OK

**Can't decide?** Start with Privacy Mode. You can always upload later.

## 🔑 Wallet Security

Your wallet is the key to your content ownership.

### Best Practices

**Setup**:

- ✅ Write recovery phrase on paper (not digital)
- ✅ Store in a safe place (fireproof safe, safety deposit box)
- ✅ Never share recovery phrase with anyone
- ✅ Use strong, unique password for wallet
- ✅ Enable auto-lock (lock after 5-10 minutes)

**Usage**:

- ✅ Review every transaction before approving
- ✅ Only connect wallet to trusted sites
- ✅ Check you're on the correct website (URL)
- ✅ Disconnect wallet when done (optional but good practice)

**Avoid**:

- ❌ Storing recovery phrase digitally
- ❌ Sharing wallet password
- ❌ Approving transactions without reviewing
- ❌ Connecting to unknown websites
- ❌ Clicking suspicious links in emails/DMs

### What if My Wallet is Compromised?

**If you suspect compromise**:

1. **Immediately create new wallet**
2. **Transfer any funds to new wallet**
3. **DO NOT register new content with compromised wallet**

**Impact on existing registrations**:

- ✅ Already-registered content is still valid
- ✅ On-chain records can't be changed
- ⚠️ Attacker could register new content in your name
- ⚠️ Attacker could bind platform URLs to your content (confuse viewers)

**Recovery**:

- Register new content with new wallet
- Publish your new creator address
- Mark old wallet as compromised (contact us)
- Future feature: Revocation of compromised wallet

### Hardware Wallets (Most Secure)

For maximum security, consider a hardware wallet:

**Options**:

- **Ledger** - Most popular, easy to use
- **Trezor** - Open source, very secure
- **GridPlus** - New, modern interface

**Benefits**:

- Private keys never leave the device
- Protected even if computer is compromised
- Requires physical confirmation for transactions

**Drawbacks**:

- Costs $50-200
- Slightly less convenient
- Learning curve

**Recommendation**: If you're registering valuable or sensitive content, invest in a hardware wallet.

## 🛡️ Data Protection

### How We Protect Your Data

**In Transit** (Network):

- ✅ HTTPS/TLS encryption for all connections
- ✅ Secure WebSocket connections
- ✅ No plain-text transmission

**At Rest** (Storage):

- ✅ Database encryption
- ✅ Encrypted backups
- ✅ Access controls and authentication

**Access Control**:

- ✅ Role-based access (team members have minimum necessary access)
- ✅ Audit logs (all access is logged)
- ✅ Regular security reviews

**Infrastructure**:

- ✅ Regular security updates
- ✅ Firewall protection
- ✅ DDoS mitigation
- ✅ Redundant backups

### Data Retention

**On Blockchain**: Permanent (by design, can't be deleted)
**On IPFS**: Permanent (while anyone pins it)
**In Database**:

- Bindings: Indefinite (until you delete)
- Logs: 90 days
- Backups: 30 days

**Right to Deletion** (GDPR):

- Email and linked accounts: Can be deleted on request
- Platform bindings: Can be removed on-chain (gas fee required)
- On-chain records: Cannot be deleted (blockchain immutability)
- IPFS content: Cannot be deleted (distributed system)

### Third-Party Services

We use these trusted services:

**IPFS Providers**:

- Web3.Storage (Cloudflare)
- Pinata
- Infura

**Blockchain RPCs**:

- Alchemy
- Infura
- Public RPCs

**Authentication** (Optional):

- NextAuth (self-hosted)
- OAuth providers (GitHub, Google)

**All follow industry-standard security practices.**

## 🚨 Threat Model

### What Internet ID Protects Against

**✅ Content Theft**:

- Prove you created content first
- Timestamped proof of creation
- Blockchain-backed evidence

**✅ Impersonation**:

- Only you can register with your wallet
- Wallet signature proves identity
- Public verification for all

**✅ Deepfakes**:

- Signal of human-created content
- Provenance trail
- Verification badges

**✅ Platform Censorship**:

- Proof exists even if platforms remove content
- IPFS distribution resistant to takedowns
- Multi-platform bindings preserve evidence

### What Internet ID DOESN'T Protect Against

**❌ Content Accuracy**:

- Internet ID proves WHO created content
- Does NOT prove content is "true" or "accurate"
- Critical thinking still required

**❌ Identity Verification**:

- Wallet address is pseudonymous
- Doesn't prove real-world identity
- Additional verification needed for that

**❌ Copyright Enforcement**:

- Internet ID is evidence, not enforcement
- Legal action still required for copyright violations
- Complements but doesn't replace copyright

**❌ Content Re-upload**:

- Others can still copy and re-upload
- Internet ID helps viewers distinguish original from copy
- But doesn't prevent copying

### Realistic Expectations

**Internet ID is one signal among many:**

**✅ Use it as:**

- Evidence of provenance
- Proof of creation date
- Signal of authenticity
- Complement to other verification methods

**❌ Don't rely on it alone for:**

- Legal identity verification
- Copyright enforcement
- Truth/accuracy claims
- Complete protection against all fakes

## 🔍 Transparency

### Open Source

**All code is public**:

- Smart contracts: [GitHub](https://github.com/subculture-collective/internet-id/tree/main/contracts)
- Web app: [GitHub](https://github.com/subculture-collective/internet-id/tree/main/web)
- Browser extension: [GitHub](https://github.com/subculture-collective/internet-id/tree/main/extension)
- CLI tool: [GitHub](https://github.com/subculture-collective/internet-id/tree/main/cli)

**Benefits**:

- Audit the code yourself
- Community review
- No hidden behavior
- Contribute improvements

### Audits

**Smart Contracts**:

- ✅ Automated analysis (Slither)
- ✅ Internal security review
- 🔄 Professional audit planned

**API & Infrastructure**:

- Regular security testing
- Penetration testing planned
- Vulnerability disclosure program

**See**: [Security Policy](../SECURITY_POLICY.md)

### Bug Bounty Program

Found a security issue? We reward responsible disclosure:

- **Critical**: Up to $1,000
- **High**: Up to $500
- **Medium**: Up to $250
- **Low**: Recognition + thanks

**Report to**: security@subculture.io

**See**: [Security Policy](../SECURITY_POLICY.md) for details.

## 📜 Compliance

### GDPR (EU Data Protection)

Internet ID complies with GDPR:

- ✅ Right to access (view your data)
- ✅ Right to deletion (delete non-blockchain data)
- ✅ Right to portability (export your data)
- ✅ Right to be forgotten (limited by blockchain immutability)
- ✅ Minimal data collection
- ✅ Clear consent mechanisms

**Note**: Blockchain data cannot be deleted due to technical design. This is noted in our terms and during registration.

### CCPA (California Privacy)

For California residents:

- ✅ Right to know (what data we collect)
- ✅ Right to delete (non-blockchain data)
- ✅ Right to opt-out (of any data sales - we don't sell data)
- ✅ Right to non-discrimination

### Other Regulations

We strive to comply with:

- COPPA (children's privacy)
- PIPEDA (Canada)
- Other regional data protection laws

## 🆘 Privacy Concerns?

### How to Minimize Your Footprint

1. **Use Privacy Mode** (don't upload files)
2. **Minimal metadata** (don't include unnecessary info)
3. **Fresh wallet** (use dedicated wallet for Internet ID)
4. **Don't link social accounts** (skip OAuth sign-in)
5. **Use Tor** (optional, for maximum anonymity)

### Request Your Data

Want to see what we have?

Email: privacy@internet-id.io with:

- Subject: "Data Request"
- Your wallet address
- Any linked email/accounts

We'll provide within 30 days.

### Request Data Deletion

Want to delete your data?

Email: privacy@internet-id.io with:

- Subject: "Deletion Request"
- Your wallet address
- Any linked email/accounts

**What gets deleted**:

- Email and linked accounts
- Platform bindings (on-chain removal requires gas fee)
- Any other off-chain data

**What CANNOT be deleted**:

- On-chain records (blockchain immutability)
- IPFS content (distributed, can't control all copies)

We'll confirm deletion within 30 days.

## 📚 Learn More

- **[FAQ - Security Questions](./faq.md#security--privacy)** - Common questions
- **[Security Policy](../SECURITY_POLICY.md)** - Report vulnerabilities
- **[Smart Contract Audit](../SMART_CONTRACT_AUDIT.md)** - Technical audit
- **[Browser Extension Security](../BROWSER_EXTENSION_SECURITY.md)** - Extension details

## 💬 Questions?

Privacy or security questions?

- **Email**: privacy@internet-id.io (privacy) or security@subculture.io (security)
- **Discord**: Community support
- **GitHub**: Open source discussion

We take privacy and security seriously! 🔒
