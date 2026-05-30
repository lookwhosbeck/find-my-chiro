/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'radix-ui'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      // Stripe Dashboard was configured with https://movynalong.com (root) instead of
      // /api/webhooks/stripe — forward signed webhook POSTs so checkout.session.completed syncs.
      {
        source: '/',
        has: [{ type: 'header', key: 'stripe-signature' }],
        destination: '/api/webhooks/stripe',
      },
    ];
  },
};

module.exports = nextConfig;

