const { extendConfig } = require("webpack-sri-retry");

const sriHooks = require("./sri/hooks");

const withSri = () => process.env.ENV === "prod" || process.env.ENV === "test";

module.exports = {
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (withSri()) {
        if (ctx.isClient) {
          extendConfig(config, {
            retryPublicPath: "xxxxxxxxxx",
          });
        }
      }
    },
    publicPath: `${process.env.TYPE === "local" ? "" : "xxxxxxxxxxxx"}`,
  },
  hooks: withSri() ? sriHooks : {},
};
