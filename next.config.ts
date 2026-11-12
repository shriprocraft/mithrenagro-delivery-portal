import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Delivery partners are provisioned by Mithren Agro (admin-created accounts); there is no public
  // self-registration, so the old registration address goes to sign-in.
  async redirects() {
    return [{ source: "/delivery/register", destination: "/delivery", permanent: false }];
  },
};

export default nextConfig;
