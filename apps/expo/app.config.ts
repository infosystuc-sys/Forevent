import path from "path";
import type { ExpoConfig } from "expo/config";

// .env en RAÍZ del monorepo: D:\...\ForeventKonTechDev2025nicoonline\.env
const repoRoot = path.resolve(__dirname, "../..");
require("@expo/env").load(repoRoot, { force: true });

// Google Maps key para Android. Validamos que exista en el entorno pero NO la
// inyectamos directo en el config: pasamos el placeholder `${GOOGLE_MAPS_API_KEY}`
// literal para que prebuild lo escriba tal cual en AndroidManifest.xml, y gradle
// lo sustituya desde EXPO_PUBLIC_GOOGLE_MAPS_API_KEY vía manifestPlaceholders.
// Así la key real nunca queda hardcodeada en archivos trackeados por git.
const HAS_ANDROID_GOOGLE_MAPS_API_KEY = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
if (!HAS_ANDROID_GOOGLE_MAPS_API_KEY) {
  throw new Error(
    "[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY es obligatoria. Definila en .env (raíz del monorepo).",
  );
}
const ANDROID_GOOGLE_MAPS_API_KEY_PLACEHOLDER = "${GOOGLE_MAPS_API_KEY}";

// Google Maps key para iOS. En iOS no hay manifestPlaceholders: la key se inyecta
// directamente en AppDelegate.swift por el plugin with-maps.js en tiempo de prebuild.
// La carpeta ios/ está en .gitignore, por lo que la key nunca queda en el repo.
const IOS_GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY?.trim() ?? "";
if (!IOS_GOOGLE_MAPS_API_KEY) {
  throw new Error(
    "[app.config] EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY es obligatoria. Definila en .env (raíz del monorepo).",
  );
}

const defineConfig = (): ExpoConfig => ({
  owner: "infosystuc",
  name: "Forevent",
  slug: "forevent",
  scheme: "foreventapp",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
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
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Forevent usa tu ubicación para mostrarte eventos cercanos en el mapa.",
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
    },
    config: {
      googleMapsApiKey: IOS_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    package: "com.ssitgroup.forevent",
    // Solo permitir tráfico en claro en dev (Metro + 10.0.2.2). En prod exigimos HTTPS.
    usesCleartextTraffic: process.env.NODE_ENV !== "production",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000000",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    config: {
      googleMaps: {
        apiKey: ANDROID_GOOGLE_MAPS_API_KEY_PLACEHOLDER,
      },
    },
  } as any,
  extra: {
    eas: {
      projectId: "cab98ce5-3435-47b3-b34b-ca8a40b95fd9",
    },
    googleMapsApiKeyConfigured: HAS_ANDROID_GOOGLE_MAPS_API_KEY,
    googleMapsIosApiKeyConfigured: !!IOS_GOOGLE_MAPS_API_KEY,
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