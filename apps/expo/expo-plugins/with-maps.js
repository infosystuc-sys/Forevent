const { withSettingsGradle, withAppBuildGradle } = require("@expo/config-plugins");
const path = require("path");

function withMaps(config) {
  config = withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes(":react-native-maps")) {
      const mapsPath = path.resolve(__dirname, "../../../node_modules/react-native-maps/android");
      config.modResults.contents += `\ninclude ':react-native-maps'\nproject(':react-native-maps').projectDir = new File('${mapsPath}')\n`;
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

  return config;
}

module.exports = withMaps;
