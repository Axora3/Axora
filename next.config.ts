import type { NextConfig } from "next";

// Template preview images are served from the public Supabase Storage bucket.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  distDir: process.env.AXORA_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  devIndicators: false,
  // Avoid restoring stale Tailwind loader output across local dev restarts.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/template-previews/**" }] : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {source:'/order/pay/:token',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'private, no-store'}]},
      {source:'/api/order-workflow/:token',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'private, no-store'}]},
    ];
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
