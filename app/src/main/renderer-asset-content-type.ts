import { extname } from "node:path";

/**
 * Returns the content type required for a packaged renderer asset.
 * @param path The packaged renderer asset path.
 * @returns The response content type.
 */
export const contentTypeFor = (path: string): string => {
  switch (extname(path)) {
    case ".html":
      return "text/html; charset=UTF-8";
    case ".js":
      return "text/javascript; charset=UTF-8";
    case ".css":
      return "text/css; charset=UTF-8";
    default:
      return "application/octet-stream";
  }
};
