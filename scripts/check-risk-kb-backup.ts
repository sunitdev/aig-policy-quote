#!/usr/bin/env tsx
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseKnowledgeBase } from "../apps/backend/src/services/knowledgeBase/service";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

export const defaultSourcePath = resolve(repoRoot, "kb/risk-kb.json.backup");
export const defaultTargetPath = resolve(repoRoot, "kb/risk-kb.json");

interface VersionedKnowledgeBaseInput {
  kbSchemaVersion?: unknown;
}

export interface RiskKnowledgeBaseBackupOptions {
  sourcePath?: string;
  targetPath?: string;
}

export interface ParsedRiskKnowledgeBaseBackupArgs extends RiskKnowledgeBaseBackupOptions {
  help?: boolean;
}

export interface RiskKnowledgeBaseBackupValidationResult {
  factors: number;
  kbSchemaVersion: string;
  sourcePath: string;
  targetPath: string;
  version: string;
}

export function resolveInputPath(value: string | undefined, fallbackPath: string): string {
  if (!value) {
    return fallbackPath;
  }

  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function readRequiredFile(path: string, label: string): string {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function parseVersionedKnowledgeBaseInput(input: string): VersionedKnowledgeBaseInput {
  const parsedInput: unknown = JSON.parse(input);

  if (typeof parsedInput !== "object" || parsedInput === null) {
    return {};
  }

  return parsedInput;
}

export function parseKnowledgeBaseBackupArgs(args: string[]): ParsedRiskKnowledgeBaseBackupArgs {
  const options: ParsedRiskKnowledgeBaseBackupArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--source" || arg === "--target") {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }

      if (arg === "--source") {
        options.sourcePath = value;
      }

      if (arg === "--target") {
        options.targetPath = value;
      }

      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function backupCommandUsage(commandPath: string): string {
  return [
    `Usage: tsx ${commandPath} [--source path] [--target path]`,
    "",
    "Defaults:",
    `  --source ${defaultSourcePath}`,
    `  --target ${defaultTargetPath}`
  ].join("\n");
}

export function validateRiskKnowledgeBaseBackup(
  options: RiskKnowledgeBaseBackupOptions = {}
): RiskKnowledgeBaseBackupValidationResult {
  const sourcePath = resolveInputPath(options.sourcePath, defaultSourcePath);
  const targetPath = resolveInputPath(options.targetPath, defaultTargetPath);

  const candidateInput = readRequiredFile(sourcePath, "Risk KB backup");
  const currentInput = readRequiredFile(targetPath, "Active risk KB");
  const currentVersionedInput = parseVersionedKnowledgeBaseInput(currentInput);
  const candidateVersionedInput = parseVersionedKnowledgeBaseInput(candidateInput);

  if (candidateVersionedInput.kbSchemaVersion !== currentVersionedInput.kbSchemaVersion) {
    throw new Error(
      `Backup kbSchemaVersion ${String(candidateVersionedInput.kbSchemaVersion)} does not match active kbSchemaVersion ${String(currentVersionedInput.kbSchemaVersion)}`
    );
  }

  parseKnowledgeBase(currentInput);
  const candidateKnowledgeBase = parseKnowledgeBase(candidateInput);

  return {
    factors: candidateKnowledgeBase.factors.length,
    kbSchemaVersion: candidateKnowledgeBase.kbSchemaVersion,
    sourcePath,
    targetPath,
    version: candidateKnowledgeBase.version
  };
}

function isCliEntrypoint(): boolean {
  return Boolean(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}

if (isCliEntrypoint()) {
  try {
    const options = parseKnowledgeBaseBackupArgs(process.argv.slice(2));

    if (options.help) {
      console.log(backupCommandUsage("scripts/check-risk-kb-backup.ts"));
      process.exitCode = 0;
    } else {
      const result = validateRiskKnowledgeBaseBackup(options);
      console.log(
        `Risk KB backup is valid: ${result.sourcePath} uses KB schema ${result.kbSchemaVersion}, version ${result.version}, ${String(result.factors)} factors.`
      );
    }
  } catch (error) {
    console.error(
      `Risk KB backup validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
