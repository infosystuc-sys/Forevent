import path from "path";
import type { ExpoConfig } from "expo/config";

// .env en RAÍZ del monorepo: D:\...\ForeventKonTechDev2025nicoonline\.env
const repoRoot = path.resolve(__dirname, "../..");
require("@expo/env").load(repoRoot, { force: true });

// Variable exacta: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
if (!mapsApiKey) {
  console.warn("[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY vacía. El mapa mostrará gris.");
  console.warn("[app.config] Define la variable en .env en la raíz del monorepo y ejecuta: pnpm dev:android");
}

const defineConfig = (): ExpoConfig => ({
  owner: "ascheladd",
  name: "Forevent",
  slug: "forevent",
  scheme: "foreventapp",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  entryPoint: "./index.ts",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.ssitgroup.forevent",
    supportsTablet: false,
    "infoPlist": {
      "UIBackgroundModes": [
        "location",
        "fetch",
        "processing"
      ],
      "NSLocationWhenInUseUsageDescription": "text",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "text",
      "NSLocationAlwaysUsageDescription": "text"
    }
  },
  android: {
    package: "com.ssitgroup.forevent",
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
    permissions: ["ACCESS_BACKGROUND_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    config: {
      // Google Maps API Key para react-native-maps en Android.
      // Agregar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY en .env o en EAS Secrets.
      googleMaps: {
        apiKey: mapsApiKey,
      },
    },
  },
  extra: {
    eas: {
      projectId: "6de875d0-f6ce-461b-9ee6-4f169a1f328e",
    },
    // Exponer flag para que el frontend verifique si la API key está configurada
    googleMapsApiKeyConfigured: !!mapsApiKey.trim(),
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    [
      "expo-camera",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
      }
    ],
    [
      "expo-media-library",
      {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
        "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
        "isAccessMediaLocationEnabled": true
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "The app accesses your photos to let you share them with your friends."
      }
    ],
    [
      "expo-barcode-scanner",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access camera."
      }
    ],
    "expo-localization",
    "expo-router",
    "./expo-plugins/with-gesture-handler.js",
    "./expo-plugins/with-modify-gradle.js",
  ],
});

export default defineConfig;