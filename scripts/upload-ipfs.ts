import { readFile } from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import FormData from "form-data";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postWithRetry(
  url: string,
  data: any,
  options: any,
  retries = 2
) {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    try {
      return await axios.post(url, data, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
        ...options,
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const retriable =
        status >= 500 ||
        status === 429 ||
        e?.code === "ECONNRESET" ||
        e?.code === "ETIMEDOUT";
      lastErr = e;
      if (!retriable || attempt === retries) break;
      const backoff = Math.min(2000 * Math.pow(2, attempt), 8000);
      await sleep(backoff);
      attempt++;
    }
  }
  throw lastErr;
}

function maskId(s?: string) {
  if (!s) return "";
  if (s.length <= 8) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

async function preflightInfura(apiBase: string, authHeader: string) {
  const url = `${apiBase.replace(/\/$/, "")}/api/v0/version`;
  try {
    await postWithRetry(
      url,
      undefined,
      { headers: { Authorization: authHeader } },
      0
    );
  } catch (e: any) {
    if (e?.response?.status === 401) {
      throw new Error(
        "Infura IPFS auth failed (401). Double-check IPFS_PROJECT_ID/IPFS_PROJECT_SECRET are IPFS credentials (not Ethereum RPC keys)."
      );
    }
    throw e;
  }
}

/*
Env options for IPFS API endpoint:
  IPFS_API_URL=https://ipfs.infura.io:5001
  IPFS_PROJECT_ID=... (optional)
  IPFS_PROJECT_SECRET=... (optional)
*/

async function uploadViaInfura(filePath: string) {
  const apiBase = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001";
  const addUrl = `${apiBase.replace(
    /\/$/,
    ""
  )}/api/v0/add?pin=true&wrap-with-directory=false`;
  const pid = process.env.IPFS_PROJECT_ID;
  const secret = process.env.IPFS_PROJECT_SECRET;
  if (!pid || !secret) {
    throw new Error(
      "Infura IPFS requires IPFS_PROJECT_ID and IPFS_PROJECT_SECRET in .env"
    );
  }
  const auth = "Basic " + Buffer.from(`${pid}:${secret}`).toString("base64");
  // Preflight check to produce clearer errors for 401s
  try {
    await preflightInfura(apiBase, auth);
  } catch (err: any) {
    console.error(
      `Infura preflight failed for project ${maskId(pid)}: ${
        err?.message || err
      }`
    );
    throw err;
  }
  const data = await readFile(filePath);
  const form = new FormData();
  form.append("file", data, { filename: path.basename(filePath) });
  const headers = { Authorization: auth, ...form.getHeaders() } as Record<
    string,
    string
  >;
  const res = await postWithRetry(addUrl, form, { headers }, 2);
  const body = res.data;
  let cid: string | undefined;
  if (typeof body === "string") {
    const lines = body.trim().split(/\r?\n/).filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    cid = last.Hash;
  } else if (body && body.Hash) {
    cid = body.Hash;
  }
  if (!cid) throw new Error("Failed to parse CID from Infura IPFS response");
  return cid;
}

async function uploadViaWeb3Storage(filePath: string) {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token)
    throw new Error("WEB3_STORAGE_TOKEN is required for Web3.Storage uploads");
  const data = await readFile(filePath);
  const res = await postWithRetry(
    "https://api.web3.storage/upload",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      validateStatus: (s: number) => s < 500,
    },
    2
  );
  const cid = res.data?.cid;
  if (!cid) throw new Error("Failed to parse CID from Web3.Storage response");
  return cid;
}

async function uploadViaPinata(filePath: string) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is required for Pinata uploads");
  const data = await readFile(filePath);
  const form = new FormData();
  form.append("file", data, { filename: path.basename(filePath) });
  const res = await postWithRetry(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    form,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...form.getHeaders(),
      },
    },
    2
  );
  const cid = res.data?.IpfsHash;
  if (!cid) throw new Error("Failed to parse CID from Pinata response");
  return cid;
}

