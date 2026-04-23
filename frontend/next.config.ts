import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "clipboard-write=self",
          },
        ],
      },
    ]
  },
};

export default nextConfig;
