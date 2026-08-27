/** Webpack configuration for the sandboxed React renderer bundle. */
import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";

export const rendererConfig: Configuration = {
  // Preserve source locations for browser-side workflow debugging.
  devtool: "source-map",
  module: { rules },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
  },
};
