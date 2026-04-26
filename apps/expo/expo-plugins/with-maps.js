const {
  withSettingsGradle,
  withAppBuildGradle,
  withAppDelegate,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

function withMaps(config) {
  // ── Android ──────────────────────────────────────────────────────────────
  config = withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes(":react-native-maps")) {
      const mapsPath = path
        .resolve(__dirname, "../../../node_modules/react-native-maps/android")
        .replace(/\\/g, "/");
      config.modResults.contents +=
        `\ninclude ':react-native-maps'\n` +
        `project(':react-native-maps').projectDir = new File('${mapsPath}')\n`;
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("project(':react-native-maps')")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {\n    implementation project(':react-native-maps')`
      );
    }
    return config;
  });

  // ── iOS ──────────────────────────────────────────────────────────────────
  config = withGoogleMapsPod(config);
  config = withGoogleMapsAppDelegate(config);

  return config;
}

/**
 * Agrega `pod 'GoogleMaps'` al Podfile generado por prebuild.
 * react-native-maps detecta automáticamente el SDK y habilita el provider Google.
 */
function withGoogleMapsPod(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf-8");

      if (!contents.includes("pod 'GoogleMaps'")) {
        // Inserta justo después de use_expo_modules! dentro del target
        contents = contents.replace(
          /([ \t]*use_expo_modules!)/,
          `$1\n  pod 'GoogleMaps'`
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}

/**
 * Inyecta la inicialización del Google Maps SDK en AppDelegate.swift.
 * Lee la key desde config.ios.config.googleMapsApiKey (seteada en app.config.ts).
 */
function withGoogleMapsAppDelegate(config) {
  const apiKey = config.ios?.config?.googleMapsApiKey ?? "";

  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Agregar import GoogleMaps junto a los demás imports
    if (!contents.includes("import GoogleMaps")) {
      contents = contents.replace(
        /^(import Expo)/m,
        `import GoogleMaps\n$1`
      );
    }

    // 2. Inicializar el SDK antes del return del lifecycle principal
    if (!contents.includes("GMSServices.provideAPIKey")) {
      contents = contents.replace(
        /(return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\))/,
        `GMSServices.provideAPIKey("${apiKey}")\n    $1`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withMaps;
