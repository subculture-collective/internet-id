/**
 * ABI constants for smart contract interactions
 * Centralized to prevent ABI mismatch across files
 */

/**
 * ABI for registering content in the registry
 * Used in: register routes, oneshot routes
 */
export const REGISTER_ABI = [
  "function register(bytes32 contentHash, string manifestURI) external",
  "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
];

/**
 * ABI for binding platform identities to content
 * Used in: binding routes, oneshot routes, all bind scripts
 */
export const BIND_PLATFORM_ABI = [
  "function bindPlatform(bytes32 contentHash, string platform, string platformId) external",
  "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
];
