/**
 * Electron Forge package configuration for the desktop Workbench.
 *
 * Packaging uses ASAR and the Webpack plugin so the main process, renderer,
 * and preload bridge are compiled from the same TypeScript application.
 */
import type { ForgeConfig } from "@electron-forge/shared-types";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  // Keep packaged application resources together in the normal Electron
  // archive; the selected Knowledge Repository remains external to it.
  packagerConfig: {
    asar: true,
  },
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            // These are the three pieces of the first vertical Workbench
            // path: document shell, renderer entry, and typed preload bridge.
            html: "./src/renderer/index.html",
            js: "./src/renderer/index.tsx",
            name: "main_window",
            preload: {
              js: "./src/preload/workbench-bridge.ts",
            },
          },
        ],
      },
    }),
  ],
};

export default config;
