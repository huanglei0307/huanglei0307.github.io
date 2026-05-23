const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  webpack: {
    plugins: {
      add: [
        new CopyPlugin({
          patterns: [
            { from: "node_modules/onnxruntime-web/dist/*.wasm", to: "static/js/[name][ext]" },
            { from: './public/model/model.onnx', to: '[name][ext]'},
            { from: './public/model/nms-yolov8.onnx', to: '[name][ext]'},
            { from: './public/model/mask-yolov8-seg.onnx', to: '[name][ext]'}
          ],
        }),
      ],
    },
    configure: (config) => {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
      // 添加对 .ts 和 .tsx 的支持
      config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx'];
      return config;
    },
  },
};