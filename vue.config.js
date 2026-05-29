const { DefinePlugin } = require('webpack');
const pkg = require('./package.json');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/uit--rypts/'
    : '/',
  devServer: {
    port: 8090
  },
  configureWebpack: {
    plugins: [
      new DefinePlugin({
        __APP_VERSION__: JSON.stringify(pkg.version + '-' + Date.now())
      })
    ]
  }
};
