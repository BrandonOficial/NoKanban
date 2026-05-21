//@ts-check
"use strict";

const path = require("path");

// ==========================================
// 1. CONFIGURAÇÃO DO BACKEND (VS CODE)
// ==========================================
/** @type {import('webpack').Configuration} */
const extensionConfig = {
  target: "node", // O core da extensão corre em Node.js
  mode: "none",
  entry: "./src/extension.ts", // Ponto de entrada do backend
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode", // O módulo vscode é injetado em tempo de execução
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
    ],
  },
  devtool: "nosources-source-map",
  infrastructureLogging: { level: "log" },
};

// ==========================================
// 2. CONFIGURAÇÃO DO FRONTEND (WEBVIEW)
// ==========================================
/** @type {import('webpack').Configuration} */
const webviewConfig = {
  target: "web", // O frontend corre no Browser (DOM)
  mode: "none",
  entry: "./src/webview/main.ts", // O nosso novo ponto de entrada Clean Code!
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "webview.js", // Este é o ficheiro que o webviewHtml.ts vai importar
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
    ],
  },
  devtool: "nosources-source-map",
  infrastructureLogging: { level: "log" },
};

// Exportamos ambas as configurações num array!
module.exports = [extensionConfig, webviewConfig];
