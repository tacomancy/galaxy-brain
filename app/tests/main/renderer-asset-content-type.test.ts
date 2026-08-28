import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { contentTypeFor } from "../../src/main/renderer-asset-content-type";

describe("packaged renderer asset content types", () => {
  it("serves CSS with a stylesheet content type", () => {
    assert.equal(contentTypeFor("index.css"), "text/css; charset=UTF-8");
  });

  it("keeps the other renderer asset mappings explicit", () => {
    assert.equal(contentTypeFor("index.html"), "text/html; charset=UTF-8");
    assert.equal(contentTypeFor("index.js"), "text/javascript; charset=UTF-8");
    assert.equal(contentTypeFor("font.woff2"), "application/octet-stream");
  });
});
