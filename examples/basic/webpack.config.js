const { combineConfig } = require("webpack-sri-retry");

module.exports = combineConfig(
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
