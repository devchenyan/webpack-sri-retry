const { ConcatSource } = require("webpack-sources");
const { ModuleFilenameHelpers } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const attrParse = require("./attributesParser");
const { SCRIPT, SRI_RETRY_PLUGIN } = require("./const");
const MainTemplatePlugin = require("./mainTemplatePlugin");
const babel = require("./babel");

const varName = "__JS_RETRY__";

/**
 * @typedef {Object} PluginOptions
 * @property {String} retryPublicPath 重试加载地址，例如://fudao.qq.com/pc
 * @property {Boolean?} entryOnly default false
 * @property {String|RegExp|Array?} test 正则
 * @property {String|RegExp|Array?} include 需要重试的文件，可以不传
 * @property {String|RegExp|Array?} exclude 不需要重试的文件
 * @property {String|Number} JS_SUCC_MSID JS成功
 * @property {String|Number} JS_FAIL_MSID JS失败
 * @property {String|Number} CSS_SUCC_MSID CSS成功
 * @property {String|Number} CSS_FAIL_MSID CSS失败
 * @property {String|Number} JS_RETRY_SUCC_MSID JS重试成功
 * @property {String|Number} JS_RETRY_FAIL_MSID JS重试失败
 * @property {String|Number} CSS_RETRY_SUCC_MSID CSS重试成功
 * @property {String|Number} CSS_RETRY_FAIL_MSID CSS重试失败
 */

class SriRetryPlugin {
  constructor(options) {
    if (arguments.length > 1) {
      throw new Error("Retry only takes one argument (pass an options object)");
    }
    if (!options || options.retryPublicPath === undefined) {
      throw new Error("Retry need options.retryPublicPath");
    }

    /** @type {PluginOptions} */
    this.options = Object.assign(
      {
        minimize: true, // 默认压缩
        comments: false, // 默认不显示注释

        JS_SUCC_MSID: 101,
        JS_FAIL_MSID: 1001,
        CSS_SUCC_MSID: 102,
        CSS_FAIL_MSID: 1002,

        JS_RETRY_SUCC_MSID: 201,
        JS_RETRY_FAIL_MSID: 2001,
        CSS_RETRY_SUCC_MSID: 202,
        CSS_RETRY_FAIL_MSID: 2002,
      },
      options
    );

    this.sriRetryHashes = {};
  }

  genBadJsCode() {
    const {
      JS_SUCC_MSID = "",
      JS_FAIL_MSID = "",
      CSS_SUCC_MSID = "",
      CSS_FAIL_MSID = "",

      JS_RETRY_SUCC_MSID = "",
      JS_RETRY_FAIL_MSID = "",
      CSS_RETRY_SUCC_MSID = "",
      CSS_RETRY_FAIL_MSID = "",
    } = this.options;
    return `
var JS_SUCC_MSID = "${JS_SUCC_MSID}";
var JS_FAIL_MSID = "${JS_FAIL_MSID}";
var CSS_SUCC_MSID = "${CSS_SUCC_MSID}";
var CSS_FAIL_MSID = "${CSS_FAIL_MSID}";

var JS_RETRY_SUCC_MSID = "${JS_RETRY_SUCC_MSID}";
var JS_RETRY_FAIL_MSID = "${JS_RETRY_FAIL_MSID}";
var CSS_RETRY_SUCC_MSID = "${CSS_RETRY_SUCC_MSID}";
var CSS_RETRY_FAIL_MSID = "${CSS_RETRY_FAIL_MSID}";

var BADJS_LEVEL = ${this.options.badjsLevel || 2};

var report = function(data){
  setTimeout(function(){
    if (!window.BJ_REPORT) return
    if (BJ_REPORT.report) BJ_REPORT.report(data);

    const { ext = {} } = data
    if (ext.msid > 2000) {
      BJ_REPORT.reportRetryFail && BJ_REPORT.reportRetryFail(ext)
    } else if (ext.msid > 1000) {
      BJ_REPORT.reportFail && BJ_REPORT.reportFail(ext)
    }
  },2000);
}
`;
  }

  genGetRetryUrlCode() {
    return `
function getRetryUrl(src){
  var retryPublicPath  = "${this.options.retryPublicPath}";
  var publicPath = "${this.publicPath}";

  if(retryPublicPath){
    retryPublicPath += '/';
    retryPublicPath = retryPublicPath.replace(/\\/\\/$/, '/');
  }
  var value = src.replace(/^https?:/, '').replace(publicPath.replace(/^https?:/, ''), '').replace(/^\\//, '');
  return retryPublicPath + value;
}
`;
  }

