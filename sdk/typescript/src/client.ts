import axios, { AxiosInstance, AxiosError } from "axios";

export interface InternetIdClientConfig {
  baseURL?: string;
  apiKey?: string;
  jwtToken?: string;
  timeout?: number;
}

export interface VerificationResult {
  verified: boolean;
  platform?: string;
  platformId?: string;
  creator?: string;
  contentHash?: string;
  manifestURI?: string;
  timestamp?: number;
  registryAddress?: string;
  chainId?: number;
  manifest?: any;
  error?: string;
  message?: string;
}

export interface ContentMetadata {
  id: string;
  contentHash: string;
  manifestUri?: string;
  creatorAddress: string;
  registryAddress?: string;
  txHash?: string;
  createdAt: string;
  bindings?: Array<{
    platform: string;
    platformId: string;
  }>;
}

export interface ContentListResponse {
  data: ContentMetadata[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  tier: string;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name?: string;
  tier?: string;
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  message: string;
  data: {
    id: string;
    key: string;
    name: string;
    tier: string;
    rateLimit: number;
    createdAt: string;
    expiresAt?: string;
  };
  warning: string;
}

export interface AuthTokenRequest {
  address: string;
  signature: string;
  message: string;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  user: {
    id: string;
    address?: string;
    email?: string;
  };
}

/**
 * Internet ID SDK Client
 * 
 * Example usage:
 * ```typescript
 * import { InternetIdClient } from '@internet-id/sdk';
 * 
 * const client = new InternetIdClient({
 *   apiKey: 'iid_your_api_key_here'
 * });
 * 
 * // Verify content by platform URL
 * const result = await client.verifyByPlatform({
 *   url: 'https://youtube.com/watch?v=abc123'
 * });
 * 
 * // Verify content by hash
 * const result2 = await client.verifyByHash('0x123...');
 * ```
 */
export class InternetIdClient {
  private client: AxiosInstance;

  constructor(config: InternetIdClientConfig = {}) {
    // Note: Default production URL is a placeholder
    // Update this to your actual API endpoint in production
    const baseURL = config.baseURL || "https://api.internet-id.io/api/v1";
    
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add authentication headers
    if (config.apiKey) {
      this.client.defaults.headers.common["x-api-key"] = config.apiKey;
    }
    if (config.jwtToken) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${config.jwtToken}`;
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as any;
          throw new Error(
            data.message || data.error || `Request failed with status ${error.response.status}`
          );
        }
        throw error;
      }
    );
  }

  /**
   * Verify content by platform URL or platform + platformId
   */
  async verifyByPlatform(params: {
    url?: string;
    platform?: string;
    platformId?: string;
  }): Promise<VerificationResult> {
    const { data } = await this.client.get("/verify/platform", { params });
    return data;
  }

  /**
   * Verify content by content hash
   */
  async verifyByHash(hash: string): Promise<VerificationResult> {
    const { data } = await this.client.get(`/verify/hash/${hash}`);
    return data;
  }

  /**
   * List registered content with pagination
   */
  async listContent(params?: {
    limit?: number;
    offset?: number;
    creator?: string;
  }): Promise<ContentListResponse> {
    const { data } = await this.client.get("/content", { params });
    return data;
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string): Promise<{ data: ContentMetadata }> {
    const { data } = await this.client.get(`/content/${id}`);
    return data;
  }

  /**
   * Get content by hash
   */
  async getContentByHash(hash: string): Promise<{ data: ContentMetadata }> {
    const { data } = await this.client.get(`/content/hash/${hash}`);
    return data;
  }

  /**
   * Create a new API key (requires authentication)
   */
  async createApiKey(params?: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const { data } = await this.client.post("/api-keys", params);
    return data;
  }

  /**
   * List API keys (requires authentication)
   */
  async listApiKeys(): Promise<{ data: ApiKey[] }> {
    const { data } = await this.client.get("/api-keys");
    return data;
  }

  /**
   * Revoke an API key (requires authentication)
   */
  async revokeApiKey(keyId: string): Promise<{ message: string }> {
    const { data } = await this.client.patch(`/api-keys/${keyId}/revoke`);
    return data;
  }

  /**
   * Delete an API key (requires authentication)
   */
  async deleteApiKey(keyId: string): Promise<{ message: string }> {
    const { data } = await this.client.delete(`/api-keys/${keyId}`);
    return data;
  }

  /**
   * Generate JWT token by signing a message with wallet
   */
  async generateToken(params: AuthTokenRequest): Promise<AuthTokenResponse> {
    const { data } = await this.client.post("/auth/token", params);
    return data;
  }

  /**
   * Update the JWT token for this client
   */
  setJwtToken(token: string): void {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Update the API key for this client
   */
  setApiKey(apiKey: string): void {
    this.client.defaults.headers.common["x-api-key"] = apiKey;
  }
}

// Export a factory function for convenience
export function createClient(config?: InternetIdClientConfig): InternetIdClient {
  return new InternetIdClient(config);
}
