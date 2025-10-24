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
  // During build, lint but don't fail on pre-existing warnings/errors
  // This allows gradual ESLint adoption while still catching new issues in CI
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Fix errors and remove this option.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
