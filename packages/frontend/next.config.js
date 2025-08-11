/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Derleme sırasında tip hatalarını bloklamasın (CI build akışı için)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build'te lint hatalarını yoksay
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;


