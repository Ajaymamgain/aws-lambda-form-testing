/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // Add the S3 domain for screenshots here
      's3.amazonaws.com',
      'form-testing-lambda-screenshots-dev.s3.amazonaws.com',
      'form-testing-lambda-screenshots-prod.s3.amazonaws.com'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_BASE_URL + '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
