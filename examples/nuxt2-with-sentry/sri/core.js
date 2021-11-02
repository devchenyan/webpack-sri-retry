var BJ_REPORT = {};
BJ_REPORT.onFirstError = function ({ src }) {
  console.log(`【sri - 开始回源】--${src}`);
};

BJ_REPORT.onRetryError = function ({ newSrc }) {
  console.log(`【sri - 回源失败】--${newSrc}`);
};
