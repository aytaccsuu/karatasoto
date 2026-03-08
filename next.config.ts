import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cross-origin uyarısını kapat (preview tool 127.0.0.1 vs localhost)
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],

  // Next/Image optimizasyonu
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Üretimde source map boyutunu küçült
  productionBrowserSourceMaps: false,

  // Compiler optimizasyonları
  compiler: {
    // Prod build'de console.log temizle
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;
