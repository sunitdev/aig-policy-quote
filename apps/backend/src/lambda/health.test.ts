import type { APIGatewayProxyEvent, Context } from "aws-lambda";

import { handler } from "./health";

describe("health handler", () => {
  it("returns the shared health response contract", async () => {
    const response = await handler(
      {
        headers: {},
        multiValueHeaders: {}
      } as APIGatewayProxyEvent,
      {} as Context
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-transform",
      "content-type": "application/json"
    });
    expect(response.body).toBe(JSON.stringify({ status: "ok" }));
  });
});
