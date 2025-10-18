import { writeFile, unlink } from "fs/promises";
import * as os from "os";
import * as path from "path";

export async function tmpWrite(
  originalName: string,
  buf: Buffer
): Promise<string> {
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${path.basename(originalName)}`;
  const tmpPath = path.join(os.tmpdir(), filename);
  await writeFile(tmpPath, buf);
  return tmpPath;
}

export async function cleanupTmpFile(tmpPath: string): Promise<void> {
  await unlink(tmpPath).catch(() => {});
}
