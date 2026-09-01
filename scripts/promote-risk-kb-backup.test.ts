import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "@jest/globals";

import { defaultRiskKnowledgeBasePath } from "../apps/backend/src/services/knowledgeBase/constants";
import type { KnowledgeBaseV1 } from "../apps/backend/src/services/knowledgeBase/types";
import { validateRiskKnowledgeBaseBackup } from "./check-risk-kb-backup";
import { promoteRiskKnowledgeBaseBackup } from "./promote-risk-kb-backup";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const fixtureInput = readFileSync(resolve(repoRoot, defaultRiskKnowledgeBasePath), "utf8");
const fixtureKnowledgeBase = JSON.parse(fixtureInput) as KnowledgeBaseV1;
const tempRoot = mkdtempSync(resolve(tmpdir(), "risk-kb-promotion-"));

function testPaths(name: string): { dir: string; sourcePath: string; targetPath: string } {
  const dir = resolve(tempRoot, name);
  const sourcePath = resolve(dir, "risk-kb.json.backup");
  const targetPath = resolve(dir, "risk-kb.json");

  return { dir, sourcePath, targetPath };
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

afterAll(() => {
  rmSync(tempRoot, { force: true, recursive: true });
});

describe("promoteRiskKnowledgeBaseBackup", () => {
  it("validates a backup without updating the target", () => {
    const { dir, sourcePath, targetPath } = testPaths("validate-only");
    const candidateKnowledgeBase: KnowledgeBaseV1 = {
      ...fixtureKnowledgeBase,
      factors: [
        ...fixtureKnowledgeBase.factors,
        {
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "Flat"
          },
          description: "Validate-only flat property factor",
          id: "validate_only_flat_property",
          points: 1
        }
      ]
    };

    mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, fixtureInput);
    writeJson(sourcePath, candidateKnowledgeBase);

    const result = validateRiskKnowledgeBaseBackup({
      sourcePath,
      targetPath
    });

    expect(result.factors).toBe(fixtureKnowledgeBase.factors.length + 1);
    expect(readFileSync(targetPath, "utf8")).toBe(fixtureInput);
  });

  it("promotes a valid backup to the target", () => {
    const { dir, sourcePath, targetPath } = testPaths("valid");
    const candidateKnowledgeBase: KnowledgeBaseV1 = {
      ...fixtureKnowledgeBase,
      factors: [
        ...fixtureKnowledgeBase.factors,
        {
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "Flat"
          },
          description: "Test flat property factor",
          id: "test_flat_property",
          points: 1
        }
      ]
    };

    mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, fixtureInput);
    writeJson(sourcePath, candidateKnowledgeBase);

    const result = promoteRiskKnowledgeBaseBackup({
      sourcePath,
      targetPath
    });

    expect(result.factors).toBe(fixtureKnowledgeBase.factors.length + 1);
    expect(JSON.parse(readFileSync(targetPath, "utf8"))).toEqual(candidateKnowledgeBase);
  });

  it("does not update the target when the backup is invalid JSON", () => {
    const { dir, sourcePath, targetPath } = testPaths("invalid-json");

    mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, fixtureInput);
    writeFileSync(sourcePath, "{");

    expect(() => promoteRiskKnowledgeBaseBackup({ sourcePath, targetPath })).toThrow(SyntaxError);
    expect(readFileSync(targetPath, "utf8")).toBe(fixtureInput);
  });

  it("does not update the target when kbSchemaVersion changes", () => {
    const { dir, sourcePath, targetPath } = testPaths("schema-version");
    const candidateKnowledgeBase = {
      ...fixtureKnowledgeBase,
      kbSchemaVersion: "2.0.0"
    };

    mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, fixtureInput);
    writeJson(sourcePath, candidateKnowledgeBase);

    expect(() => promoteRiskKnowledgeBaseBackup({ sourcePath, targetPath })).toThrow();
    expect(readFileSync(targetPath, "utf8")).toBe(fixtureInput);
  });

  it("fails clearly when the backup is missing", () => {
    const { dir, sourcePath, targetPath } = testPaths("missing-backup");

    mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, fixtureInput);

    expect(() => promoteRiskKnowledgeBaseBackup({ sourcePath, targetPath })).toThrow(
      `Risk KB backup not found: ${sourcePath}`
    );
    expect(readFileSync(targetPath, "utf8")).toBe(fixtureInput);
  });
});
