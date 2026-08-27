/** Webpack entry and resolution rules for Electron's privileged main process. */
import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";

export const mainConfig: Configuration = {
  // Source maps keep packaged startup failures diagnosable during local QA.
  devtool: "source-map",
  entry: "./src/main/index.ts",
  module: { rules },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
  },
};
