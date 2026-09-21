import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SiteASP / IIS deploy via Web Deploy (Publish-Web.ps1)
  output: "standalone",
  // Allow local network IP access during development
  allowedDevOrigins: ['192.168.224.1', '192.168.224.1:3000', 'localhost:3000', '127.0.0.1:3000'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'todayegypt.runasp.net',
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://todayegypt.runasp.net';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${backendUrl}/hubs/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
