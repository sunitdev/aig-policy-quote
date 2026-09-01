#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOG_FILE = "AGENT_LOG.md";
const STATE_DIR = ".agent-log";
const LOCK_NAME = "lock";

export const AGENT_CONTEXT = `Agent session logging is enabled for this repository.

When you produce a final response with a suggestion, plan, or completed-work summary, include one hidden Markdown comment on its own line:
<!-- agent-log-summary: one concise sentence summarizing your suggestion or outcome -->

When the user asks for a change to your suggestion or plan and gives a reason, include one hidden Markdown comment on its own line:
<!-- agent-log-change-reason: concise reason from the user -->

Do not mention these comments in visible prose.`;

function parseArgs(argv) {
  const args = { agent: "unknown", promptStdin: false, summaryStdin: false };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--agent" && argv[index + 1]) {
      args.agent = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--prompt-stdin") {
      args.promptStdin = true;
    } else if (argv[index] === "--summary-stdin") {
      args.summaryStdin = true;
    }
  }

  return args;
}

function readStdin() {
  return fs.readFileSync(0, "utf8").trim();
}

function parseJsonInput(raw) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function getProjectRoot(input) {
  const fromEnv =
    process.env.AGENT_LOG_ROOT || process.env.CLAUDE_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR;

  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  if (Array.isArray(input.workspace_roots) && input.workspace_roots[0]) {
    return path.resolve(input.workspace_roots[0]);
  }

  return path.resolve(input.cwd || process.cwd());
}

function getAgentName(agentArg, input) {
  if (agentArg && agentArg !== "unknown") {
    return agentArg;
  }

  const eventName = String(input.hook_event_name || "");
  if (eventName.startsWith("before") || eventName.startsWith("after")) {
    return "cursor";
  }

  if (input.cursor_version) {
    return "cursor";
  }

  return "unknown";
}

function getEventName(input) {
  return String(input.hook_event_name || input.event || "");
}

function getSessionId(input) {
  const explicit =
    input.session_id ||
    input.conversation_id ||
    process.env.CODEX_SESSION_ID ||
    process.env.CODEX_THREAD_ID ||
    process.env.CLAUDE_SESSION_ID ||
    process.env.CURSOR_SESSION_ID ||
    process.env.AGENT_LOG_SESSION_ID ||
    input.transcript_path;

  if (explicit) {
    return String(explicit);
  }

  const seed = JSON.stringify({
    cwd: input.cwd || process.cwd(),
    pid: process.ppid
  });

  return `session-${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16)}`;
}

function safeStateName(sessionId) {
  return crypto.createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
}

function nowLocal() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(
    2,
    "0"
  )}:${String(now.getSeconds()).padStart(2, "0")} ${sign}${offsetHours}:${offsetRemainder}`;
}

function truncateLine(value, maxLength = 180) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
}

function extractHtmlComment(text, name) {
  const pattern = new RegExp(`<!--\\s*${name}\\s*:\\s*([\\s\\S]*?)\\s*-->`, "i");
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function stripAgentLogComments(text) {
  return String(text || "")
    .replace(/<!--\s*agent-log-summary\s*:[\s\S]*?-->/gi, "")
    .replace(/<!--\s*agent-log-change-reason\s*:[\s\S]*?-->/gi, "")
    .trim();
}

function fallbackSummary(text) {
  const cleaned = stripAgentLogComments(text)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find(Boolean);

  return truncateLine(cleaned || "No assistant summary captured.");
}

function extractChangeReason(prompt) {
  const text = String(prompt || "");
  const markerMatch = text.match(/(?:^|\b)(reason|rationale|why)\s*:\s*/i);

  if (!markerMatch || markerMatch.index === undefined) {
    return "";
  }

  const reasonText = text.slice(markerMatch.index + markerMatch[0].length);
  const lines = reasonText.split(/\r?\n/);
  const reasonLines = [];

  for (const line of lines) {
    if (!line.trim()) {
      break;
    }

    if (reasonLines.length > 0 && /^\s*[A-Za-z][A-Za-z -]{0,40}\s*:\s+/.test(line)) {
      break;
    }

    reasonLines.push(line.trim());
  }

  return reasonLines.join("\n").trim();
}

function readState(statePath, sessionId, agentName) {
  if (!fs.existsSync(statePath)) {
    return {
      version: 1,
      sessionId,
      agentName,
      startedAt: nowLocal(),
      prompts: [],
      suggestions: []
    };
  }

  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function writeTextAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, value);
  fs.renameSync(tempPath, filePath);
}

function withLock(root, callback) {
  const lockPath = path.join(root, LOCK_NAME);
  const deadline = Date.now() + 3000;

  while (true) {
    try {
      fs.mkdirSync(lockPath);
      break;
    } catch (error) {
      if (error.code !== "EEXIST" || Date.now() > deadline) {
        throw error;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }

  try {
    return callback();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

function getPromptText(input) {
  return typeof input.prompt === "string" ? input.prompt : "";
}

function getAssistantText(input) {
  if (typeof input.last_assistant_message === "string") {
    return input.last_assistant_message;
  }

  if (typeof input.text === "string") {
    return input.text;
  }

  return "";
}

function markdownCodeBlock(text) {
  const fence = String(text || "").includes("```") ? "````" : "```";
  return `${fence}text\n${text || ""}\n${fence}`;
}

function renderChangeRequest(prompt, index) {
  const lines = [
    `#### Change ${index + 1} - ${prompt.timestamp}`,
    "",
    `Reason: ${prompt.reason || "Not provided explicitly."}`,
    "",
    markdownCodeBlock(prompt.text)
  ];

  return lines.join("\n");
}

