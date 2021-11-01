const { mergeWithCustomize, unique, merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SriPlugin = require("webpack-subresource-integrity");
const WebpackAssetsManifest = require("webpack-assets-manifest");
const RetryPlugin = require("./plugin");

const _crossOriginLoading = "anonymous";

function getPlugins(options) {
  const { retryPublicPath } = options;
  const _plugins = [
    new SriPlugin({
      hashFuncNames: ["sha256"],
    }),
    new WebpackAssetsManifest({
      integrity: true,
    }),
  ];
  if (retryPublicPath) {
    _plugins.unshift(
      new RetryPlugin({
        retryPublicPath,
      })
    );
  }
  return _plugins;
}

function extendConfig(config, options) {
  config.output.crossOriginLoading = _crossOriginLoading;
  config.plugins.push(...getPlugins(options));
}

function mergedConfig(config, options) {
  const _config = mergeWithCustomize({
    customizeArray: unique(
      "plugins",
      ["HtmlWebpackPlugin"],
      (plugin) => plugin.constructor && plugin.constructor.name
    ),
  })(
    {
      plugins: [new HtmlWebpackPlugin()],
    },
    config
  );
  return merge(_config, {
    output: {
      crossOriginLoading: _crossOriginLoading,
    },
    plugins: getPlugins(options),
  });
}

module.exports = {
  extendConfig,
  mergedConfig,
};
