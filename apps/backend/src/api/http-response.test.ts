import { jsonResponse } from "./http-response";

describe("jsonResponse", () => {
  it("returns a JSON API Gateway response with default status and content type", () => {
    const response = jsonResponse({
      status: "ok"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
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
      "content-type": "application/json",
      "cache-control": "no-store"
    });
    expect(response.body).toBe(JSON.stringify({ message: "created" }));
  });
});
