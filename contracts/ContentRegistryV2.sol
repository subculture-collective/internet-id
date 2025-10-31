// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ContentRegistryV1.sol";

/// @title ContentRegistryV2
/// @author Subculture Collective
/// @notice Example V2 implementation demonstrating upgrade capability
/// @dev This is an example contract for testing upgrades - adds new functionality
/// @custom:security-contact security@subculture.io
contract ContentRegistryV2 is ContentRegistryV1 {
    /// @notice Counter for total registrations (new feature in V2)
    uint256 public totalRegistrations;

    /// @notice Storage gap adjustment for V2 (reduced by 1 to account for new variable)
    /// @dev We used 1 slot for totalRegistrations, so reduce __gap accordingly
    uint256[46] private __gapV2;

    /// @notice Emitted when content is registered (V2 enhanced event)
    event ContentRegisteredV2(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp, uint256 registrationNumber);

    /// @notice Get the version of the implementation
    /// @return The version string
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    /// @notice Register new content with its manifest URI (V2 with counter)
    /// @dev Content can only be registered once. Timestamp is used as existence check.
    /// @param contentHash The hash of the content to register (e.g., SHA-256)
    /// @param manifestURI The URI pointing to the content's manifest file
    function registerV2(bytes32 contentHash, string calldata manifestURI) external {
        require(entries[contentHash].timestamp == 0, "Already registered");
        uint64 currentTime = uint64(block.timestamp);
        entries[contentHash] = Entry({
            creator: msg.sender,
            timestamp: currentTime,
            manifestURI: manifestURI
        });
        totalRegistrations++;
        emit ContentRegisteredV2(contentHash, msg.sender, manifestURI, currentTime, totalRegistrations);
        emit ContentRegistered(contentHash, msg.sender, manifestURI, currentTime);
    }

    /// @notice Get total number of registrations (new feature in V2)
    /// @return The total number of content registrations
    function getTotalRegistrations() external view returns (uint256) {
        return totalRegistrations;
    }
}
