/**
 * Shared validation constants
 */

/**
 * Content hash pattern (32-byte hex string with 0x prefix)
 * Example: 0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890
 */
export const CONTENT_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

/**
 * Ethereum address pattern (20-byte hex string with 0x prefix)
 * Example: 0x1234567890AbcdEF1234567890AbcdEF12345678
 */
export const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
