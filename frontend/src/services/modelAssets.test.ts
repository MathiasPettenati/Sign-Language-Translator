import { describe, expect, it } from "vitest";

import { isUsableGestureModelResponse } from "./modelAssets";

describe("model asset detection", () => {
  it("rejects Vite HTML fallback responses for missing gesture models", () => {
    const response = new Response("<!doctype html><html></html>", {
      status: 200,
      headers: {
        "content-length": "27",
        "content-type": "text/html",
      },
    });

    expect(isUsableGestureModelResponse(response)).toBe(false);
  });

  it("accepts plausible binary task model responses", () => {
    const response = new Response(null, {
      status: 200,
      headers: {
        "content-length": "250000",
        "content-type": "application/octet-stream",
      },
    });

    expect(isUsableGestureModelResponse(response)).toBe(true);
  });
});
