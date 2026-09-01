import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jsonResponse } from "./http-response";

void describe("jsonResponse", () => {
  void it("returns a JSON API Gateway response with default status and content type", () => {
    const response = jsonResponse({
      status: "ok"
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.headers, {
      "content-type": "application/json"
    });
    assert.equal(response.body, JSON.stringify({ status: "ok" }));
  });

  void it("allows status and headers to be customized", () => {
    const response = jsonResponse(
      {
        message: "created"
      },
      {
        statusCode: 201,
        headers: {
          "cache-control": "no-store"
        }
      }
    );

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.headers, {
      "content-type": "application/json",
      "cache-control": "no-store"
    });
    assert.equal(response.body, JSON.stringify({ message: "created" }));
  });
});