  genRetryCode() {
    return `
  var isRetry = this.hasAttribute('retry');
  // 只有【异步引入的js chunk包】走这个重试逻辑，同步的都是采用document.write
  var isAic = this.hasAttribute('aic');
  var isStyle = this.tagName==='LINK';
  var isError = event.type==='error'||event.type==='timeout';
  var src = this.href||this.src;
  var newSrc = getRetryUrl(src);
  var _ext = {
    src,
    newSrc
  }
  if(isError){
    // 失败
    if(isRetry){
      report({
        level: BADJS_LEVEL||2,
        msg: this.tagName + ' retry load fail: ' + src,
        ext: {
          msid: isStyle?CSS_RETRY_FAIL_MSID:JS_RETRY_FAIL_MSID,
          ..._ext
        },
      });
    }else{
      if(isStyle){
        // link style 重新加载
        var link = document.createElement('link');
        if (link.as === 'script') return
        link.rel = 'stylesheet';
        link.href= newSrc;
        link.setAttribute('retry','');
        link.setAttribute('crossorigin','anonymous');
        link.setAttribute('onerror',"__retryPlugin.call(this,event)");
        link.setAttribute('onload',"__retryPlugin.call(this,event)");
        this.parentNode.insertBefore(link,this.nextSibling);
      }else if(isAic){
        // js 重新加载
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');

        script.timeout = 120;
        script.src = newSrc;
        script.setAttribute('retry','');
        script.setAttribute('crossorigin','anonymous');
        var _timeout_ = setTimeout(function() {
          script.onerror({ type: 'timeout', target: script });
        }, 120000);
        script.onerror = function(event){
          script.onerror = script.onload = null;
          clearTimeout(_timeout_);
          report({
            level: BADJS_LEVEL||2,
            msg: this.tagName + ' retry load fail: ' + this.src,
            ext: {
              msid: JS_RETRY_FAIL_MSID,
              ..._ext
            },
          });
        }
        script.onload = function(event){
          script.onerror = script.onload = null;
          clearTimeout(_timeout_);
          report({
            level: BADJS_LEVEL||2,
            msg: this.tagName + ' retry load success: ' + this.src,
            ext: {
              msid: JS_RETRY_SUCC_MSID,
              ..._ext
            },
          });
        }
        head.appendChild(script);
      }
      report({
        level: BADJS_LEVEL||2,
        msg: this.tagName + ' load fail: ' + src,
        ext: {
          msid: isStyle?CSS_FAIL_MSID:JS_FAIL_MSID,
          ..._ext
        },
      });
    }
  }else{
    // 成功
    if(isRetry){
      report({
        level: BADJS_LEVEL||2,
        msg: this.tagName + ' retry load success: ' + src,
        ext: {
          msid: isStyle?CSS_RETRY_SUCC_MSID:JS_RETRY_SUCC_MSID,
          ..._ext
        },
      });
    }else{
      report({
        level: BADJS_LEVEL||2,
        msg: this.tagName + ' load success: ' + src,
        ext: {
          msid: isStyle?CSS_SUCC_MSID:JS_SUCC_MSID,
          ..._ext
        },
      });
    }
  }
  // 为了页面结构清晰美观，在加载成功/失败上报后都移除onload/onerror
  if (event && event.path && event.path.length) {
    const [_aicDom] = event.path
    _aicDom.removeAttribute('onload')
    _aicDom.removeAttribute('onerror')
  }
`;
  }

  async genInjectCode() {
    let code = `
var ${varName}={};
function __retryPlugin(event){
  try{
    // 修复部分浏览器this.tagName获取失败的问题
    this.onload=this.onerror = null;
    ${this.genBadJsCode()}
    ${this.genGetRetryUrlCode()}
    ${this.genRetryCode()}
  }catch(e){}
}`;
    code = await babel(code, this.options);
    return `<script>${code}</script><noscript sri>${JSON.stringify(
      this.sriRetryHashes
    )} </noscript>`;
  }

