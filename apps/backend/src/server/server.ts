import { fileURLToPath } from "node:url";

import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { registerBackendRoutes } from "./routes";

interface BuildServerOptions {
  logger?: boolean;
}

export function buildServer({ logger = false }: BuildServerOptions = {}): FastifyInstance {
  const server = Fastify({
    logger
  });

  void server.register(cors, {
    allowedHeaders: ["content-type"],
    methods: ["GET", "POST", "OPTIONS"],
    origin: "*"
  });

  server.setErrorHandler((error, request, reply) => {
    if (isInvalidJsonError(error)) {
      return reply.status(400).header("cache-control", "no-transform").send({
        message: "Request body must be valid JSON."
      });
    }

    request.log.error(error);

    return reply.status(getErrorStatusCode(error)).header("cache-control", "no-transform").send({
      message: "Internal server error."
    });
  });

  registerBackendRoutes(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = buildServer({
    logger: true
  });
  const port = Number(process.env.PORT ?? 3000);

  await server.listen({
    host: "0.0.0.0",
    port
  });
}

function isInvalidJsonError(error: unknown): boolean {
  return getErrorCode(error) === "FST_ERR_CTP_INVALID_JSON_BODY";
}

function getErrorCode(error: unknown): string | undefined {
  if (!isErrorRecord(error)) {
    return undefined;
  }

  return typeof error.code === "string" ? error.code : undefined;
}

function getErrorStatusCode(error: unknown): number {
  if (!isErrorRecord(error)) {
    return 500;
  }

  return typeof error.statusCode === "number" ? error.statusCode : 500;
}

function isErrorRecord(error: unknown): error is { code?: unknown; statusCode?: unknown } {
  return typeof error === "object" && error !== null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
