import { errorResponse, jsonResponse } from "./http-response";

describe("jsonResponse", () => {
  it("returns a JSON API Gateway response with default status and content type", () => {
    const response = jsonResponse({
      status: "ok"
    });

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

  it("allows status and headers to be customized", () => {
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

    expect(response.statusCode).toBe(201);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-type": "application/json"
    });
    expect(response.body).toBe(JSON.stringify({ message: "created" }));
  });
});

describe("errorResponse", () => {
  it("returns a JSON error response with a default 400 status", () => {
    const response = errorResponse("Invalid request");

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-transform",
      "content-type": "application/json"
    });
    expect(response.body).toBe(JSON.stringify({ message: "Invalid request" }));
  });

  it("allows error response status and headers to be customized", () => {
    const response = errorResponse("Not found", {
      statusCode: 404,
      headers: {
        "cache-control": "no-store"
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-type": "application/json"
    });
    expect(response.body).toBe(JSON.stringify({ message: "Not found" }));
  });
});
