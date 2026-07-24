import { describe, expect, it } from "vitest";

import { isUsableAslSignsModelResponse, isUsableGestureModelResponse } from "./modelAssets";

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

  it("requires the ASL Signs model to be large enough to be plausible", () => {
    const tinyResponse = new Response(null, {
      status: 200,
      headers: {
        "content-length": "250000",
        "content-type": "application/octet-stream",
      },
    });
    const modelResponse = new Response(null, {
      status: 200,
      headers: {
        "content-length": "11242036",
        "content-type": "application/octet-stream",
      },
    });

    expect(isUsableAslSignsModelResponse(tinyResponse)).toBe(false);
    expect(isUsableAslSignsModelResponse(modelResponse)).toBe(true);
  });
});
