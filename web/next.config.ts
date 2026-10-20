import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ['/cart', '/checkout', '/order-confirmation'].map((source) => ({
      source, destination: '/', permanent: false,
    }));
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
