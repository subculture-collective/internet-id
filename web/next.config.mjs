import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence workspace root warning and keep Turbopack scoped to this app
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
