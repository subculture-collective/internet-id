// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ContentRegistry
/// @author Subculture Collective
/// @notice A simple on-chain registry for content provenance and platform bindings
/// @dev Stores content hashes with manifest URIs and enables binding to platform-specific IDs
contract ContentRegistry {
    /// @notice Information about registered content
    /// @dev Timestamp is used as an existence flag: 0 = not registered, >0 = registered
    struct Entry {
        address creator;      // Address that registered this content
        bytes32 contentHash;  // Hash of the content (e.g., SHA-256)
        string manifestURI;   // URI to the manifest file (IPFS or HTTP)
        uint64 timestamp;     // Registration timestamp (block.timestamp)
    }

    /// @notice Mapping from content hash to entry information
    mapping(bytes32 => Entry) public entries;

    /// @notice Mapping from platform key to content hash for resolving platform IDs
    /// @dev Platform key = keccak256(abi.encodePacked(platform, ":", platformId))
    mapping(bytes32 => bytes32) public platformToHash;
    
    /// @notice Mapping from content hash to array of platform keys bound to it
    /// @dev Used to track all platform bindings for a given content hash
    mapping(bytes32 => bytes32[]) public hashToPlatformKeys;

    /// @notice Emitted when new content is registered
    /// @param contentHash The hash of the registered content
    /// @param creator The address that registered the content
    /// @param manifestURI The URI pointing to the content manifest
    /// @param timestamp The block timestamp when registered
    event ContentRegistered(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp);
    
    /// @notice Emitted when a manifest URI is updated
    /// @param contentHash The hash of the content being updated
    /// @param manifestURI The new manifest URI
    /// @param timestamp The block timestamp when updated
    event ManifestUpdated(bytes32 indexed contentHash, string manifestURI, uint64 timestamp);
    
    /// @notice Emitted when content is revoked (manifest cleared)
    /// @param contentHash The hash of the revoked content
    /// @param timestamp The block timestamp when revoked
    event EntryRevoked(bytes32 indexed contentHash, uint64 timestamp);
    
    /// @notice Emitted when a platform ID is bound to content
    /// @param contentHash The hash of the content being bound
    /// @param platform The platform name (e.g., "youtube", "twitter")
    /// @param platformId The platform-specific identifier
    event PlatformBound(bytes32 indexed contentHash, string indexed platform, string platformId);

    /// @notice Restricts function access to the content creator
    /// @param contentHash The content hash to check ownership for
    modifier onlyCreator(bytes32 contentHash) {
        require(entries[contentHash].creator == msg.sender, "Not creator");
        _;
    }

    /// @notice Register new content with its manifest URI
    /// @dev Content can only be registered once. Timestamp is used as existence check.
    /// @param contentHash The hash of the content to register (e.g., SHA-256)
    /// @param manifestURI The URI pointing to the content's manifest file
    /// @custom:security Uses timestamp == 0 to check if content is already registered
    function register(bytes32 contentHash, string calldata manifestURI) external {
        require(entries[contentHash].timestamp == 0, "Already registered");
        entries[contentHash] = Entry({
            creator: msg.sender,
            contentHash: contentHash,
            manifestURI: manifestURI,
            timestamp: uint64(block.timestamp)
        });
        emit ContentRegistered(contentHash, msg.sender, manifestURI, uint64(block.timestamp));
    }

    /// @notice Update the manifest URI for existing content
    /// @dev Only the original creator can update the manifest
    /// @param contentHash The hash of the content to update
    /// @param newManifestURI The new manifest URI
    function updateManifest(bytes32 contentHash, string calldata newManifestURI) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        entries[contentHash].manifestURI = newManifestURI;
        emit ManifestUpdated(contentHash, newManifestURI, uint64(block.timestamp));
    }

    /// @notice Revoke content by clearing its manifest URI
    /// @dev Only the creator can revoke. The entry remains but with empty manifest.
    /// @param contentHash The hash of the content to revoke
    function revoke(bytes32 contentHash) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        entries[contentHash].manifestURI = "";
        emit EntryRevoked(contentHash, uint64(block.timestamp));
    }

    /// @notice Bind a platform-specific ID to registered content
    /// @dev Useful for linking re-encoded versions (e.g., YouTube videos) to original content
    /// @param contentHash The hash of the original content
    /// @param platform The platform name (e.g., "youtube", "twitter")
    /// @param platformId The platform-specific identifier (e.g., video ID)
    /// @custom:security Each platform+ID combination can only be bound once
    function bindPlatform(bytes32 contentHash, string calldata platform, string calldata platformId) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        bytes32 key = _platformKey(platform, platformId);
        require(platformToHash[key] == bytes32(0), "Already bound");
        platformToHash[key] = contentHash;
        hashToPlatformKeys[contentHash].push(key);
        emit PlatformBound(contentHash, platform, platformId);
    }

    /// @notice Resolve a platform ID to its associated content information
    /// @dev Returns empty values if the platform ID is not bound
    /// @param platform The platform name to query
    /// @param platformId The platform-specific identifier to query
    /// @return creator The address that registered the content
    /// @return contentHash The hash of the registered content
    /// @return manifestURI The manifest URI for the content
    /// @return timestamp The registration timestamp
    function resolveByPlatform(string calldata platform, string calldata platformId)
        external
        view
        returns (address creator, bytes32 contentHash, string memory manifestURI, uint64 timestamp)
    {
        bytes32 key = _platformKey(platform, platformId);
        bytes32 ch = platformToHash[key];
        Entry memory e = entries[ch];
        return (e.creator, e.contentHash, e.manifestURI, e.timestamp);
    }

    /// @notice Generate a unique key for a platform binding
    /// @dev Internal helper function for consistent key generation
    /// @param platform The platform name
    /// @param platformId The platform-specific identifier
    /// @return The keccak256 hash of the concatenated platform and ID
    function _platformKey(string memory platform, string memory platformId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(platform, ":", platformId));
    }
}
