# Platform Verification Guide

This guide explains how to verify content on different platforms using the Internet-ID verification system.

## Supported Platforms

The Internet-ID system supports verification for the following platforms:

- **YouTube** - Video and channel verification
- **TikTok** - Video and user profile verification
- **Instagram** - Posts, reels, and profile verification
- **GitHub** - Repository, file, and gist verification
- **Discord** - Server invite and channel verification
- **LinkedIn** - Profile and post verification

## Platform Verification Mechanisms

### YouTube

**Verification Approach**: Video ID or channel verification via URL parsing

**URL Formats**:

- Standard watch URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short URL: `https://youtu.be/VIDEO_ID`
- Shorts URL: `https://www.youtube.com/shorts/VIDEO_ID`

**Usage**:

```bash
# Bind YouTube video to content
npm run bind:youtube -- <masterFilePath> <youtubeVideoId> <registryAddress>

# Verify YouTube video binding
npm run verify:youtube -- <youtubeUrlOrId> <registryAddress>
```

**Limitations**:

- Requires valid YouTube video ID
- Video must be publicly accessible for verification
- Re-encoded versions on YouTube can be bound to original content

---

### TikTok

**Verification Approach**: Video ID or user profile verification via URL parsing

**URL Formats**:

- Video with username: `https://www.tiktok.com/@username/video/1234567890`
- Video without username: `https://www.tiktok.com/video/1234567890`
- Mobile URL: `https://m.tiktok.com/@user/video/9876543210`

**Extracted ID Format**:

- `@username/video/1234567890` or `video/1234567890`

**Usage**:

```bash
# Bind TikTok video to content
npm run bind:tiktok -- <masterFilePath> <tiktokId> <registryAddress>

# Verify TikTok video binding
npm run verify:tiktok -- <tiktokUrlOrId> <registryAddress>
```

**Limitations**:

- Requires publicly accessible TikTok content
- Platform ID should include username path when available
- TikTok's content algorithm may show re-encoded versions

---

### Instagram

**Verification Approach**: Post shortcode or profile bio verification via URL parsing

**URL Formats**:

- Post URL: `https://www.instagram.com/p/SHORTCODE/`
- Reel URL: `https://www.instagram.com/reel/SHORTCODE/`
- Profile URL: `https://www.instagram.com/username/`

**Extracted ID Format**:

- `p/SHORTCODE` for posts
- `reel/SHORTCODE` for reels
- `username` for profiles

**Usage**:

```bash
# Bind Instagram post to content
npm run bind:instagram -- <masterFilePath> <instagramId> <registryAddress>

# Verify Instagram post binding
npm run verify:instagram -- <instagramUrlOrId> <registryAddress>
```

**Limitations**:

- Requires publicly accessible Instagram content
- Private profiles cannot be verified by third parties
- Instagram may compress or modify uploaded content

---

### GitHub

**Verification Approach**: Repository file or gist verification

**URL Formats**:

- Repository: `https://github.com/user/repo`
- File in repo: `https://github.com/user/repo/blob/main/file.txt`
- Gist: `https://gist.github.com/user/gistid`

**Extracted ID Format**:

- `user/repo` for repositories
- `user/repo/blob/main/file.txt` for files
- `gist/user/gistid` for gists

**Usage**:

```bash
# Bind GitHub repository to content
npm run bind:github -- <masterFilePath> <githubId> <registryAddress>

# Verify GitHub repository binding
npm run verify:github -- <githubUrlOrId> <registryAddress>
```

**Verification Methods**:

1. **Repository README**: Add content hash to README.md
2. **Gist**: Create a gist containing the content hash
3. **File in repo**: Add verification file with content hash

**Limitations**:

- Repository/gist must be publicly accessible
- Verification requires on-chain binding before creating verification proof
- Private repositories cannot be verified by third parties

---

### Discord

**Verification Approach**: Server invite or custom status verification

**URL Formats**:

- Invite URL (discord.gg): `https://discord.gg/INVITE_CODE`
- Invite URL (discord.com): `https://discord.com/invite/INVITE_CODE`
- Channel URL: `https://discord.com/channels/SERVER_ID/CHANNEL_ID`

