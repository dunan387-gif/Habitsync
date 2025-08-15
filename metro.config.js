const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Fast Refresh
config.transformer.unstable_allowRequireContext = true;

// Improve hot reload performance
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable source maps for better debugging
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
