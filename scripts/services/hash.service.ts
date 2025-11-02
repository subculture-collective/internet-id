import { createHash } from "crypto";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

export function sha256Hex(buf: Buffer): string {
  return "0x" + createHash("sha256").update(buf).digest("hex");
}

export async function sha256HexFromFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), hash);
  return "0x" + hash.digest("hex");
}
