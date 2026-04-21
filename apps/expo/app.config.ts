import path from "path";
import type { ExpoConfig } from "expo/config";

// .env en RAÍZ del monorepo: D:\...\ForeventKonTechDev2025nicoonline\.env
const repoRoot = path.resolve(__dirname, "../..");
require("@expo/env").load(repoRoot, { force: true });

// Google Maps key: obligatoria vía env. El manifest Android la inyecta con manifestPlaceholders.
const ANDROID_GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
if (!ANDROID_GOOGLE_MAPS_API_KEY) {
  console.warn("[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no definida. Los mapas en Android no funcionarán.");
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
      "NSLocationWhenInUseUsageDescription": "Forevent usa tu ubicación para mostrarte eventos cercanos.",
      "NSAppTransportSecurity": {
        "NSAllowsArbitraryLoads": false
      }
    }
  },
  android: {
    package: "com.ssitgroup.forevent",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    config: {
      googleMaps: {
        apiKey: ANDROID_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  extra: {
    eas: {
      projectId: "6de875d0-f6ce-461b-9ee6-4f169a1f328e",
    },
    googleMapsApiKeyConfigured: !!ANDROID_GOOGLE_MAPS_API_KEY.trim(),
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
    [
      "expo-location",
      {
        "locationWhenInUsePermission": "Forevent necesita tu ubicación para mostrar eventos cercanos."
      }
    ],
    "expo-router",
    "./expo-plugins/with-gesture-handler.js",
    "./expo-plugins/with-maps.js",
    "./expo-plugins/with-modify-gradle.js",
    "./expo-plugins/with-metro-port.js",
  ],
});

export default defineConfig;