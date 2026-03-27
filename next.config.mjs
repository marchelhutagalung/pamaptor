/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' is required by Next.js dev mode (React Fast Refresh / HMR).
  // It is intentionally excluded from production builds.
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://storage.googleapis.com https://cdn.pamaptor.com https://*.tile.openstreetmap.org https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
  "connect-src 'self' https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://storage.googleapis.com https://cdn.pamaptor.com https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=self, geolocation=self, microphone=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  output: "standalone",
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — Cloud Run won't re-optimize the same image
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/pamaptor-media/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pamaptor.com", // CDN subdomain proxying GCS (Cloudflare Worker)
        pathname: "/**",
      },
      // Dev-only: seed data uses placeholder image services
      ...(!isProd
        ? [
            { protocol: "https", hostname: "picsum.photos" },
            { protocol: "https", hostname: "i.pravatar.cc" },
          ]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
