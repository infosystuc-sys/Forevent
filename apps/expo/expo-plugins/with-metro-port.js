// Ensures the Android native app connects to Metro on port 8082
// (must match the --port flag in expo start scripts).
// Without this, React Native defaults to 8081 and the app shows
// "Unable to load script" on emulators/devices.

/** @type {import("@expo/config-plugins").ConfigPlugin} */
const defineConfig = (config) => {
  const { withGradleProperties } = require("@expo/config-plugins");

  return withGradleProperties(config, (config) => {
    const key = "reactNativeDevServerPort";
    const port = "8082";

    // Remove existing entry if present, then add it
    config.modResults = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === key),
    );
    config.modResults.push({
      type: "property",
      key,
      value: port,
    });

    return config;
  });
};

module.exports = defineConfig;
