import type { FastifyInstance, FastifyReply } from "fastify";

import { createQuoteEndpoint } from "../endpoints/create-quote.endpoint";
import { getHealthEndpoint } from "../endpoints/health.endpoint";
import { getQuoteUIInputsEndpoint } from "../endpoints/quote-ui-inputs.endpoint";

export function registerBackendRoutes(server: FastifyInstance): void {
  server.get("/health", (_request, reply) => {
    return sendJson(reply, getHealthEndpoint());
  });

  server.get("/policy/quote/ui-inputs", (_request, reply) => {
    return sendJson(reply, getQuoteUIInputsEndpoint());
  });

  server.post("/policy/quote", (request, reply) => {
    if (request.body === undefined || request.body === null) {
      return sendJson(reply.status(400), {
        message: "Request body is required."
      });
    }

    const result = createQuoteEndpoint(request.body);

    return sendJson(reply.status(result.statusCode), result.body);
  });
}

function sendJson(reply: FastifyReply, body: unknown): FastifyReply {
  return reply.header("cache-control", "no-transform").send(body);
}
