/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'via.placeholder.com', 
      'lh3.googleusercontent.com',
      'replicate.delivery',
      'pbxt.replicate.delivery'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.replicate.delivery',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'canvas'],
  },
  // Add static file serving configuration
  async headers() {
    return [
      {
        source: '/mesh_files/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack(config) {
    // Add GLB file handling
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images',
          outputPath: 'static/images',
        },
      },
    });
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 