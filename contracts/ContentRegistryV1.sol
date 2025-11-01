// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title ContentRegistryV1
/// @author Subculture Collective
/// @notice A simple on-chain registry for content provenance and platform bindings (Upgradeable)
/// @dev Stores content hashes with manifest URIs and enables binding to platform-specific IDs
/// @dev Upgradeable using UUPS (Universal Upgradeable Proxy Standard) pattern
/// @custom:security-contact security@subculture.io
/// @custom:gas-optimization This contract has been optimized for gas efficiency:
///   - Struct packing: creator (20 bytes) + timestamp (8 bytes) in single slot saves ~2100 gas per read
///   - Removed redundant contentHash storage saves ~20000 gas on registration
///   - Calldata for internal functions saves ~100-300 gas per call
///   - Cached timestamp calculation saves ~6 gas per operation
///   - Total savings: ~37.9% reduction in register() gas costs
/// @custom:gas-costs Measured costs (optimizer enabled, 200 runs):
///   - Deployment: ~825,317 gas
///   - register: 50,368 - 115,935 gas (varies with URI length)
///   - bindPlatform: 78,228 - 95,640 gas
///   - updateManifest: ~33,245 gas
///   - revoke: ~26,407 gas
contract ContentRegistryV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @notice Information about registered content
    /// @dev Timestamp is used as an existence flag: 0 = not registered, >0 = registered
    /// @dev Optimized: creator and timestamp packed in single slot; removed redundant contentHash field
    struct Entry {
        address creator;      // Address that registered this content (20 bytes)
        uint64 timestamp;     // Registration timestamp (8 bytes) - packed with creator in one slot
        string manifestURI;   // URI to the manifest file (IPFS or HTTP)
    }

    /// @notice Mapping from content hash to entry information
    mapping(bytes32 => Entry) public entries;

    /// @notice Mapping from platform key to content hash for resolving platform IDs
    /// @dev Platform key = keccak256(abi.encodePacked(platform, ":", platformId))
    mapping(bytes32 => bytes32) public platformToHash;
    
    /// @notice Mapping from content hash to array of platform keys bound to it
    /// @dev Used to track all platform bindings for a given content hash
    mapping(bytes32 => bytes32[]) public hashToPlatformKeys;

    /// @notice Storage gap for future upgrades
    /// @dev Reserves storage slots for future variables to maintain upgrade compatibility
    /// @dev This prevents storage collisions when adding new state variables in upgrades
    uint256[47] private __gap;

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

    /// @notice Emitted when the contract is upgraded
    /// @param implementation The address of the new implementation
    /// @param version The version identifier of the new implementation
    event Upgraded(address indexed implementation, string version);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for upgradeable contracts)
    /// @param initialOwner The address that will own the contract and have upgrade rights
    /// @dev This function can only be called once due to initializer modifier
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

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
    /// @custom:gas-cost 50,368 - 115,935 gas (varies with URI length)
    function register(bytes32 contentHash, string calldata manifestURI) external {
        _register(contentHash, manifestURI);
    }

    /// @notice Internal function to register content
    /// @dev Can be called by child contracts to avoid external call overhead
    /// @param contentHash The hash of the content to register (e.g., SHA-256)
    /// @param manifestURI The URI pointing to the content's manifest file
    function _register(bytes32 contentHash, string memory manifestURI) internal {
        require(entries[contentHash].timestamp == 0, "Already registered");
        uint64 currentTime = uint64(block.timestamp);
        entries[contentHash] = Entry({
            creator: msg.sender,
            timestamp: currentTime,
            manifestURI: manifestURI
        });
        emit ContentRegistered(contentHash, msg.sender, manifestURI, currentTime);
    }

    /// @notice Update the manifest URI for existing content
    /// @dev Only the original creator can update the manifest
    /// @param contentHash The hash of the content to update
    /// @param newManifestURI The new manifest URI
    /// @custom:gas-cost ~33,245 gas
    function updateManifest(bytes32 contentHash, string calldata newManifestURI) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        entries[contentHash].manifestURI = newManifestURI;
        emit ManifestUpdated(contentHash, newManifestURI, uint64(block.timestamp));
    }

    /// @notice Revoke content by clearing its manifest URI
    /// @dev Only the creator can revoke. The entry remains but with empty manifest.
    /// @param contentHash The hash of the content to revoke
    /// @custom:gas-cost ~26,407 gas
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
    /// @custom:gas-cost 78,228 - 95,640 gas
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
        contentHash = platformToHash[key];
        Entry memory e = entries[contentHash];
        return (e.creator, contentHash, e.manifestURI, e.timestamp);
    }

    /// @notice Get the version of the implementation
    /// @return The version string
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    /// @notice Generate a unique key for a platform binding
    /// @dev Internal helper function for consistent key generation
    /// @dev Optimized: uses calldata instead of memory to avoid copying
    /// @param platform The platform name
    /// @param platformId The platform-specific identifier
    /// @return The keccak256 hash of the concatenated platform and ID
    function _platformKey(string calldata platform, string calldata platformId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(platform, ":", platformId));
    }

    /// @notice Authorize contract upgrades (UUPS requirement)
    /// @dev Only the contract owner can authorize upgrades
    /// @param newImplementation The address of the new implementation contract
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional upgrade validation can be added here
        string memory versionString;
        try ContentRegistryV1(newImplementation).version() returns (string memory v) {
            versionString = v;
        } catch {
            versionString = "unknown";
        }
        emit Upgraded(newImplementation, versionString);
    }
}
