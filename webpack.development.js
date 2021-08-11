/**
 * note:
 * Webpack dev Server had a problem with `umd` builds,
 * so v4 beta is used to fix that.
 *
 * it also possible to use the `3.11.0` version as well with `hot` and `injectClient` set to `false`.
 */

const path = require("path");

module.exports = [
  {
    mode: "development",
    devServer: {
      static: path.join(__dirname, "docs"),
      compress: true,
      port: 9000,
      hot: true,
    },
    entry: "./src/index.js",
    devtool: "source-map",
    output: {
      filename: "index.js",
      library: "mapboxGlDrawSnapMode",
      libraryTarget: "umd",
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
  },
];
