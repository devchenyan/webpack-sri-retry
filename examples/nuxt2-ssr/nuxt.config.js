const { extendConfig } = require("webpack-sri-retry");

const sriHooks = require("./hooks");

module.exports = {
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (ctx.isClient) {
        extendConfig(config, {
          retryPublicPath: "https://www.retryPublicPath.com",
        });
      }
    },
    publicPath: "https://www.publicPath.com",
  },
  hooks: sriHooks,
};
