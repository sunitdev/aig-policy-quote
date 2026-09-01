import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ZodError } from "zod";

import { defaultRiskKnowledgeBasePath } from "./constants";
import { getKnowledgeBase, getUIInputs, loadKnowledgeBase, parseKnowledgeBase } from "./service";
import type { KnowledgeBaseV1 } from "./types";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../../..");
const riskKnowledgeBasePath = join(repoRoot, defaultRiskKnowledgeBasePath);

function validKnowledgeBase(overrides: Partial<KnowledgeBaseV1> = {}): KnowledgeBaseV1 {
  return {
    kbSchemaVersion: "1.0.0",
    version: "1.0.0",
    basePremium: 300,
    coverageLoadFactor: 1.2,
    riskBands: {
      STANDARD: {
        min: 0,
        max: 25,
        riskMultiplier: 1
      },
      ELEVATED: {
        min: 26,
        max: 60,
        riskMultiplier: 1.5
      },
      HIGH_RISK: {
        min: 61,
        max: 999,
        riskMultiplier: 2.2
      }
    },
    uiInputs: [
      {
        id: "propertyType",
        type: "select",
        label: "Type of property",
        options: ["House", "Flat", "Bungalow"]
      }
    ],
    factors: [
      {
        id: "property_type_flat",
        description: "Flat property",
        condition: {
          field: "propertyType",
          operator: "eq",
          value: "Flat"
        },
        points: 10
      }
    ],
    ...overrides
  };
}

function writeKnowledgeBaseFile(knowledgeBase: KnowledgeBaseV1): string {
  const directory = mkdtempSync(join(tmpdir(), "policy-quote-kb-"));
  const path = join(directory, `${knowledgeBase.version}.json`);

  writeFileSync(path, JSON.stringify(knowledgeBase), "utf8");

  return path;
}

describe("KnowledgeBase service", () => {
  describe("parseKnowledgeBase", () => {
    it("parses the real risk knowledge base", () => {
      const knowledgeBase = parseKnowledgeBase(readFileSync(riskKnowledgeBasePath, "utf8"));

      expect(knowledgeBase.kbSchemaVersion).toBe("1.0.0");
      expect(knowledgeBase.version).toBe("1.0.0");
      expect(knowledgeBase.uiInputs).toHaveLength(5);
      expect(knowledgeBase.factors).toHaveLength(6);
      expect(Object.keys(knowledgeBase.riskBands)).toEqual(["STANDARD", "ELEVATED", "HIGH_RISK"]);
    });

    it("throws a SyntaxError for invalid JSON", () => {
      expect(() => parseKnowledgeBase("{")).toThrow(SyntaxError);
    });

    it("throws a ZodError for structurally invalid knowledge base JSON", () => {
      expect(() => parseKnowledgeBase(JSON.stringify({ version: "1.0.0" }))).toThrow(ZodError);
    });
  });

  describe("loadKnowledgeBase", () => {
    it("loads and validates an existing knowledge base file", () => {
      const knowledgeBase = loadKnowledgeBase(riskKnowledgeBasePath);

      expect(knowledgeBase.version).toBe("1.0.0");
      expect(knowledgeBase.basePremium).toBe(300);
      expect(knowledgeBase.riskBands.ELEVATED.riskMultiplier).toBe(1.5);
    });

    it("throws a clear error when the knowledge base file does not exist", () => {
      const missingPath = join(tmpdir(), "policy-quote-missing-kb.json");

      expect(() => loadKnowledgeBase(missingPath)).toThrow(
        new Error(`Knowledge base file not found: ${missingPath}`)
      );
    });
  });

  describe("getKnowledgeBase", () => {
    it("returns the cached knowledge base for repeated calls to the same path", () => {
      const path = writeKnowledgeBaseFile(validKnowledgeBase({ version: "cache-test" }));

      const firstLoad = getKnowledgeBase(path);
      writeFileSync(path, "{", "utf8");
      const secondLoad = getKnowledgeBase(path);

      expect(secondLoad).toBe(firstLoad);
      expect(secondLoad.version).toBe("cache-test");
    });

    it("keeps separate cache entries for different paths", () => {
      const firstPath = writeKnowledgeBaseFile(validKnowledgeBase({ version: "cache-path-a" }));
      const secondPath = writeKnowledgeBaseFile(validKnowledgeBase({ version: "cache-path-b" }));

      const firstKnowledgeBase = getKnowledgeBase(firstPath);
      const secondKnowledgeBase = getKnowledgeBase(secondPath);

      expect(secondKnowledgeBase).not.toBe(firstKnowledgeBase);
      expect(firstKnowledgeBase.version).toBe("cache-path-a");
      expect(secondKnowledgeBase.version).toBe("cache-path-b");
    });
  });

  describe("getUIInputs", () => {
    it("returns the knowledge base uiInputs array content without wrapping it", () => {
      const knowledgeBase = validKnowledgeBase();

      expect(getUIInputs({ knowledgeBase })).toEqual(knowledgeBase.uiInputs);
    });

    it("loads uiInputs from the active knowledge base path", () => {
      const knowledgeBase = validKnowledgeBase({ version: "ui-inputs-path-test" });
      const path = writeKnowledgeBaseFile(knowledgeBase);

      expect(getUIInputs({ knowledgeBasePath: path })).toEqual(knowledgeBase.uiInputs);
    });
  });
});
