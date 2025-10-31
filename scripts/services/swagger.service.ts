import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Internet ID Public API",
      version: "1.0.0",
      description: `
# Internet ID Public API

The Internet ID Public API enables third-party developers to build integrations, tools, and services 
on top of Internet ID's content provenance platform.

## Authentication

The API supports two authentication methods:

### 1. API Keys
Include your API key in the \`x-api-key\` header:
\`\`\`
x-api-key: iid_your_api_key_here
\`\`\`

### 2. JWT Tokens
Include a JWT token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer your_jwt_token_here
\`\`\`

## Rate Limits

Rate limits vary by tier:
- **Free tier**: 100 requests per minute
- **Paid tier**: 1000 requests per minute

## Versioning

The API is versioned using URL path prefixes (e.g., \`/api/v1/\`). 
Current version: v1

## Support

- GitHub: https://github.com/subculture-collective/internet-id
- Issues: https://github.com/subculture-collective/internet-id/issues
      `,
      contact: {
        name: "Internet ID Support",
        url: "https://github.com/subculture-collective/internet-id",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001/api/v1",
        description: "Development server",
      },
      {
        url: "https://api.internet-id.io/api/v1",
        description: "Production server (placeholder)",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for authentication",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for user-scoped access",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type or summary",
            },
            message: {
              type: "string",
              description: "Detailed error message",
            },
          },
        },
        VerificationResult: {
          type: "object",
          properties: {
            verified: {
              type: "boolean",
              description: "Whether the content is verified",
            },
            platform: {
              type: "string",
              description: "Platform name (e.g., youtube, tiktok)",
            },
            platformId: {
              type: "string",
              description: "Platform-specific content ID",
            },
            creator: {
              type: "string",
              description: "Ethereum address of the creator",
            },
            contentHash: {
              type: "string",
              description: "Content hash (bytes32 hex string)",
            },
            manifestURI: {
              type: "string",
              description: "URI to the content manifest",
            },
            timestamp: {
              type: "number",
              description: "Unix timestamp of registration",
            },
            registryAddress: {
              type: "string",
              description: "Registry contract address",
            },
            chainId: {
              type: "number",
              description: "Blockchain chain ID",
            },
            manifest: {
              type: "object",
              description: "Manifest data (if available)",
              nullable: true,
            },
          },
        },
        Content: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique content ID",
            },
            contentHash: {
              type: "string",
              description: "Content hash (bytes32 hex string)",
            },
            manifestUri: {
              type: "string",
              description: "URI to the content manifest",
              nullable: true,
            },
            creatorAddress: {
              type: "string",
              description: "Ethereum address of the creator",
            },
            registryAddress: {
              type: "string",
              description: "Registry contract address",
              nullable: true,
            },
            txHash: {
              type: "string",
              description: "Transaction hash of registration",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when content was created",
            },
            bindings: {
              type: "array",
              description: "Platform bindings",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  platformId: { type: "string" },
                },
              },
            },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique API key ID",
            },
            name: {
              type: "string",
              description: "Human-readable key name",
            },
            tier: {
              type: "string",
              enum: ["free", "paid"],
              description: "API key tier",
            },
            rateLimit: {
              type: "number",
              description: "Rate limit (requests per minute)",
            },
            isActive: {
              type: "boolean",
              description: "Whether the key is active",
            },
            lastUsedAt: {
              type: "string",
              format: "date-time",
              description: "Last time the key was used",
              nullable: true,
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "When the key expires",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "When the key was created",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Verification",
        description: "Content verification endpoints",
      },
      {
        name: "Content",
        description: "Content metadata endpoints",
      },
      {
        name: "API Keys",
        description: "API key management endpoints",
      },
      {
        name: "Authentication",
        description: "Authentication and token endpoints",
      },
    ],
  },
  apis: ["./scripts/routes/v1/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
