const { mergeWithCustomize, unique, merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SriPlugin = require("webpack-subresource-integrity");
const WebpackAssetsManifest = require("webpack-assets-manifest");
const SriRetryPlugin = require("./plugin");

const _crossOriginLoading = "anonymous";

function getPlugins(options) {
  const {
    retryPublicPath,
    hashFuncNames = ["sha256"],
    minimize = true,
  } = options;
  const _plugins = [
    new SriPlugin({
      hashFuncNames,
    }),
    new WebpackAssetsManifest({
      integrity: true,
    }),
  ];
  if (retryPublicPath) {
    _plugins.unshift(
      new SriRetryPlugin({
        retryPublicPath,
        minimize,
      })
    );
  }
  return _plugins;
}

/**
 * 扩展weback的config，改变config
 *
 * nuxtjs等框架中使用该方法
 */
function extendConfig(config, options) {
  config.output.crossOriginLoading = _crossOriginLoading;
  config.plugins.push(...getPlugins(options));
}

/**
 * 合并weback的config，不改变config
 *
 * 通常webapck配置文件中，使用该方法
 */
function combineConfig(config, options) {
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
  combineConfig,
};
