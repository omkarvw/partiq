import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Phase 1: commercial / decision chrome → Factory Pulse
      { source: "/dashboard", destination: "/factory", permanent: false },
      { source: "/urgent", destination: "/factory", permanent: false },
      { source: "/urgent/:path*", destination: "/factory", permanent: false },
      { source: "/parts", destination: "/factory", permanent: false },
      { source: "/parts/:path*", destination: "/factory", permanent: false },
      { source: "/customers", destination: "/factory", permanent: false },
      { source: "/customers/:path*", destination: "/factory", permanent: false },
      { source: "/baselines", destination: "/impact", permanent: false },
      { source: "/baselines/:path*", destination: "/impact", permanent: false },
      { source: "/impact/labour", destination: "/impact/machines?tab=labour", permanent: false },
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
      { source: "/v1/impact", destination: "/impact", permanent: false },
      { source: "/v1/baselines", destination: "/impact", permanent: false },
      { source: "/v1/scenarios", destination: "/impact", permanent: false },
      { source: "/v1/settings", destination: "/settings", permanent: false },
      { source: "/v1/dashboard", destination: "/factory", permanent: false },
      { source: "/v1/guide", destination: "/factory", permanent: false },
    ];
  },
};

export default nextConfig;
