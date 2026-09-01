#!/usr/bin/env tsx
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  backupCommandUsage,
  parseKnowledgeBaseBackupArgs,
  validateRiskKnowledgeBaseBackup,
  type RiskKnowledgeBaseBackupOptions,
  type RiskKnowledgeBaseBackupValidationResult
} from "./check-risk-kb-backup";

export function promoteRiskKnowledgeBaseBackup(
  options: RiskKnowledgeBaseBackupOptions = {}
): RiskKnowledgeBaseBackupValidationResult {
  const result = validateRiskKnowledgeBaseBackup(options);

  copyFileSync(result.sourcePath, result.targetPath);

  return result;
}

function isCliEntrypoint(): boolean {
  return Boolean(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}

if (isCliEntrypoint()) {
  try {
    const options = parseKnowledgeBaseBackupArgs(process.argv.slice(2));

    if (options.help) {
      console.log(backupCommandUsage("scripts/promote-risk-kb-backup.ts"));
      process.exitCode = 0;
    } else {
      const result = promoteRiskKnowledgeBaseBackup(options);
      console.log(
        `Promoted ${result.sourcePath} to ${result.targetPath} using KB schema ${result.kbSchemaVersion}, version ${result.version}, ${String(result.factors)} factors.`
      );
    }
  } catch (error) {
    console.error(
      `Failed to promote risk KB backup: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
