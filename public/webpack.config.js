const path = require('path');
const webpack = require('webpack');
const sqlite3 = require('sqlite3');
var { WebcastPushConnection } = require('tiktok-live-connector');
var say = require('say');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js'
    }),
    new webpack.ProvidePlugin({
      sqlite3: 'sqlite3',
    }),
  ]
};