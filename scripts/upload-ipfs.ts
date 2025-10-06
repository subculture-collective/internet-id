import { create as createIpfsClient } from "ipfs-http-client";
import { readFile } from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

/*
Env options for IPFS API endpoint:
  IPFS_API_URL=https://ipfs.infura.io:5001
  IPFS_PROJECT_ID=... (optional)
  IPFS_PROJECT_SECRET=... (optional)
*/

export async function uploadToIpfs(filePath: string) {
  const url = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001";
  let auth: string | undefined;
  if (process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET) {
    auth =
      "Basic " +
      Buffer.from(
        `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
      ).toString("base64");
  }

  const client = createIpfsClient({
    url,
    headers: auth ? { Authorization: auth } : undefined,
  } as any);

  const data = await readFile(filePath);
  const { cid } = await client.add(
    { path: path.basename(filePath), content: data },
    { wrapWithDirectory: false }
  );
  console.log("Uploaded to IPFS:", cid.toString());
  return cid.toString();
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
