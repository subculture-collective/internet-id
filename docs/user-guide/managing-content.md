# Managing Your Content

Learn how to view, organize, update, and manage your registered content on Internet ID.

## 📋 Table of Contents

- [Dashboard Overview](#dashboard-overview)
- [Viewing Content](#viewing-content)
- [Organizing Content](#organizing-content)
- [Updating Content](#updating-content)
- [Sharing Content](#sharing-content)
- [Batch Operations](#batch-operations)
- [Advanced Management](#advanced-management)

## Dashboard Overview

The Dashboard is your command center for all registered content.

### Access the Dashboard

1. Go to [app.internet-id.io](https://app.internet-id.io)
2. Click **"Connect Wallet"** (top right)
3. Approve connection in MetaMask
4. Click **"Dashboard"** in navigation

**No sign-in required** for basic features! Wallet connection is all you need.

### Dashboard Layout

**Top Bar**:

- Network selector (Base, Polygon, etc.)
- Wallet address (click to copy)
- Balance display
- Settings menu

**Main Area**:

- Content list (grid or table view)
- Filters and search
- Sort options
- Bulk actions toolbar

**Sidebar** (optional):

- Quick stats (total registered, verified, etc.)
- Recent activity
- Quick actions

## Viewing Content

### Content List View

**Default view** shows all your registered content:

**Grid View** (default):

```
┌─────────────┬─────────────┬─────────────┐
│ Video 1     │ Image 2     │ Doc 3       │
│ [thumbnail] │ [thumbnail] │ [thumbnail] │
│ ✓ Verified  │ ⚠ Pending   │ ✓ Verified  │
│ Nov 1, 2025 │ Nov 2, 2025 │ Nov 2, 2025 │
└─────────────┴─────────────┴─────────────┘
```

**Table View**:

```
Title         Hash      Status    Registered    Bindings
──────────────────────────────────────────────────────────
My Video      9f86...   ✓ Verified  Nov 1, 2025   3
My Image      a7b2...   ⚠ Pending   Nov 2, 2025   0
My Document   3c4d...   ✓ Verified  Nov 2, 2025   1
```

**Switch views**: Click grid/table icon in top-right

### Content Details Page

Click any item to see full details:

**Overview**:

- Content hash (fingerprint)
- Registration date and time
- Network and transaction hash
- Creator address
- Current status

**Metadata**:

- Title
- Description
- Tags
- License
- Custom fields

**Platform Bindings**:

- List of all bound platforms
- Add new binding
- Remove existing bindings

**Verification**:

- Verification badge preview
- Shareable verification link
- QR code
- Embed code

**Actions**:

- Share
- Download proof
- Update metadata
- Add binding
- View on block explorer

### Filtering Content

**By Status**:

- ✅ Verified
- ⚠️ Pending
- ❌ Failed
- 🔄 All

**By Date**:

- Today
- This week
- This month
- Custom range

**By Type**:

- Videos
- Images
- Audio
- Documents
- Other

**By Tags**:

- Select from existing tags
- Combine multiple tags (AND/OR)

**By Network**:

- Base
- Polygon
- Ethereum
- All networks

**By Bindings**:

- Has bindings
- No bindings
- Specific platform (YouTube, Twitter, etc.)

### Searching Content

**Search bar** (top of dashboard):

```
🔍 Search by title, hash, or tag...
```

**Search types**:

- **Title**: Full-text search in titles
- **Hash**: Partial or full content hash
- **Tags**: Match any tag
- **Description**: Search in descriptions

**Example searches**:

```
video                    # Find all content with "video" in title
9f86d081                # Find content with hash starting with 9f86d081
#important              # Find all content tagged "important"
```

### Sorting Content

**Sort options**:

- **Newest first** (default)
- **Oldest first**
- **Title (A-Z)**
- **Title (Z-A)**
- **Most bindings**
- **Recently updated**

Click column headers in table view to sort.

## Organizing Content

### Using Tags

**Add tags during registration**:

```
Tags: video, tutorial, 2025, beginner
```

**Add tags to existing content**:

1. Open content details
2. Click "Edit" next to Tags
3. Add or remove tags
4. Save changes

**Tag best practices**:

- Use consistent naming (lowercase, no spaces)
- Categories: type (video, image), topic (tutorial, music), date (2025)
- Use sparingly (3-7 tags per item)
- Create a tagging system and stick to it

**Example tag system**:

```
Type tags:    video, image, audio, document
Topic tags:   tutorial, review, vlog, music
Status tags:  draft, published, archived
Date tags:    2025-11, 2025, q4-2025
```

### Creating Collections (Coming Soon)

Group related content into collections:

**Example collections**:

- "2025 Video Series"
- "Album: My First Release"
- "Portfolio - Client Work"
- "Tutorial Series"

**Features**:

- Add/remove content
- Share entire collection
- Bulk operations on collection
- Collection verification badge

### Using Metadata

**Standard fields**:

- **Title**: Display name
- **Description**: Longer explanation
- **Tags**: Categories and keywords
- **License**: Rights (e.g., "CC-BY-4.0", "All Rights Reserved")

**Custom fields** (advanced):

- Add any JSON-compatible data
- Examples: `client: "Acme Corp"`, `project: "Q4 Campaign"`

**Update metadata**:

1. Content details → "Edit Metadata"
2. Change fields
3. Save (may require re-signing manifest)

## Updating Content

### Update Metadata (Off-Chain)

**What you can update**:

- Title, description, tags
- Custom metadata fields
- Display settings

**How**:

1. Content details → "Edit"
2. Update fields
3. Click "Save"
4. Changes reflected immediately

**Cost**: Free (no blockchain transaction)

**Note**: Original manifest on IPFS is immutable, but display metadata can change.

### Update Platform Bindings

**Add new binding**:

1. Content details → "Add Platform Link"
2. Select platform
3. Enter URL or ID
4. Confirm transaction (~$0.01 gas)

**Remove binding**:

1. Content details → Platform Bindings section
2. Click "Remove" (❌) next to binding
3. Confirm transaction (~$0.01 gas)

**Update binding**:

- Currently requires remove + add new
- Direct update feature coming soon

### Re-register Content

If you need to register the same file again (e.g., on different network):

1. Go to "Register Content"
2. Upload file or select from computer
3. Choose different network
4. Register again

**Result**: Same content, multiple networks, independent registrations.

## Sharing Content

### Verification Badge

**Get badge URL**:

1. Content details → "Share" section
2. Copy badge image URL
3. Use in websites, videos, social media

**Badge options**:

- Theme: Light or dark
- Size: Small (120px) to large (640px)
- Custom dimensions

**Example**:

```
https://app.internet-id.io/api/badge/9f86d081...?theme=dark&w=200
```

### Verification Link

**Public verification page**:

```
https://app.internet-id.io/verify?hash=9f86d081...
```

**Share this link**:

- Video descriptions
- Social media bios
- Website footer
- Press releases
- Email signatures

### QR Code

**Get QR code**:

1. Content details → "Share" section
2. Click "Generate QR Code"
3. Download PNG
4. Use in videos, print materials, presentations

**QR code size**: 300x300px by default, customizable

**Where to use QR codes**:

- Video outros
- Lower thirds
- Print materials
- Conference slides
- Business cards

### Embed Code

**Get embed HTML**:

1. Content details → "Share" section
2. Copy embed code
3. Paste into your website

**Example embed**:

```html
<a href="https://app.internet-id.io/verify?hash=9f86d081...">
  <img
    src="https://app.internet-id.io/api/badge/9f86d081..."
    alt="Verified by Internet ID"
    width="200"
  />
</a>
```

### Copy All

**One-click copy** everything:

1. Click "Copy All" button
2. Get full bundle:
   - Verification link
   - Badge URL
   - QR code URL
   - Embed HTML
   - Share text template

**Use case**: Quickly grab everything to add to video description or website.

## Batch Operations

### Select Multiple Items

**Select in dashboard**:

1. Toggle "Select Mode" (checkbox icon)
2. Click items to select
3. Or "Select All" for current filter

**Selected items** highlighted with checkmark.

### Bulk Actions

**Available bulk actions**:

- Add tags to all selected
- Remove tags from all selected
- Export selected items
- Generate proof bundles
- Update metadata fields
- Delete selected (removes from display, not blockchain)

**Example - Bulk tag**:

1. Select 10 videos
2. Click "Add Tags" (bulk action toolbar)
3. Enter: `#batch-processed, #2025-11`
4. All 10 videos now have these tags

### Batch Export

**Export selected content**:

1. Select items
2. Click "Export" (bulk action toolbar)
3. Choose format (JSON, CSV)
4. Download file

**What's exported**:

- Content hashes
- Metadata
- Registration details
- Platform bindings
- Optionally: Proof bundles

**Use case**: Backup, reporting, migration.

### Batch Proof Generation

**Generate proofs for multiple items**:

1. Select items
2. Click "Generate Proofs"
3. Wait for processing
4. Download ZIP with all proof.json files

**Use case**: Distribute proof bundles with content releases.

## Advanced Management

### Multi-Network View

**View same content across networks**:

1. Dashboard → Settings → "Multi-Network View"
2. Enable toggle
3. See content from all networks at once

**Helpful when**:

- You registered on multiple networks
- Checking registration across chains
- Comparing gas costs

### Content Analytics (Coming Soon)

**Metrics per content**:

- Views on verification page
- Platform binding clicks
- QR code scans
- Badge impressions

**Use case**: Understand engagement, which content performs best.

### Scheduled Actions (Coming Soon)

**Schedule future actions**:

- Publish verification link at specific time
- Auto-bind when platform post goes live
- Scheduled metadata updates

### API Access

**For advanced users/developers**:

Get your API key:

1. Dashboard → Settings → "API Access"
2. Click "Generate API Key"
3. Copy and store securely

**Use API key** to:

- Programmatic content management
- Custom integrations
- Automated workflows

See [Public API Documentation](../PUBLIC_API.md) for details.

### Content Archive

**Archive old content**:

1. Select content
2. Click "Archive"
3. Content hidden from main view
4. Still on blockchain, just not displayed

**View archived**:

1. Dashboard → Filters → "Show Archived"

**Unarchive**:

1. Select archived item
2. Click "Unarchive"

**Use case**: Hide old content without deleting blockchain records.

### Transfer Ownership (Future Feature)

**Planned feature**: Transfer content registration to different wallet

**Use case**: Organization changes, wallet migration, selling content.

## Tips & Best Practices

### Naming Conventions

**Be consistent**:

```
Good:
- "Tutorial 01 - Getting Started"
- "Tutorial 02 - Advanced Features"
- "Tutorial 03 - Best Practices"

Avoid:
- "getting started tut"
- "advanced TUTORIAL"
- "BestPractices"
```

### Metadata Organization

**Complete metadata** for every item:

- ✅ Descriptive title
- ✅ Clear description
- ✅ Relevant tags (3-7)
- ✅ License/rights
- ✅ Date created

**Why**: Easier to find, better organization, professional appearance.

### Regular Maintenance

**Weekly**:

- Review pending registrations
- Add missing platform bindings
- Update tags and metadata

**Monthly**:

- Export backup
- Review analytics (when available)
- Archive old content

**Quarterly**:

- Audit all bindings (check links still work)
- Update descriptions
- Reorganize collections

### Backup Strategy

**Always maintain backups**:

**Option 1**: Use dashboard export

```
Dashboard → Select All → Export → JSON
```

**Option 2**: Use CLI

```bash
internet-id export --include-proofs > backup.json
```

**Option 3**: Manual blockchain queries

- Content hash is on blockchain forever
- Can always be reconstructed

**Store backups**:

- Local computer
- Cloud storage (encrypted)
- Physical backup (for recovery keys)

## Troubleshooting

### Content Not Showing

**Problem**: Registered content doesn't appear in dashboard

**Solutions**:

1. Check you're on the correct network
2. Wait 1-2 minutes for indexing
3. Refresh the page
4. Clear cache
5. Check transaction confirmed on block explorer

### Can't Update Metadata

**Problem**: Changes to metadata don't save

**Solutions**:

1. Make sure wallet is connected
2. Check you're the creator (only creator can update)
3. Try refreshing and editing again
4. Check browser console for errors

### Bindings Not Displaying

**Problem**: Platform bindings don't show

**Solutions**:

1. Check transaction confirmed
2. Wait for indexing (1-2 minutes)
3. Refresh page
4. Check correct network selected

### Export Fails

**Problem**: Can't export content

**Solutions**:

1. Try smaller selection (if bulk exporting)
2. Check browser has storage permissions
3. Try different browser
4. Use CLI export instead

## Next Steps

- **[Platform Bindings](./platform-bindings.md)** - Link to platforms
- **[Verifying Content](./verifying-content.md)** - How others verify
- **[CLI Usage](./cli-usage.md)** - Command-line management
- **[FAQ](./faq.md)** - Common questions

## Get Help

Questions about managing content?

- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting](./troubleshooting.md)** - Technical issues
- **Discord** - Community support
- **Email** - support@internet-id.io
