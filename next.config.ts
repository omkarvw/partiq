import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Decision / capacity still deferred; commercial is live again
      { source: "/dashboard", destination: "/factory", permanent: false },
      { source: "/capacity", destination: "/factory", permanent: false },
      { source: "/capacity/:path*", destination: "/factory", permanent: false },
      { source: "/baselines", destination: "/master-data", permanent: false },
      { source: "/baselines/:path*", destination: "/master-data", permanent: false },
      // Canonical product URL is Master data; keep /impact files via rewrite
      { source: "/impact", destination: "/master-data", permanent: false },
      { source: "/impact/:path*", destination: "/master-data/:path*", permanent: false },
      {
        source: "/master-data/labour",
        destination: "/master-data/machines?tab=labour",
        permanent: false,
      },
      // Legacy dual-app bookmarks
      { source: "/v2", destination: "/factory", permanent: false },
      { source: "/v2/:path*", destination: "/:path*", permanent: false },
      { source: "/v1", destination: "/factory", permanent: false },
      { source: "/v1/parts", destination: "/factory", permanent: false },
      { source: "/v1/parts/:path*", destination: "/factory", permanent: false },
      { source: "/v1/customers", destination: "/factory", permanent: false },
      { source: "/v1/customers/:path*", destination: "/factory", permanent: false },
      { source: "/v1/factory", destination: "/factory", permanent: false },
      { source: "/v1/factory/:path*", destination: "/factory/:path*", permanent: false },
      { source: "/v1/impact", destination: "/master-data", permanent: false },
      { source: "/v1/baselines", destination: "/master-data", permanent: false },
      { source: "/v1/scenarios", destination: "/master-data", permanent: false },
      { source: "/v1/settings", destination: "/settings", permanent: false },
      { source: "/v1/dashboard", destination: "/factory", permanent: false },
      { source: "/v1/guide", destination: "/factory", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/master-data", destination: "/impact" },
      { source: "/master-data/:path*", destination: "/impact/:path*" },
    ];
  },
};

export default nextConfig;
