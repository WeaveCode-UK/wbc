const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from the monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single copy of React and React Native (prevents duplicate React in hooks)
const reactPath = path.dirname(require.resolve('react/package.json', { paths: [projectRoot] }));
const rnPath = path.dirname(require.resolve('react-native/package.json', { paths: [projectRoot] }));

config.resolver.extraNodeModules = {
  react: reactPath,
  'react-native': rnPath,
};

module.exports = config;
