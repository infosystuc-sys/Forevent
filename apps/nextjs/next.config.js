// Importing env files here to validate on build
import "@forevent/auth/env";
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@forevent/api",
    "@forevent/auth",
    "@forevent/db",
    "@forevent/ui",
    "@forevent/validators",
  ],
  webpack(webpackConfig) {
    // Suppress Watchpack "EINVAL: invalid argument" errors caused by Windows
    // system files (DumpStack.log, System Volume Information, etc.) that
    // Next.js/Watchpack cannot lstat. This is purely cosmetic — the errors
    // don't affect compilation, but they flood the terminal.
    webpackConfig.watchOptions = {
      ...webpackConfig.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.next/**",
        // Windows root-level system paths that trigger EINVAL errors
        "D:/DumpStack*",
        "D:/System Volume Information/**",
        "D:/pagefile.sys",
        "D:/swapfile.sys",
      ],
    };
    return webpackConfig;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/attachments/**',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
        port: '',
        pathname: '/attachments/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'd2l7xb0l2x2ws7.cloudfront.net',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
      },
    ]
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
