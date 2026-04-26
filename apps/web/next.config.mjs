import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Transpile monorepo packages from source
  transpilePackages: ['@krishimitra/shared', '@krishimitra/ui'],

  // Performance — optimise bundle size for slow mobile connections
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },

  // Allow webpack to resolve .js imports as .ts (ESM-style extensions in TS source)
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },

  // PWA headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },
};

export default withNextIntl(nextConfig);
