import type { ExpoConfig } from "expo/config";

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
    usesCleartextTraffic: true, // <--- ESTA ES LA LÍNEA NUEVA QUE NECESITABAS
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
    permissions: ["ACCESS_BACKGROUND_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
  },
  extra: {
    eas: {
      projectId: "6de875d0-f6ce-461b-9ee6-4f169a1f328e",
    },
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
  ],
});

export default defineConfig;