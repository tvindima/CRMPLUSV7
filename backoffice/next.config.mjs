/** @type {import('next').NextConfig} */

// Log da variável de ambiente durante o build
console.log('🔍 BUILD CONFIG:');
console.log('  NEXT_PUBLIC_API_BASE_URL =', process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT SET (will use fallback)');
console.log('  Fallback URL = https://crmplusv7-production.up.railway.app');

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app';
console.log('  → Final API URL:', apiUrl);

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL: apiUrl,
  },
  async rewrites() {
    return [
      // Servir placeholders/renders estáticos a partir do site público (evita 404 no backoffice)
      {
        source: '/placeholders/:path*',
        destination: 'https://web-nymbcws7r-toinos-projects.vercel.app/placeholders/:path*',
      },
      {
        source: '/renders/:path*',
        destination: 'https://web-nymbcws7r-toinos-projects.vercel.app/renders/:path*',
      },
    ];
  },
};

export default nextConfig;
