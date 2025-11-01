import { createHash } from "crypto";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { ethers } from "ethers";
import axios from "axios";
import FormData from "form-data";

/**
 * Compute SHA256 hash of a file
 */
export function sha256Hex(buffer: Buffer): string {
  return "0x" + createHash("sha256").update(buffer).digest("hex");
}

/**
 * Compute SHA256 hash of a file using streaming (memory efficient)
 */
export async function sha256HexFromFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), hash);
  return "0x" + hash.digest("hex");
}

/**
 * Sign a message with a private key
 */
export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signMessage(ethers.getBytes(message));
}

/**
 * Get wallet address from private key
 */
export function getAddress(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Upload file to IPFS using configured provider
 */
export async function uploadToIpfs(
  filePath: string,
  provider: "web3storage" | "pinata" | "infura" | "local",
  credentials: {
    web3StorageToken?: string;
    pinataJwt?: string;
    infuraProjectId?: string;
    infuraProjectSecret?: string;
    ipfsApiUrl?: string;
  }
): Promise<string> {
  if (provider === "web3storage") {
    if (!credentials.web3StorageToken) {
      throw new Error("Web3.Storage token is required for web3storage provider");
    }
    return uploadViaWeb3Storage(filePath, credentials.web3StorageToken);
  } else if (provider === "pinata") {
    if (!credentials.pinataJwt) {
      throw new Error("Pinata JWT is required for pinata provider");
    }
    return uploadViaPinata(filePath, credentials.pinataJwt);
  } else if (provider === "infura") {
    if (!credentials.infuraProjectId || !credentials.infuraProjectSecret) {
      throw new Error("Infura Project ID and Secret are required for infura provider");
    }
    return uploadViaInfura(
      filePath,
      credentials.ipfsApiUrl || "https://ipfs.infura.io:5001",
      credentials.infuraProjectId,
      credentials.infuraProjectSecret
    );
  } else if (provider === "local") {
    return uploadViaLocal(filePath, credentials.ipfsApiUrl || "http://127.0.0.1:5001");
  }
  throw new Error("Unsupported IPFS provider");
}

async function uploadViaWeb3Storage(filePath: string, token: string): Promise<string> {
  // Use streaming for memory efficiency with large files
  const form = new FormData();
  form.append("file", createReadStream(filePath));

  const response = await axios.post("https://api.web3.storage/upload", form, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
  });
  return response.data.cid;
}

async function uploadViaPinata(filePath: string, jwt: string): Promise<string> {
  const form = new FormData();
  form.append("file", createReadStream(filePath));

  const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...form.getHeaders(),
    },
  });
  return response.data.IpfsHash;
}

async function uploadViaInfura(
  filePath: string,
  apiUrl: string,
  projectId: string,
  projectSecret: string
): Promise<string> {
  const addUrl = `${apiUrl.replace(/\/$/, "")}/api/v0/add?pin=true&wrap-with-directory=false`;
  const auth = "Basic " + Buffer.from(`${projectId}:${projectSecret}`).toString("base64");

  // Use streaming for memory efficiency
  const form = new FormData();
  form.append("file", createReadStream(filePath));

  const response = await axios.post(addUrl, form, {
    headers: {
      Authorization: auth,
      ...form.getHeaders(),
    },
  });

  const body = response.data;
  if (typeof body === "string") {
    const lines = body.trim().split(/\r?\n/).filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    return last.Hash;
  }
  return body.Hash;
}

async function uploadViaLocal(filePath: string, apiUrl: string): Promise<string> {
  const addUrl = `${apiUrl.replace(/\/$/, "")}/api/v0/add?pin=true&wrap-with-directory=false`;

  // No auth header for local IPFS nodes
  const form = new FormData();
  form.append("file", createReadStream(filePath));

  const response = await axios.post(addUrl, form, {
    headers: {
      ...form.getHeaders(),
    },
  });

  const body = response.data;
  if (typeof body === "string") {
    const lines = body.trim().split(/\r?\n/).filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    return last.Hash;
  }
  return body.Hash;
}

/**
 * Fetch manifest from IPFS or HTTP(S)
 */
export async function fetchManifest(uri: string): Promise<Record<string, unknown>> {
  if (uri.startsWith("ipfs://")) {
    const path = uri.replace("ipfs://", "");
    const url = `https://ipfs.io/ipfs/${path}`;
    const response = await axios.get(url);
    return response.data;
  }
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const response = await axios.get(uri);
    return response.data;
  }
  throw new Error("Unsupported manifest URI scheme: " + uri);
}

/**
 * Create a manifest object
 */
export function createManifest(
  contentHash: string,
  contentUri: string,
  creatorAddress: string,
  signature: string
): Record<string, unknown> {
  return {
    version: "1.0",
    algorithm: "sha256",
    content_hash: contentHash,
    content_uri: contentUri,
    creator_did: `did:pkh:eip155:1:${creatorAddress}`,
    created_at: new Date().toISOString(),
    signature,
    attestations: [],
  };
}