  getRetryUrl(src) {
    let { retryPublicPath } = this.options;
    const { publicPath } = this;

    if (retryPublicPath) {
      retryPublicPath += "/";
      retryPublicPath = retryPublicPath.replace(/\/\/$/, "/");
    }

    const value = src
      .replace(/^https?:/, "")
      .replace(publicPath.replace(/^https?:/, ""), "")
      .replace(/^\//, "");
    return retryPublicPath + value;
  }

  registerHwpHooks(compilation) {
    // HtmlWebpackPlugin >= 4
    const hwpHooks = HtmlWebpackPlugin.getHooks(compilation);

    hwpHooks.beforeAssetTagGeneration.tapAsync(
      SRI_RETRY_PLUGIN,
      (pluginArgs, callback) => {
        callback(null, pluginArgs);
      }
    );

    hwpHooks.alterAssetTags.tap(SRI_RETRY_PLUGIN, ({ assetTags }) => {
      const code = "__retryPlugin.call(this,event)";
      assetTags.styles.map((tag) => {
        tag.attributes.onerror = code;
        tag.attributes.onload = code;
      });
      assetTags.scripts
        .filter((tag) => tag.attributes && tag.attributes.src)
        .map((tag) => {
          tag.attributes.onerror = code;
          tag.attributes.onload = code;
        });
    });

    hwpHooks.beforeEmit.tapAsync(
      SRI_RETRY_PLUGIN,
      async (pluginArgs, callback) => {
        let { html } = pluginArgs;

        const headReg = /(<head)[\s\S]*?>/;
        const [headTagStr] = html.match(headReg);
        html = html.replace(
          headReg,
          `${headTagStr}${await this.genInjectCode()}`
        );

        const scripts = attrParse(html).filter((tag) => tag.name === SCRIPT);

        scripts.reverse();
        html = [html];
        scripts.forEach((tag) => {
          const { attrs } = tag;
          let url = "";
          attrs.map((attr) => {
            if (attr.name === "src") {
              attr.value = this.getRetryUrl(attr.value);
              url = attr.value;
            }
          });

          let code = "";

          if (url) {
            const filename = path.basename(url);
            if (this.matchObject(url)) {
              const script = `\\x3Cscript type="text/javascript" ${attrs
                .filter(({ name }) => ["integrity"].indexOf(name) < 0)
                .map((i) => `${i.name}="${i.value}"`)
                .join(" ")} retry>\\x3C/script>`;
              code = `<script>if(!__JS_RETRY__["${filename}"]){document.write('${script}');}</script>`;
            }
          } else {
            throw Error("not found url");
          }

          const x = html.pop();
          html.push(x.substr(tag.end));
          html.push(code);
          html.push(x.substr(0, tag.end));
        });
        html.reverse();
        html = html.join("");

        pluginArgs.html = html;
        callback(null, pluginArgs);
      }
    );
  }

  registerMTP(compiler, compilation) {
    // MainTemplatePlugin
    const plugin = new MainTemplatePlugin(this, compilation);
    if (plugin.apply) {
      plugin.apply(compilation.mainTemplate);
    } else {
      compilation.mainTemplate.apply(plugin);
    }
  }

  apply(compiler) {
    const { options } = this;
    this.publicPath = compiler.options.output.publicPath || "";
    this.matchObject = ModuleFilenameHelpers.matchObject.bind(
      undefined,
      options
    );
    compiler.hooks.compilation.tap(SRI_RETRY_PLUGIN, (compilation) => {
      this.registerHwpHooks(compilation);

      compilation.hooks.optimizeChunkAssets.tap(SRI_RETRY_PLUGIN, (chunks) => {
        for (const chunk of chunks) {
          if (options.entryOnly && !chunk.canBeInitial()) {
            continue;
          }
          // 每个 Chunk 都有一个 files 属性，指向这个 chunk 创建的所有文件
          for (const file of chunk.files) {
            if (!this.matchObject(file)) {
              continue;
            }

            let basename;
            let filename = file;

            const querySplit = filename.indexOf("?");

            if (querySplit >= 0) {
              filename = filename.substr(0, querySplit);
            }

            const lastSlashIndex = filename.lastIndexOf("/");

            if (lastSlashIndex === -1) {
              basename = filename;
            } else {
              basename = filename.substr(lastSlashIndex + 1);
            }

            // 只有js需要标记
            if (!/.js$/.test(filename)) continue;

            const code = `var ${varName}=${varName}||{};\n${varName}["${basename}"]=true;`;
            // 资源(asset)会被存储在 compilation.assets
            compilation.assets[file] = new ConcatSource(
              code,
              "\n",
              compilation.assets[file]
            );
          }
        }
      });

      compilation.hooks.afterOptimizeAssets.tap(SRI_RETRY_PLUGIN, (assets) => {
        for (const [key, value] of Object.entries(assets)) {
          if (/.(js|css)$/.test(key)) {
            this.sriRetryHashes[`${this.publicPath}${key}`] = value.integrity;
          }
        }
      });
    });
    compiler.hooks.afterPlugins.tap(SRI_RETRY_PLUGIN, (compiler) => {
      compiler.hooks.thisCompilation.tap(
        SRI_RETRY_PLUGIN,
        this.registerMTP.bind(this, compiler)
      );
    });
  }
}

module.exports = SriRetryPlugin;
