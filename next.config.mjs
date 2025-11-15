/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Next 16 no longer supports `eslint` configuration in next.config.
  // Use `next lint` command options and .eslintrc instead, or pass --no-lint
  // flags to the CLI when calling `next build`.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig