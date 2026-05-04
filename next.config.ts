import type { NextConfig } from "next";

const devUploadsOrigin = process.env.DEV_UPLOADS_ORIGIN?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/*": ["./data/**/*"],
  },
  async rewrites() {
    if (process.env.NODE_ENV === "development" && devUploadsOrigin) {
      return [
        {
          source: "/uploads/:path*",
          destination: `${devUploadsOrigin}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
