// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ContentRegistry {
    struct Entry {
        address creator;
        bytes32 contentHash;
        string manifestURI;
        uint64 timestamp;
    }

    mapping(bytes32 => Entry) public entries;

    // platform bindings: keccak256(platform, ":", platformId) -> contentHash
    mapping(bytes32 => bytes32) public platformToHash;
    mapping(bytes32 => bytes32[]) public hashToPlatformKeys;

    event ContentRegistered(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp);
    event ManifestUpdated(bytes32 indexed contentHash, string manifestURI, uint64 timestamp);
    event EntryRevoked(bytes32 indexed contentHash, uint64 timestamp);
    event PlatformBound(bytes32 indexed contentHash, string indexed platform, string platformId);

    modifier onlyCreator(bytes32 contentHash) {
        require(entries[contentHash].creator == msg.sender, "Not creator");
        _;
    }

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

    function updateManifest(bytes32 contentHash, string calldata newManifestURI) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        entries[contentHash].manifestURI = newManifestURI;
        emit ManifestUpdated(contentHash, newManifestURI, uint64(block.timestamp));
    }

    function revoke(bytes32 contentHash) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        entries[contentHash].manifestURI = "";
        emit EntryRevoked(contentHash, uint64(block.timestamp));
    }

    function bindPlatform(bytes32 contentHash, string calldata platform, string calldata platformId) external onlyCreator(contentHash) {
        require(entries[contentHash].timestamp != 0, "Not found");
        bytes32 key = _platformKey(platform, platformId);
        require(platformToHash[key] == bytes32(0), "Already bound");
        platformToHash[key] = contentHash;
        hashToPlatformKeys[contentHash].push(key);
        emit PlatformBound(contentHash, platform, platformId);
    }

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

    function _platformKey(string memory platform, string memory platformId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(platform, ":", platformId));
    }
}
