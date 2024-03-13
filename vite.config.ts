// https://vitejs.dev/config/
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import pkg from './package.json';
import {Simulate} from "react-dom/test-utils";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-cpy';
import external from 'rollup-plugin-peer-deps-external';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
export default ({ mode }: { mode: string }) => {
  return defineConfig({
    plugins: [react()],
    build: {
      sourcemap: true,
      lib: {
        entry: "./src/index.js",
        name: 'material-ui-dropzone',
      },
      rollupOptions: {
        external: ["@mui/core/Button", "@mui/material", "@mui/styles", "@mui/system", "@mui/icons-material"],
        input: 'src/index.js',
        output: [
          {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
          },
          {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
          },
        ],
        plugins: [
          external({
            includeDependencies: true,
          }),
          copy({
            files: ['src/index.d.ts'],
            dest: 'dist',
          }),
          resolve(),
          commonjs(),
          sizeSnapshot(),
        ],
      }
    },

    logLevel: "info",
  });
};
