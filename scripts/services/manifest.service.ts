import * as https from "https";

export function fetchHttpsJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

export async function fetchManifest(uri: string): Promise<any> {
  if (uri.startsWith("ipfs://")) {
    const p = uri.replace("ipfs://", "");
    return fetchHttpsJson(`https://ipfs.io/ipfs/${p}`);
  }
  if (uri.startsWith("http://") || uri.startsWith("https://"))
    return fetchHttpsJson(uri);
  throw new Error("Unsupported manifest URI");
}
