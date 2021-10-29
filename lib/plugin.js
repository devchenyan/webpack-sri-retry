class SriRetryPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.compile.tap("compile", () => {
      console.log("compile-----", this.options);
    });

    compiler.hooks.compilation.tap("compilation", () => {
      console.log("compilation");
    });
  }
}

module.exports = SriRetryPlugin;
