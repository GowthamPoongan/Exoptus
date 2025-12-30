const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve (sub)dependencies from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Exclude problematic directories from file watching (fixes ENOENT errors)
config.resolver.blockList = [
  // Exclude Gradle build directories (using Windows-compatible patterns)
  /node_modules[/\\]@react-native[/\\]gradle-plugin[/\\].*[/\\]build[/\\].*/,
  /android[/\\]build[/\\].*/,
  /android[/\\]app[/\\]build[/\\].*/,
  /android[/\\]\.gradle[/\\].*/,
];

module.exports = config;
