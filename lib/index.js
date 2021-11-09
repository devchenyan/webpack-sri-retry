const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SriPlugin = require("webpack-subresource-integrity");
const SriRetryPlugin = require("./plugin");
const { processedSSRTemplate, getSRIHash } = require("./utils");

const _crossOriginLoading = "anonymous";

function getPlugins(options) {
  const { retryPublicPath, hashFuncNames = ["sha256"] } = options;
  const _plugins = [
    new SriPlugin({
      hashFuncNames,
    }),
  ];
  if (retryPublicPath) {
    _plugins.push(
      new SriRetryPlugin({
        retryPublicPath,
        hashFuncNames,
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
  let { plugins = [] } = config;
  const hwp = plugins.filter(
    (item) => item?.constructor?.name === "HtmlWebpackPlugin"
  );
  if (!hwp.length) {
    plugins.push(new HtmlWebpackPlugin());
  }
  return merge(config, {
    output: {
      crossOriginLoading: _crossOriginLoading,
    },
    plugins: [...plugins, ...getPlugins(options)],
  });
}

module.exports = {
  extendConfig,
  combineConfig,
  processedSSRTemplate,
  getSRIHash,
};
