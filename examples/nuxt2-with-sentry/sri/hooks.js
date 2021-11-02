const fs = require("fs");
const path = require("path");
const htmlparser = require("html-parse-stringify");

let _outPath = ".nuxt/dist/client";

const getManifestPath = () => path.resolve(_outPath, "manifest.json");

module.exports = {
  "vue-renderer:ssr": {
    templateParams(templateParams) {
      const { APP } = templateParams;
      const manifest = JSON.parse(fs.readFileSync(getManifestPath()));
      const manifestMap = {};
      Object.values(manifest).forEach((item) => {
        manifestMap[item.src] = item.integrity;
      });

      const _strArr = APP.split("<script src=").map((item, index) => {
        if (!index) return item;
        const [ast] = htmlparser.parse(`<script src=${item}`);
        if (ast && ast.name === "script" && ast.attrs.src) {
          const _src = ast.attrs.src.split("/").pop();
          const integrity = manifestMap[_src];
          if (integrity) {
            ast.attrs.integrity = integrity;
            ast.attrs.crossorigin = "anonymous";
            ast.attrs.isAsync = "";
            ast.attrs.onerror = "__retryPlugin.call(this,event)";
          }
        }
        return htmlparser.stringify([ast]);
      });
      templateParams.APP = _strArr.join("");
    },
  },
  build: {
    compiled({ name, compiler }) {
      if (name === "client") {
        _outPath = compiler.outputPath;
      }
    },
  },
};
