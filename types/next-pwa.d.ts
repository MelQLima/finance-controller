declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest: string;
    disable?: boolean;
  }

  export default function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
