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

    /// @notice Emitted when content is registered (V2 enhanced event)
    event ContentRegisteredV2(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp, uint256 registrationNumber);

    /// @notice Get the version of the implementation
    /// @return The version string
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    /// @notice Register new content with its manifest URI (V2 with counter)
    /// @dev Content can only be registered once. Timestamp is used as existence check.
    /// @dev This extends the base register function with a registration counter
    /// @param contentHash The hash of the content to register (e.g., SHA-256)
    /// @param manifestURI The URI pointing to the content's manifest file
    function registerV2(bytes32 contentHash, string calldata manifestURI) external {
        // Use internal register function for core logic to avoid external call overhead
        _register(contentHash, manifestURI);
        
        // Add V2-specific functionality
        totalRegistrations++;
        emit ContentRegisteredV2(contentHash, msg.sender, manifestURI, uint64(block.timestamp), totalRegistrations);
    }

    /// @notice Get total number of registrations (new feature in V2)
    /// @return The total number of content registrations
    function getTotalRegistrations() external view returns (uint256) {
        return totalRegistrations;
    }
}
