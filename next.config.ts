import type { NextConfig } from "next";

// Static export for GitHub Pages (awalker77s.github.io): the page prerenders
// to plain files in out/, and images ship as-is — Pages has no optimizer.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
