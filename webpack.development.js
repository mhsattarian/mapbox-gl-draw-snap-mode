const path = require("path");

module.exports = {
  entry: "./src/docs.js",
  devServer: {
    contentBase: path.join(__dirname, "docs"),
    compress: true,
    port: 9000,
    hot: true,
  },
  devtool: "source-map",
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false,
    },
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "docs"),
  },
};
