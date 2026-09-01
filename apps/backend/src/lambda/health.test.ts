import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { APIGatewayProxyEvent, Context } from "aws-lambda";

import { handler } from "./health";

void describe("health handler", () => {
  void it("returns the shared health response contract", async () => {
    const response = await handler(
      {
        headers: {},
        multiValueHeaders: {}
      } as APIGatewayProxyEvent,
      {} as Context
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.headers, {
      "content-type": "application/json"
    });
    assert.equal(response.body, JSON.stringify({ status: "ok" }));
  });
});
