/** Shared TypeScript compilation rule used by main and renderer bundles. */
import type { ModuleOptions } from "webpack";

export const rules: Required<ModuleOptions>["rules"] = [
  {
    // Both .ts and .tsx use the repository's strict TypeScript configuration;
    // typechecking remains a separate explicit verification step.
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: "ts-loader",
      options: { transpileOnly: true },
    },
  },
];
