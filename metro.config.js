const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  const { resolver } = config;

  config.resolver = {
    ...resolver,
    assetExts: [...resolver.assetExts, "bin"],
  };

  return config;
})();
