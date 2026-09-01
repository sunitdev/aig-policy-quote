import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { uiInputsResponseSchema, type UIInputsResponse } from "@policy-quote/api-contract";

import { defaultRiskKnowledgeBasePath } from "./constants";
import { knowledgeBaseV1Schema, type KnowledgeBaseV1 } from "./types";

const knowledgeBaseCache = new Map<string, KnowledgeBaseV1>();

interface GetUIInputsOptions {
  knowledgeBase?: KnowledgeBaseV1;
  knowledgeBasePath?: string;
}

export function parseKnowledgeBase(input: string): KnowledgeBaseV1 {
  return knowledgeBaseV1Schema.parse(JSON.parse(input));
}

export function loadKnowledgeBase(path: string): KnowledgeBaseV1 {
  if (!existsSync(path)) {
    throw new Error(`Knowledge base file not found: ${path}`);
  }

  return parseKnowledgeBase(readFileSync(path, "utf8"));
}

export function getKnowledgeBase(path: string): KnowledgeBaseV1 {
  const cacheKey = resolve(path);
  const cachedKnowledgeBase = knowledgeBaseCache.get(cacheKey);

  if (cachedKnowledgeBase) {
    return cachedKnowledgeBase;
  }

  const knowledgeBase = loadKnowledgeBase(cacheKey);
  knowledgeBaseCache.set(cacheKey, knowledgeBase);

  return knowledgeBase;
}

export function getUIInputs(options: GetUIInputsOptions = {}): UIInputsResponse {
  const knowledgeBase =
    options.knowledgeBase ??
    getKnowledgeBase(options.knowledgeBasePath ?? getDefaultKnowledgeBasePath());

  return uiInputsResponseSchema.parse(knowledgeBase.uiInputs);
}

function getDefaultKnowledgeBasePath(): string {
  return process.env.RISK_KB_PATH ?? defaultRiskKnowledgeBasePath;
}

export type { GetUIInputsOptions };
