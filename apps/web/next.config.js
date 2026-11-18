/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site can be hosted on Cloudflare Pages.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
