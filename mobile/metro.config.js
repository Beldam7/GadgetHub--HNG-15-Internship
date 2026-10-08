const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const webProjectRoot = require("path").resolve(projectRoot, "..");

config.watchFolders = [projectRoot, webProjectRoot];
config.resolver.nodeModulesPaths = [
  require("path").resolve(projectRoot, "node_modules"),
  require("path").resolve(webProjectRoot, "node_modules"),
];

const { resolver } = config;
resolver.alias = {
  ...resolver.alias,
  "@/config": require("path").resolve(projectRoot, "src/config"),
  "@/types": require("path").resolve(projectRoot, "src/types"),
  "@/lib": require("path").resolve(projectRoot, "src/lib"),
  "@/services": require("path").resolve(projectRoot, "src/services"),
  "@/contexts": require("path").resolve(projectRoot, "src/contexts"),
  "@/components": require("path").resolve(projectRoot, "src/components"),
};

module.exports = config;
