const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const path = require("path");

module.exports = [
  {
    mode: "production",
    entry: "./src/index.js",
    devtool: "source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "mapbox-gl-draw-snap-mode.js",
      library: "mapboxGlDrawSnapMode",
      libraryTarget: "umd",
      globalObject: "this",
      // libraryExport: 'default',
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({ parallel: true })],
    },
    // externals: [/^(@mapbox\/mapbox-gl-draw).*$/],
    // externals: [
    //   function ({ context, request }, callback) {
    //     if (/^(@mapbox\/mapbox-gl-draw).*$/.test(request)) {
    //       // Externalize to a commonjs module using the request path
    //       return callback(null, {
    //         root: "MapboxDraw",
    //         commonjs: request,
    //         commonjs2: request,
    //       });
    //     }

    //     // Continue without externalizing the import
    //     callback();
    //   },
    // ],
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
    plugins: [
      // new BundleAnalyzerPlugin({
      //   analyzerMode: "server",
      //   generateStatsFile: true,
      //   statsOptions: { source: false },
      // }),
    ],
  },
];
