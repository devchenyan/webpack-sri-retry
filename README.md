# webpack-sri

基于webpack4的sri（subresource integrity）易用解决方案，参考整合[webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity)、[webpack-retry-load-plugin](https://github.com/hxfdarling/webpack-retry-load-plugin)

- 自动为静态资源js/css添加integrity标识
- 通过配置retryPublicPath，绑定自动从你配置的其它域名 (例如主域) 重新下载哪些失败的资源
- 插件必须配合 html-webpack-plugin 和 mini-css-extract-plugin
- 可以配置监控，支持上报成功和失败的量

# 安装
```
npm install webpack-sri-retry -D

or

yarn add --dev webpack-sri-retry
```

# 使用
## mergedConfig
合并weback的config，不改变config。通常webapck配置文件中，使用该方法
```
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
    retryPublicPath: "https://www.retryPublicPath.com", // 重试cdn
  }
);
```

## extendConfig
扩展weback的config，改变config。nuxtjs等框架中使用该方法
```
const { extendConfig } = require("webpack-sri-retry");

module.exports = {
  build: {
    extend(config, ctx) {
      if (ctx.isClient) {
        extendConfig(config, {
          retryPublicPath: "https://www.retryPublicPath.com", // 重试cdn
        });
      }
    },
    publicPath: "https://www.publicPath.com",
  }
};
```

## 上报
入口模版中定义`BJ_REPORT`的report 或 reportFail、reportRetryFail
```
<script>
  var BJ_REPORT = {};
  BJ_REPORT.report = function (data) {
    // 可以上报所有成功失败的资源加载
  };

  BJ_REPORT.reportFail = function ({ src }) {
    // 便捷的首次加载失败上报
  };

  BJ_REPORT.reportRetryFail = function ({ newSrc }) {
    // 便捷的重试加载失败上报
  };
</script>
```