async function uploadViaLocalNode(filePath: string) {
  const apiBase = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
  const addUrl = `${apiBase.replace(
    /\/$/,
    ""
  )}/api/v0/add?pin=true&wrap-with-directory=false`;
  const data = await readFile(filePath);
  const form = new FormData();
  form.append("file", data, { filename: path.basename(filePath) });
  const res = await postWithRetry(
    addUrl,
    form,
    { headers: { ...form.getHeaders() } },
    2
  );
  const body = res.data;
  if (typeof body === "string") {
    const lines = body.trim().split(/\r?\n/).filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    return last.Hash;
  }
  return body?.Hash;
}

export async function uploadToIpfs(filePath: string) {
  const force = (process.env.IPFS_PROVIDER || "").toLowerCase();
  const hasWeb3 =
    !!process.env.WEB3_STORAGE_TOKEN &&
    !/^your_/i.test(process.env.WEB3_STORAGE_TOKEN);
  const hasPinata =
    !!process.env.PINATA_JWT && !/^your_/i.test(process.env.PINATA_JWT);
  const hasInfura =
    !!process.env.IPFS_PROJECT_ID && !!process.env.IPFS_PROJECT_SECRET;
  const hasLocal =
    (process.env.IPFS_PROVIDER || "").toLowerCase() === "local" ||
    (process.env.IPFS_API_URL || "").includes("127.0.0.1");

  const errors: string[] = [];
  const tryWeb3 = async () => {
    const cid = await uploadViaWeb3Storage(filePath);
    console.log("Uploaded to Web3.Storage:", cid);
    return cid;
  };
  const tryPinata = async () => {
    const cid = await uploadViaPinata(filePath);
    console.log("Uploaded to Pinata:", cid);
    return cid;
  };
  const tryInfura = async () => {
    const cid = await uploadViaInfura(filePath);
    console.log("Uploaded to Infura IPFS:", cid);
    return cid;
  };
  const tryLocal = async () => {
    const cid = await uploadViaLocalNode(filePath);
    console.log("Uploaded to Local IPFS node:", cid);
    return cid;
  };

  if (force) {
    console.log(`IPFS provider forced: ${force}`);
    try {
      if (force === "web3storage") return await tryWeb3();
      if (force === "pinata") return await tryPinata();
      if (force === "infura") return await tryInfura();
      if (force === "local") return await tryLocal();
      throw new Error(`Unknown IPFS_PROVIDER: ${force}`);
    } catch (e: any) {
      throw new Error(`Forced provider '${force}' failed: ${e?.message || e}`);
    }
  }

  if (hasWeb3) {
    try {
      return await tryWeb3();
    } catch (e: any) {
      errors.push(`Web3.Storage failed: ${e?.message || e}`);
    }
  }
  if (hasPinata) {
    try {
      return await tryPinata();
    } catch (e: any) {
      errors.push(`Pinata failed: ${e?.message || e}`);
    }
  }
  if (hasInfura) {
    try {
      return await tryInfura();
    } catch (e: any) {
      errors.push(`Infura failed: ${e?.message || e}`);
    }
  }
  if (hasLocal) {
    try {
      return await tryLocal();
    } catch (e: any) {
      errors.push(`Local node failed: ${e?.message || e}`);
    }
  }

  if (!hasWeb3 && !hasPinata && !hasInfura) {
    throw new Error(
      "No IPFS provider configured. Set WEB3_STORAGE_TOKEN or PINATA_JWT or IPFS_PROJECT_ID/IPFS_PROJECT_SECRET, or run a local node at 127.0.0.1:5001 and set IPFS_PROVIDER=local"
    );
  }
  throw new Error(errors.join(" | "));
}

if (require.main === module) {
  const [filePath] = process.argv.slice(2);
  if (!filePath) {
    console.error("Usage: npm run upload:ipfs -- <filePath>");
    process.exit(1);
  }
  uploadToIpfs(filePath).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
