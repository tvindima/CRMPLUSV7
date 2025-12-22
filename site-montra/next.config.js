/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.rudderlabs.com https://static.hsappstatic.net https://js.hs-scripts.com https://js.hsforms.net https://js.hs-analytics.net https://js.usemessages.com https://js.hscta.net https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.expo.dev https://static.expo.dev https://cdn.rudderlabs.com https://static.hsappstatic.net https://api.hsforms.com https://forms.hsforms.com https://api.hubspot.com https://api.hubapi.com https://*.hsforms.com https://*.hs-scripts.com https://*.hs-analytics.net https://*.usemessages.com https://www.google-analytics.com https://analytics.google.com",
              "frame-src 'self' https://app.hubspot.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