**Extracted ID Format**:

- `INVITE_CODE` for discord.gg invites
- `invite/INVITE_CODE` for discord.com invites
- `channels/SERVER_ID/CHANNEL_ID` for channel links

**Usage**:

```bash
# Bind Discord server to content
npm run bind:discord -- <masterFilePath> <discordId> <registryAddress>

# Verify Discord server binding
npm run verify:discord -- <discordUrlOrId> <registryAddress>
```

**Verification Methods**:

1. **Server Description**: Add content hash to server description
2. **Custom Status**: Set custom status with content hash
3. **Channel Topic**: Add verification hash to channel topic

**Limitations**:

- Server must be publicly accessible or user must be a member
- Invite codes may expire
- Verification requires appropriate server permissions

---

### LinkedIn

**Verification Approach**: Profile summary or post verification

**URL Formats**:

- Profile: `https://www.linkedin.com/in/username/`
- Post: `https://www.linkedin.com/posts/activity-ID/`
- Company: `https://www.linkedin.com/company/companyname/`

**Extracted ID Format**:

- `in/username` for profiles
- `posts/activity-ID` for posts
- `company/companyname` for companies

**Usage**:

```bash
# Bind LinkedIn profile to content
npm run bind:linkedin -- <masterFilePath> <linkedinId> <registryAddress>

# Verify LinkedIn profile binding
npm run verify:linkedin -- <linkedinUrlOrId> <registryAddress>
```

**Verification Methods**:

1. **Profile Summary**: Add content hash to profile summary
2. **Post Content**: Create a post with the content hash
3. **Company Description**: Add verification to company page

**Limitations**:

- Profile must be publicly visible
- LinkedIn's privacy settings may restrict visibility
- Posts may have limited lifetime or visibility

---

## General Verification Flow

For all platforms, the verification process follows these steps:

1. **Register Content**: Register your original content hash on-chain

   ```bash
   npm run register -- <filePath> <manifestURI> <registryAddress>
   ```

2. **Bind Platform ID**: Bind your platform-specific ID to the content hash

   ```bash
   npm run bind:<platform> -- <masterFilePath> <platformId> <registryAddress>
   ```

3. **Verify Binding**: Verify the platform binding is correct

   ```bash
   npm run verify:<platform> -- <platformUrlOrId> <registryAddress>
   ```

4. **Share Proof**: Generate and share the verification proof with others

## Web UI Integration

All platforms are integrated into the web UI with:

- Platform selection dropdown in One-shot, Bind forms
- Automatic URL parsing for all supported platforms
- Platform-specific verification badges and links
- QR code generation for sharing verification links

## API Integration

The API supports platform verification through:

- `/api/resolve?platform=<platform>&platformId=<id>` - Resolve platform binding
- `/api/public-verify?platform=<platform>&platformId=<id>` - Public verification

## Best Practices

1. **Use Descriptive Platform IDs**: Include full paths (e.g., `user/repo` for GitHub)
2. **Verify Before Sharing**: Always run verification before sharing links
3. **Keep Records**: Save transaction hashes for future reference
4. **Update Documentation**: Document verification locations for your audience
5. **Test Links**: Verify all generated URLs work correctly

## Security Considerations

- **On-chain Verification**: All bindings are immutable once registered on-chain
- **Signature Validation**: Content hash signatures are cryptographically verified
- **Creator Authority**: Only content creators can bind platform IDs
- **Manifest Integrity**: Manifests are validated against on-chain data

## Troubleshooting

### Common Issues

1. **Invalid Platform ID**: Ensure URL format matches platform requirements
2. **No Binding Found**: Content must be registered before binding platforms
3. **Signature Mismatch**: Manifest must be signed by content creator
4. **Network Errors**: Check RPC URL and network connectivity

### Support

For additional help:

- Check the [GitHub Issues](https://github.com/subculture-collective/internet-id/issues)
- Review test files for examples: `test/verify-*.test.ts`
- See the main [README.md](../README.md) for general setup

## Future Enhancements

Planned features for platform verification:

- Automated verification proof generation
- Platform-specific metadata extraction
- Multi-chain support for bindings
- Extended platform support (more social networks, content platforms)
