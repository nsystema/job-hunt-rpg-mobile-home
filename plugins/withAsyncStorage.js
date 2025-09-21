const pluginCandidates = [
  '@react-native-async-storage/async-storage/plugin',
  '@react-native-async-storage/async-storage/plugin/withAsyncStorage',
  '@react-native-async-storage/async-storage/plugin/build/withAsyncStorage',
];

module.exports = function withAsyncStorage(config) {
  for (const moduleName of pluginCandidates) {
    try {
      const plugin = require(moduleName);
      if (typeof plugin === 'function') {
        return plugin(config);
      }
      if (plugin && typeof plugin.default === 'function') {
        return plugin.default(config);
      }
    } catch (error) {
      if (!error || error.code !== 'MODULE_NOT_FOUND') {
        const logger = globalThis?.console;
        if (logger && typeof logger.warn === 'function') {
          logger.warn(`[withAsyncStorage] Unable to apply plugin from ${moduleName}:`, error);
        }
      }
    }
  }
  return config;
};