function renderSessionBlock(state) {
  const marker = safeStateName(state.sessionId);
  const titlePrompt =
    state.prompts.find((prompt) => prompt.kind === "initial")?.text || state.sessionId;
  const title = truncateLine(titlePrompt, 80);
  const firstPrompt = state.prompts.find((prompt) => prompt.kind === "initial");
  const followUps = state.prompts.filter((prompt) => prompt.kind === "follow-up");
  const suggestions = state.suggestions || [];

  const lines = [
    `<!-- agent-log-session:${marker}:start -->`,
    `## Session: ${title}`,
    "",
    `- Started: ${state.startedAt}`,
    `- Agent: ${state.agentName || "unknown"}`,
    `- Session ID: \`${state.sessionId}\``
  ];

  if (state.endedAt) {
    lines.push(`- Ended: ${state.endedAt}`);
  }

  lines.push("", "### Initial Prompt", "");

  if (firstPrompt) {
    lines.push(`**Prompted at:** ${firstPrompt.timestamp}`, "");
    lines.push(markdownCodeBlock(firstPrompt.text));
  } else {
    lines.push("_No initial prompt captured yet._");
  }

  lines.push("", "### Suggestions", "");

  if (suggestions.length) {
    for (const suggestion of suggestions) {
      lines.push(`- ${suggestion.timestamp}: ${suggestion.summary}`);
    }
  } else {
    lines.push("_No agent suggestion captured yet._");
  }

  lines.push("", "### Changes / Follow-Ups", "");

  if (followUps.length) {
    for (const [index, prompt] of followUps.entries()) {
      lines.push(renderChangeRequest(prompt, index), "");
    }
  } else {
    lines.push("_No requested changes captured yet._");
  }

  lines.push(`<!-- agent-log-session:${marker}:end -->`, "");

  return lines.join("\n");
}

function upsertLogBlock(root, state) {
  const logPath = path.join(root, LOG_FILE);
  const marker = safeStateName(state.sessionId);
  const block = renderSessionBlock(state);
  const start = `<!-- agent-log-session:${marker}:start -->`;
  const end = `<!-- agent-log-session:${marker}:end -->`;

  let current = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "# Agent Log\n";

  if (!current.trim()) {
    current = "# Agent Log\n";
  }

  if (!current.endsWith("\n")) {
    current += "\n";
  }

  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);

  if (startIndex >= 0 && endIndex >= startIndex) {
    const before = current.slice(0, startIndex).trimEnd();
    const after = current.slice(endIndex + end.length).trimStart();
    writeTextAtomic(logPath, `${before}\n\n${block}${after ? `\n${after}` : ""}`);
    return;
  }

  writeTextAtomic(logPath, `${current.trimEnd()}\n\n${block}`);
}

