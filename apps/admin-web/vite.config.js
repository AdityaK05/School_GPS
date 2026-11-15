"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)({})],
    resolve: {
        alias: {
            '@school-transport-platform/client-sdk': path_1.default.resolve(__dirname, '../../packages/client-sdk/src'),
            '@school-transport-platform/constants': path_1.default.resolve(__dirname, '../../packages/constants/src'),
            '@school-transport-platform/shared-types': path_1.default.resolve(__dirname, '../../packages/shared-types/src'),
            '@school-transport-platform/utils': path_1.default.resolve(__dirname, '../../packages/utils/src'),
            '@school-transport-platform/validation': path_1.default.resolve(__dirname, '../../packages/validation/src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
