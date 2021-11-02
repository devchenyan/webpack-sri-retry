#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const lodash = require("lodash");

const appTemplate = fs.readFileSync(path.resolve(__dirname, "./app.template"), {
  encoding: "utf-8",
});
const _CORE = fs.readFileSync(path.resolve(__dirname, "./core.js"), {
  encoding: "utf-8",
});

const compiled = lodash.template(appTemplate);

fs.writeFileSync(path.resolve(__dirname, "../app.html"), compiled({ _CORE }));
