# webpack-sri-retry

基于webpack4的sri（subresource integrity）易用解决方案，参考整合[webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity)、[webpack-retry-load-plugin](https://github.com/hxfdarling/webpack-retry-load-plugin)

- 自动为静态资源js/css添加integrity标识
- 绑定自动从你配置的其它域名 (retryPublicPath) 重新下载那些失败的资源
- 插件必须配合 html-webpack-plugin
- 可以配置监控，支持上报成功和失败的量

## 安装
```
npm install webpack-sri-retry -D

or

yarn add webpack-sri-retry -D
```

## 使用
### combineConfig(`config`, `options`)
合并weback的config，不改变config。通常webapck配置文件中，使用该方法

```
const HtmlWebpackPlugin = require("html-webpack-plugin");
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

### extend(`config`, `options`)
扩展weback的config，改变config。nuxtjs等框架中使用该方法

```
const { extendConfig } = require("webpack-sri-retry");

module.exports = {
  build: {
    extend(config, ctx) {
      if (ctx.isClient) {
        extendConfig(config, {
          retryPublicPath: "https://www.retryPublicPath.com", // 重试cdn
          ssr: true,
        });
      }
    },
    publicPath: "https://www.publicPath.com",
  }
};
```

## Options
### retryPublicPath
Type: `string`

Default: `''`

自动从配置的retryPublicPath 重新下载失败的资源

如未配置，则资源加载失败后不会进行重试

### hashFuncNames
Type: `array`

Default: `["sha256"]`

如需特别配置参考：https://github.com/waysact/webpack-subresource-integrity/tree/1.x/#hashfuncnames

### ssr
Type: `boolean`

Default: `false`

如需要在服务端渲染项目中使用：

- 需配置`ssr:true`

- 同时在服务端response页面时使用`processedSSRTemplate`方法对html模版页面进行处理（为动态注入的js、css添加integrity及失败重试处理等标识）

```
如在nuxt中，通过hooks对html进行处理：

'render:route'(url, result, context) {
    if (!context.spa) {
      result.html = processedSSRTemplate(result.html)
    }
  },
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

