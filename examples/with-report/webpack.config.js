const HtmlWebpackPlugin = require("html-webpack-plugin");
const { mergedConfig } = require("webpack-sri-retry");

module.exports = mergedConfig(
  {
    entry: {
      index: "./index.js",
    },
    output: {
      filename: "bundle.js",
      publicPath: "https://www.publicPath.com",
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "index.html",
      }),
    ],
  },
  {
    retryPublicPath: "https://www.retryPublicPath.com",
  }
);
