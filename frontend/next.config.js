/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      // Add the S3 domain for screenshots here
      's3.amazonaws.com',
      'form-testing-lambda-screenshots-dev.s3.amazonaws.com',
      'form-testing-lambda-screenshots-prod.s3.amazonaws.com'
    ],
  },
  experimental: {
    // Optimize for faster development
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Allow transpiling Tremor modules
  transpilePackages: [
    '@tremor/react'
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  async rewrites() {
    // Only add the rewrite if API_BASE_URL is available
    if (process.env.API_BASE_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.API_BASE_URL}/:path*`,
        },
      ];
    }
    // Return empty array if no API_BASE_URL to avoid undefined error
    return [];
  },
};

module.exports = nextConfig;
