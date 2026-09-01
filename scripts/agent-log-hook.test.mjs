import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@jest/globals";

import { AGENT_CONTEXT, processHook } from "./agent-log-hook.mjs";

function createTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-log-hook-"));
}

function readLog(root) {
  return fs.readFileSync(path.join(root, "AGENT_LOG.md"), "utf8");
}

test("records exact initial prompt and agent-provided Codex summary", () => {
  const root = createTempProject();

  const sessionStartOutput = processHook(
    JSON.stringify({
      hook_event_name: "SessionStart",
      session_id: "codex-session-1",
      cwd: root
    }),
    { agent: "codex" }
  );

  expect(sessionStartOutput.hookSpecificOutput.additionalContext).toBe(AGENT_CONTEXT);

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "codex-session-1",
      cwd: root,
      prompt: "Build an API.\n\nKeep it small."
    }),
    { agent: "codex" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "Stop",
      session_id: "codex-session-1",
      cwd: root,
      last_assistant_message:
        "Done.\n<!-- agent-log-summary: Suggested a small service-layer API. -->"
    }),
    { agent: "codex" }
  );

  const log = readLog(root);
  expect(log).toMatch(/## Session: Build an API\. Keep it small\./);
  expect(log).toMatch(/- Started: .+/);
  expect(log).toMatch(/### Initial Prompt/);
  expect(log).toMatch(/```text[\s\S]*Build an API\.\n\nKeep it small\.[\s\S]*```/);
  expect(log).toMatch(/### Suggestions/);
  expect(log).toMatch(/Suggested a small service-layer API\./);
});

test("records follow-up prompts and explicit change reasons", () => {
  const root = createTempProject();

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "claude-session-1",
      cwd: root,
      prompt: "Plan the feature first."
    }),
    { agent: "claude" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "claude-session-1",
      cwd: root,
      prompt: "Change the plan to use Node.\nReason: This repo already uses pnpm scripts."
    }),
    { agent: "claude" }
  );

  const log = readLog(root);
  expect(log).toMatch(/### Changes \/ Follow-Ups/);
  expect(log).toMatch(/#### Change 1 - .+/);
  expect(log).toMatch(/Reason: This repo already uses pnpm scripts\./);
  expect(log).toMatch(/Change the plan to use Node\./);
});

test("records inline change reasons", () => {
  const root = createTempProject();

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "inline-reason-session",
      cwd: root,
      prompt: "Start with the default version."
    }),
    { agent: "codex" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "inline-reason-session",
      cwd: root,
      prompt:
        "Can you update the version to 1.1.0. Reason: because we are adding a new feature of agents"
    }),
    { agent: "codex" }
  );

  expect(readLog(root)).toMatch(/Reason: because we are adding a new feature of agents/);
});

test("updates latest follow-up with agent-extracted reason when prompt has no marker", () => {
  const root = createTempProject();

  processHook(
    JSON.stringify({
      hook_event_name: "beforeSubmitPrompt",
      session_id: "cursor-session-1",
      cwd: root,
      prompt: "Create the first plan."
    }),
    { agent: "cursor" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "beforeSubmitPrompt",
      session_id: "cursor-session-1",
      cwd: root,
      prompt: "Change it to project-level config because I want it committed."
    }),
    { agent: "cursor" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "afterAgentResponse",
      session_id: "cursor-session-1",
      cwd: root,
      text: "Updated the plan.\n<!-- agent-log-summary: Switched the hook to project-level config. -->\n<!-- agent-log-change-reason: User wants the hook committed with the repository. -->"
    }),
    { agent: "cursor" }
  );

  const log = readLog(root);
  expect(log).toMatch(/Reason: User wants the hook committed with the repository\./);
  expect(log).toMatch(/Switched the hook to project-level config\./);
});

test("falls back to first assistant paragraph when no summary comment exists", () => {
  const root = createTempProject();

  processHook(
    JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id: "fallback-session",
      cwd: root,
      prompt: "Suggest a change."
    }),
    { agent: "codex" }
  );

  processHook(
    JSON.stringify({
      hook_event_name: "Stop",
      session_id: "fallback-session",
      cwd: root,
      last_assistant_message: "Here is the short visible suggestion.\n\nMore details follow."
    }),
    { agent: "codex" }
  );

  expect(readLog(root)).toMatch(/Here is the short visible suggestion\./);
});

test("replaces the same session block instead of duplicating it", () => {
  const root = createTempProject();
  const event = {
    hook_event_name: "UserPromptSubmit",
    session_id: "same-session",
    cwd: root,
    prompt: "Initial prompt"
  };

  processHook(JSON.stringify(event), { agent: "codex" });
  processHook(
    JSON.stringify({
      hook_event_name: "Stop",
      session_id: "same-session",
      cwd: root,
      last_assistant_message: "<!-- agent-log-summary: First summary. -->"
    }),
    { agent: "codex" }
  );

  const log = readLog(root);
  expect((log.match(/agent-log-session:/g) || []).length).toBe(2);
});

test("supports prompt-stdin mode using the current agent session environment", () => {
  const root = createTempProject();
  const previousRoot = process.env.AGENT_LOG_ROOT;
  const previousSessionId = process.env.CODEX_SESSION_ID;

  process.env.AGENT_LOG_ROOT = root;
  process.env.CODEX_SESSION_ID = "manual-session-from-env";

  try {
    processHook("Prompt entered directly by the agent.", {
      agent: "codex",
      promptStdin: true
    });
  } finally {
    if (previousRoot === undefined) {
      delete process.env.AGENT_LOG_ROOT;
    } else {
      process.env.AGENT_LOG_ROOT = previousRoot;
    }

    if (previousSessionId === undefined) {
      delete process.env.CODEX_SESSION_ID;
    } else {
      process.env.CODEX_SESSION_ID = previousSessionId;
    }
  }

  const log = readLog(root);
  expect(log).toMatch(/- Session ID: `manual-session-from-env`/);
  expect(log).toMatch(/Prompt entered directly by the agent\./);
});
