module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/uit--rypts/'
    : '/',
  devServer: {
    port: 8090
  }
};
