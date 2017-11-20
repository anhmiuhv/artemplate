  const path = require('path');
  const HtmlWebpackPlugin = require('html-webpack-plugin')
  const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
  const CopyWebpackPlugin = require('copy-webpack-plugin');



  module.exports = {
  	entry: './src/index.ts',
  	module: {
  		rules: [
  		{
  			test: /\.tsx?$/,
  			use: 'ts-loader',
  			exclude: /node_modules/
  		}
  		]
  	},
  	resolve: {
  		extensions: [ '.tsx', '.ts', '.js' ]
  	},
  	output: {
  		filename: 'scatterplot.js',
  		path: path.resolve(__dirname, 'dist')
  	}
    , plugins: [new HtmlWebpackPlugin({
      title: 'argraph',
      template: 'src/index.html'
      }),
      new HtmlWebpackIncludeAssetsPlugin({ assets: ['scatterplot.css'], append: true }),
      new CopyWebpackPlugin([{from :'src/css/scatterplot.css' , to: path.resolve(__dirname, 'dist')}])
      ]
  };