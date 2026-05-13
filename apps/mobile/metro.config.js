const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Resolve dependencies from both app and workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Avoid duplicate package resolution passes in large workspaces.
config.resolver.disableHierarchicalLookup = true;

// Only watch what the app actually imports from the workspace.
config.watchFolders = [path.resolve(workspaceRoot, "packages")];

module.exports = config;
