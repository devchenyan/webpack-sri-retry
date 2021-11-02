var { mergedConfig } = require("webpack-sri-retry");

module.exports = mergedConfig(
  {
    entry: {
      index: "./index.js",
    },
    output: {
      filename: "bundle.js",
      publicPath: "https://www.publicPath.com",
    },
  },
  {
    retryPublicPath: "https://www.retryPublicPath.com",
  }
);
