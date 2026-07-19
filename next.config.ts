import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Allow camera access in all browsers
        {
          key: "Permissions-Policy",
          value: "camera=*, microphone=()",
        },
        // Required for WebAssembly / SharedArrayBuffer (MediaPipe)
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "credentialless",
        },
      ],
    },
  ],
};

export default nextConfig;
