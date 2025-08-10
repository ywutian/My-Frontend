module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 忽略 html2pdf.js 的 source map 警告
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map from.*html2pdf\.js/
      ];
      
      return webpackConfig;
    },
  },
};
