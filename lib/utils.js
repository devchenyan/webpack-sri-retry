const crypto = require("crypto");
const htmlparser = require("html-parse-stringify");

/**
 * 处理ssr动态渲染模版时，添加integrity标识及retry支持
 */
function processedSSRTemplate(template) {
  /**
   * 解析template
   * 处理 script
   *    - 含有defer、async 的使用 aic 处理
   * 处理 link - css
   *    - 不处理 as === 'script' 的
   * 返回结果
   */
  const [noscriptStr] = template.match(/<noscript sri>[\s\S]*?<\/noscript>/);
  const str = noscriptStr.replace(/<[\s\S]*?>/g, "");
  const sriHashes = JSON.parse(str);
  let _html = template.replace(noscriptStr, "");

  // 处理script
  _html = _html.replace(/<script\s+[\s\S]*?<\/script>/g, (item) => {
    const [ast] = htmlparser.parse(item);
    if (ast && ast.name === "script" && ast.attrs.src && !ast.attrs.integrity) {
      // const _src = ast.attrs.src.split("/").pop();
      const integrity = sriHashes[ast.attrs.src];
      if (integrity) {
        // TODO: 含有defer、async 的使用 aic 处理
        // const _integrity =
        //   _src === "b45a98a.js"
        //     ? "sha256-q+DCtdFJjROZPy6Gplz8y3nD47r+ASoOw="
        //     : integrity;
        ast.attrs.integrity = integrity;
        ast.attrs.crossorigin = "anonymous";
        ast.attrs.aic = "";
        ast.attrs.onerror = "__retryPlugin.call(this,event)";
        ast.attrs.onload = "__retryPlugin.call(this,event)";
      }
    }
    return htmlparser.stringify([ast]);
  });

  // 处理css
  // _html = _html.replace(/<link\s+[\s\S]*?>/g, (item) => {
  //   const [ast] = htmlparser.parse(item);
  //   if (ast && ast.name === "link" && ast.attrs.href && ast.attrs.type === "text/css") {
  //     // const _src = ast.attrs.src.split("/").pop();
  //     // const integrity = sriHashes[_src];
  //     // const _integrity =
  //     //   _src === "b45a98a.js"
  //     //     ? "sha256-q+DCtdFJjROZPy6Gplz8y3nD47r+ASoOw="
  //     //     : integrity;
  //     // if (integrity && !ast.attrs.integrity) {
  //     //   ast.attrs.integrity = _integrity;
  //     //   ast.attrs.crossorigin = "anonymous";
  //     //   ast.attrs.aic = "";
  //     //   ast.attrs.onerror = "__retryPlugin.call(this,event)";
  //     //   ast.attrs.onload = "__retryPlugin.call(this,event)";
  //     // }
  //   }
  //   return htmlparser.stringify([ast])
  // });

  return _html;
}

function getSRIHash(hashes, content) {
  return Array.isArray(hashes)
    ? hashes
        .map((hash) => {
          const integrity = crypto
            .createHash(hash)
            .update(content, "utf8")
            .digest("base64");

          return `${hash}-${integrity}`;
        })
        .join(" ")
    : "";
}

module.exports = {
  processedSSRTemplate,
  getSRIHash,
};
