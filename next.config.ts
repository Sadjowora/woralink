import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false,
  reloadOnOnline: false,
  disable:
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true',
});

const nextConfig: NextConfig = {
  turbopack: {},
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://woralink.com',
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yhlclgkbahtlbamnlrwz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
