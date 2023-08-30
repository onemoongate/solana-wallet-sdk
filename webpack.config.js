const path = require('path');

module.exports = {
  entry: './src/index.js',  // Adjust this if your entry file is different.
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',  // This ensures your package works in various environments.
    globalObject: 'this'  // This ensures the package works in Node.js and browser environments.
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