function updateStateForEvent(state, input, eventName, agentName) {
  state.agentName = state.agentName || agentName;
  state.lastEventAt = nowLocal();

  const normalizedEvent = eventName.toLowerCase();

  if (normalizedEvent === "sessionstart") {
    state.startedAt ||= nowLocal();
    return state;
  }

  if (normalizedEvent === "userpromptsubmit" || normalizedEvent === "beforesubmitprompt") {
    const prompt = getPromptText(input);
    if (!prompt) {
      return state;
    }

    const kind = state.prompts.some((entry) => entry.kind === "initial") ? "follow-up" : "initial";
    state.prompts.push({
      id: crypto.createHash("sha256").update(`${Date.now()}:${prompt}`).digest("hex").slice(0, 12),
      kind,
      timestamp: nowLocal(),
      text: prompt,
      reason: kind === "follow-up" ? extractChangeReason(prompt) : ""
    });
    return state;
  }

  if (normalizedEvent === "stop" || normalizedEvent === "afteragentresponse") {
    const assistantText = getAssistantText(input);
    if (!assistantText) {
      return state;
    }

    const summary =
      extractHtmlComment(assistantText, "agent-log-summary") || fallbackSummary(assistantText);
    const reason = extractHtmlComment(assistantText, "agent-log-change-reason");
    const latestFollowUp = [...state.prompts]
      .reverse()
      .find((prompt) => prompt.kind === "follow-up");

    if (reason && latestFollowUp && !latestFollowUp.reason) {
      latestFollowUp.reason = reason;
    }

    const lastSuggestion = state.suggestions.at(-1);
    if (!lastSuggestion || lastSuggestion.summary !== summary) {
      state.suggestions.push({
        timestamp: nowLocal(),
        summary
      });
    }

    return state;
  }

  if (normalizedEvent === "sessionend") {
    state.endedAt = nowLocal();
    state.endReason = input.reason || input.final_status || "ended";
  }

  return state;
}

function buildOutput(agentName, eventName, sessionId) {
  const normalizedEvent = eventName.toLowerCase();

  if (agentName === "cursor") {
    if (normalizedEvent === "sessionstart") {
      return {
        env: { AGENT_LOG_SESSION_ID: sessionId },
        additional_context: AGENT_CONTEXT
      };
    }

    if (normalizedEvent === "beforesubmitprompt") {
      return { continue: true };
    }

    return {};
  }

  if (normalizedEvent === "sessionstart") {
    return {
      hookSpecificOutput: {
        hookEventName: eventName || "SessionStart",
        additionalContext: AGENT_CONTEXT
      }
    };
  }

  return {};
}

function buildManualInput(rawInput, options) {
  if (options.promptStdin) {
    return JSON.stringify({
      hook_event_name: "UserPromptSubmit",
      session_id:
        process.env.AGENT_LOG_SESSION_ID ||
        process.env.CODEX_SESSION_ID ||
        process.env.CODEX_THREAD_ID ||
        process.env.CLAUDE_SESSION_ID ||
        process.env.CURSOR_SESSION_ID,
      cwd: process.cwd(),
      prompt: rawInput
    });
  }

  if (options.summaryStdin) {
    return JSON.stringify({
      hook_event_name: "Stop",
      session_id:
        process.env.AGENT_LOG_SESSION_ID ||
        process.env.CODEX_SESSION_ID ||
        process.env.CODEX_THREAD_ID ||
        process.env.CLAUDE_SESSION_ID ||
        process.env.CURSOR_SESSION_ID,
      cwd: process.cwd(),
      last_assistant_message: rawInput
    });
  }

  return rawInput;
}

export function processHook(rawInput, options = {}) {
  const input = parseJsonInput(buildManualInput(rawInput, options));
  const agentName = getAgentName(options.agent || "unknown", input);
  const eventName = getEventName(input);
  const sessionId = getSessionId(input);
  const root = getProjectRoot(input);
  const stateDir = path.join(root, STATE_DIR);
  const statePath = path.join(stateDir, `${safeStateName(sessionId)}.json`);

  fs.mkdirSync(stateDir, { recursive: true });

  withLock(stateDir, () => {
    const state = readState(statePath, sessionId, agentName);
    const updatedState = updateStateForEvent(state, input, eventName, agentName);

    writeJsonAtomic(statePath, updatedState);
    upsertLogBlock(root, updatedState);
  });

  return buildOutput(agentName, eventName, sessionId);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawInput = readStdin();

  try {
    const output = processHook(rawInput, args);
    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (error) {
    fs.writeFileSync(
      path.join(os.tmpdir(), "agent-log-hook-error.log"),
      `${new Date().toISOString()}\n${error.stack || error.message}\n`,
      { flag: "a" }
    );
    process.stdout.write("{}\n");
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main();
}
