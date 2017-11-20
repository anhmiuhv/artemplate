const merge = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
      contentBase: path.join(__dirname, "dist"),
      compress: true,
      port: 5000,
      host: "0.0.0.0"
   }
});