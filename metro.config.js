const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('path');

const config = getDefaultConfig(__dirname);

// Enable Fast Refresh
config.transformer.unstable_allowRequireContext = true;

// Improve hot reload performance
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Advanced bundle optimization
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
    toplevel: true, // Enable top-level mangling for better tree shaking
  },
  compress: {
    drop_console: false, // Keep console logs for debugging
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info'], // Remove console logs in production
    passes: 2, // Multiple compression passes
  },
  output: {
    comments: false, // Remove comments to reduce bundle size
  },
};

// Optimize resolver for faster module resolution
config.resolver.alias = {
  // Alias commonly used modules for faster resolution
  '@': resolve(__dirname, './'),
};

// Enable parallel processing for better build performance
config.transformer.parallel = true;

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Enable source maps optimization
config.transformer.minifierPath = require.resolve('metro-minify-terser');

// Optimize for Android-specific performance
if (process.env.PLATFORM === 'android') {
  config.transformer.minifierConfig.compress = {
    ...config.transformer.minifierConfig.compress,
    reduce_vars: true,
    unused: true,
    dead_code: true,
  };
}

module.exports = config;
