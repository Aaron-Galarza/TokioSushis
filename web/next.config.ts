import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const privateHeaders = [
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ];
    return [
      { source: '/login', headers: privateHeaders },
      { source: '/admin/:path*', headers: privateHeaders },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
