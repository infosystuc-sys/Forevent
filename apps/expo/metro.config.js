// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { FileStore } = require("metro-cache");
const path = require("path");
// 1. Importamos la utilidad para crear listas negras
const exclusionList = require("metro-config/src/defaults/exclusionList");

// Cargar .env desde la raíz del monorepo (para EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
require("@expo/env").load(workspaceRoot, { force: true });

module.exports = withTurborepoManagedCache(
  withMonorepoPaths(
    withNativeWind(getDefaultConfig(__dirname), {
      input: "./src/styles.css",
      configPath: "./tailwind.config.ts",
    }),
  ),
);

/**
 * Add the monorepo paths to the Metro config.
 * This allows Metro to resolve modules from the monorepo.
 *
 * @see https://docs.expo.dev/guides/monorepos/#modify-the-metro-config
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withMonorepoPaths(config) {
  const projectRoot = __dirname;
  const workspaceRoot = path.resolve(projectRoot, "../..");

  // #1 - Watch solo paquetes fuente del monorepo. NO watchear node_modules ni apps/nextjs:
  // en Windows sin watchman el node-crawler timeouteaba (metro-file-map MAX_WAIT_TIME).
  // Los node_modules siguen RESOLVIENDO via nodeModulesPaths, solo no se "watch"-ean.
  config.watchFolders = [
    path.resolve(workspaceRoot, "packages"),
    path.resolve(workspaceRoot, "tooling"),
  ];

  // #2 - Resolve modules within the project's `node_modules` first, then all monorepo modules
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];

  // #3 - Excluir paths pesados del file-map (se aplica como ignorePattern al watcher).
  // Incluimos node_modules internos del root y apps/nextjs build artifacts.
  config.resolver.blockList = exclusionList([
    /.*\/apps\/nextjs\/.*/,
    /.*\.next\/.*/,
    /.*\/\.turbo\/.*/,
    /.*\/\.git\/.*/,
    /.*\/\.cache\/.*/,
    /.*\/apps\/auth-proxy\/.*/,
    // Deep pnpm paths (symlinks) – ignoramos para el crawler del watcher
    /.*\/\.pnpm\/.*\/node_modules\/.*\/node_modules\/.*/,
  ]);

  config.transformer = {
    ...config.transformer,
    babelTransformerPath: path.resolve(__dirname, './metro.transformer.js'),
  };

  return config;
}

/**
 * Move the Metro cache to the `node_modules/.cache/metro` folder.
 * This repository configured Turborepo to use this cache location as well.
 * If you have any environment variables, you can configure Turborepo to invalidate it when needed.
 *
 * @see https://turbo.build/repo/docs/reference/configuration#env
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withTurborepoManagedCache(config) {
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, "node_modules", ".cache", "metro") }),
  ];
  return config;
}