import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withSerwist = withSerwistInit({
  // Service worker source and output (served as /sw.js).
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // The service worker is not registered in dev, to avoid "sticky" caches.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
