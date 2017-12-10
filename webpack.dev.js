const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const three = require('three')
const data = [ new three.Vector3(2,2,2), new three.Vector3(-2,-9,-2), new three.Vector3(1,0,1), new three.Vector3(2,0,1), new three.Vector3(0,0,0), new three.Vector3(1,1,1) ];

module.exports = merge(common, {
  devtool: 'inline-source-map',
  module: 
  	{
  		rules: [
  		{
  			test: /\.ejs$/,
  			use	: {
      			loader: 'ejs-html-loader',
	  			query: {
	  				data: data

	  			}
  			}
  		}
  	]
  }
  ,
  devServer: {
      contentBase: path.join(__dirname, "dist"),
      compress: true,
      port: 5000,
      host: "0.0.0.0"
   }
});