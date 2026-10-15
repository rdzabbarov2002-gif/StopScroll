// AsyncStorage on Android keeps everything in one SQLite database capped at 6 MB by default.
// The AI coach keeps the whole history of entries with their analyses, so give it room.
const { withGradleProperties } = require("expo/config-plugins");

const KEY = "AsyncStorage_db_size_in_MB";
const SIZE_MB = "64";

module.exports = function withAsyncStorageSize(config) {
  return withGradleProperties(config, (modConfig) => {
    const properties = modConfig.modResults.filter(
      (item) => !(item.type === "property" && item.key === KEY),
    );
    properties.push({ type: "property", key: KEY, value: SIZE_MB });
    modConfig.modResults = properties;
    return modConfig;
  });
};
