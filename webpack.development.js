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
    }
  },
];
