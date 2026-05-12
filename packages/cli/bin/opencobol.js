#!/usr/bin/env node

// src/index.ts
import "dotenv/config";

// src/config.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
var CONFIG_DIR = join(homedir(), ".opencobol");
var CONFIG_PATH = join(CONFIG_DIR, "config.json");
function loadConfig() {
  let fileConfig = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
    }
  }
  return {
    openaiApiKey: process.env["OPENAI_API_KEY"] ?? fileConfig.openaiApiKey,
    model: process.env["OPENAI_MODEL"] ?? fileConfig.model,
    qdrantUrl: process.env["QDRANT_URL"] ?? fileConfig.qdrantUrl,
    qdrantCollection: process.env["QDRANT_COLLECTION"] ?? fileConfig.qdrantCollection
  };
}
function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
function applyConfig() {
  const config = loadConfig();
  if (config.openaiApiKey && !process.env["OPENAI_API_KEY"]) {
    process.env["OPENAI_API_KEY"] = config.openaiApiKey;
  }
  if (config.model && !process.env["OPENAI_MODEL"]) {
    process.env["OPENAI_MODEL"] = config.model;
  }
  if (config.qdrantUrl && !process.env["QDRANT_URL"]) {
    process.env["QDRANT_URL"] = config.qdrantUrl;
  }
  if (config.qdrantCollection && !process.env["QDRANT_COLLECTION"]) {
    process.env["QDRANT_COLLECTION"] = config.qdrantCollection;
  }
}

// src/index.ts
import { Command as Command10 } from "commander";

// src/commands/init.ts
import { Command } from "commander";
import { input, password, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
function printBanner(version) {
  const width = 56;
  const border = chalk.cyan("\u2550".repeat(width));
  const side = chalk.cyan("\u2551");
  const line = (text, pad2 = true) => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, "");
    const spaces = pad2 ? " ".repeat(Math.max(0, width - visible.length - 2)) : "";
    return `${side} ${text}${spaces} ${side}`;
  };
  console.log();
  console.log(chalk.cyan(`\u2554${border}\u2557`));
  console.log(line(chalk.bold.white("OpenCobol") + chalk.bold.cyan(" AI") + chalk.dim("  \xB7  Legacy COBOL Intelligence Platform")));
  console.log(line(chalk.dim(`Created by `) + chalk.cyan("Alan Martins") + chalk.dim(`  \xB7  v${version}`)));
  console.log(chalk.cyan(`\u255A${border}\u255D`));
  console.log();
}
async function validateApiKey(apiKey) {
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}
var initCommand = new Command("init").description("Configure OpenCobol AI interactively").action(async () => {
  printBanner("0.1.3");
  console.log(chalk.dim("  Setup Wizard \u2014 configure your environment in under a minute.\n"));
  const config = {};
  const apiKey = await password({
    message: "OpenAI API Key",
    mask: "\u25CF",
    validate: (v) => v.startsWith("sk-") && v.length > 20 ? true : "Key must start with sk- and be valid"
  });
  const spinner = ora({ text: "Validating API key...", color: "cyan" }).start();
  const valid = await validateApiKey(apiKey);
  if (valid) {
    spinner.succeed(chalk.green("API key validated"));
  } else {
    spinner.warn(chalk.yellow("Could not validate key \u2014 saved anyway (check your connection)"));
  }
  config.openaiApiKey = apiKey;
  console.log();
  config.model = await select({
    message: "Default model",
    choices: [
      { name: `${chalk.green("gpt-4o-mini")}  \u2014 fast & affordable ${chalk.dim("(recommended)")}`, value: "gpt-4o-mini" },
      { name: `${chalk.yellow("gpt-4o")}       \u2014 most capable`, value: "gpt-4o" },
      { name: `${chalk.dim("gpt-4-turbo")}  \u2014 balanced`, value: "gpt-4-turbo" }
    ]
  });
  console.log();
  const useQdrant = await confirm({
    message: "Enable semantic search with Qdrant? " + chalk.dim("(needed for embed & ask)"),
    default: true
  });
  if (useQdrant) {
    console.log();
    config.qdrantUrl = await input({
      message: "Qdrant URL",
      default: "http://localhost:6333"
    });
    config.qdrantCollection = await input({
      message: "Qdrant collection name",
      default: "opencobol"
    });
  }
  saveConfig(config);
  console.log();
  console.log(chalk.cyan("\u2500".repeat(58)));
  console.log();
  console.log(`  ${chalk.green("\u2714")}  Config saved to ${chalk.dim(CONFIG_PATH)}`);
  console.log();
  console.log(`  ${chalk.bold("Next steps:")}`);
  console.log();
  if (useQdrant) {
    console.log(`  ${chalk.dim("$")} ${chalk.cyan("docker run -p 6333:6333 qdrant/qdrant")}`);
    console.log(`  ${chalk.dim("$")} ${chalk.cyan("opencobol embed ./legacy")}`);
    console.log(`  ${chalk.dim("$")} ${chalk.cyan('opencobol ask "What does this system do?"')}`);
  } else {
    console.log(`  ${chalk.dim("$")} ${chalk.cyan("opencobol scan ./legacy")}`);
    console.log(`  ${chalk.dim("$")} ${chalk.cyan("opencobol explain ./legacy/PAYROLL.cbl")}`);
  }
  console.log();
  console.log(chalk.cyan("\u2500".repeat(58)));
  console.log();
});

// src/commands/scan.ts
import { Command as Command2 } from "commander";
import ora2 from "ora";
import { resolve } from "path";

// ../parser-core/dist/scanner/index.js
import { readdirSync, statSync as statSync2 } from "fs";
import { join as join2, extname as extname2 } from "path";

// ../parser-core/dist/scanner/detector.js
import { readFileSync as readFileSync2, statSync } from "fs";
import { extname, basename } from "path";
var PROGRAM_EXTENSIONS = /* @__PURE__ */ new Set([".cbl", ".cob", ".cobol"]);
var COPYBOOK_EXTENSIONS = /* @__PURE__ */ new Set([".cpy", ".copy"]);
var JCL_EXTENSIONS = /* @__PURE__ */ new Set([".jcl", ".jcllib", ".jclproc"]);
var PROGRAM_ID_RE = /PROGRAM-ID\.\s+["']?([A-Z0-9][A-Z0-9-]*)["']?/i;
var COPY_RE = /\bCOPY\s+["']?([A-Z0-9][A-Z0-9-]*)["']?/gi;
var CALL_RE = /\bCALL\s+["']([A-Z0-9][A-Z0-9-]*)["']|\bCALL\s+([A-Z0-9][A-Z0-9-]*)\b/gi;
var JCL_EXEC_RE = /\/\/\S+\s+EXEC\s+(?:PGM=([A-Z0-9@#$-]+)|([A-Z0-9@#$-]+))/gi;
function detectType(filePath, content) {
  const ext = extname(filePath).toLowerCase();
  if (PROGRAM_EXTENSIONS.has(ext))
    return "program";
  if (COPYBOOK_EXTENSIONS.has(ext))
    return "copybook";
  if (JCL_EXTENSIONS.has(ext))
    return "jcl";
  const firstMeaningfulLine = content.split("\n").find((l) => l.trim().length > 0) ?? "";
  if (firstMeaningfulLine.startsWith("//"))
    return "jcl";
  return "unknown";
}
function analyzeFile(filePath) {
  const stat = statSync(filePath);
  const content = readFileSync2(filePath, "utf-8");
  const type = detectType(filePath, content);
  const programIdMatch = PROGRAM_ID_RE.exec(content);
  const programId = programIdMatch?.[1]?.toUpperCase() ?? null;
  const copybooks = /* @__PURE__ */ new Set();
  COPY_RE.lastIndex = 0;
  let m;
  while ((m = COPY_RE.exec(content)) !== null) {
    if (m[1])
      copybooks.add(m[1].toUpperCase());
  }
  const calls = /* @__PURE__ */ new Set();
  if (type === "jcl") {
    JCL_EXEC_RE.lastIndex = 0;
    while ((m = JCL_EXEC_RE.exec(content)) !== null) {
      const name = m[1] ?? m[2];
      if (name)
        calls.add(name.toUpperCase());
    }
  } else {
    CALL_RE.lastIndex = 0;
    while ((m = CALL_RE.exec(content)) !== null) {
      const name = m[1] ?? m[2];
      if (name)
        calls.add(name.toUpperCase());
    }
  }
  return {
    path: filePath,
    name: basename(filePath),
    type,
    programId,
    copybooks: [...copybooks],
    calls: [...calls],
    lines: content.split("\n").length,
    sizeBytes: stat.size
  };
}

// ../parser-core/dist/scanner/index.js
var COBOL_EXTENSIONS = /* @__PURE__ */ new Set([".cbl", ".cob", ".cobol", ".cpy", ".copy", ".jcl", ".jcllib", ".jclproc"]);
function walkDir(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join2(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, acc);
    } else if (COBOL_EXTENSIONS.has(extname2(entry.name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}
function buildCopybookDependencies(files) {
  const map = /* @__PURE__ */ new Map();
  for (const file of files) {
    for (const cb of file.copybooks) {
      const existing = map.get(cb) ?? [];
      existing.push(file.name);
      map.set(cb, existing);
    }
  }
  return [...map.entries()].map(([copybook, usedBy]) => ({ copybook, usedBy }));
}
function buildCallDependencies(files) {
  const map = /* @__PURE__ */ new Map();
  for (const file of files) {
    for (const target of file.calls) {
      const callers = map.get(target) ?? /* @__PURE__ */ new Map();
      callers.set(file.name, (callers.get(file.name) ?? 0) + 1);
      map.set(target, callers);
    }
  }
  return [...map.entries()].map(([target, callers]) => ({
    target,
    calledBy: [...callers.entries()].map(([file, count]) => ({ file, count }))
  }));
}
function scanDirectory(rootPath) {
  const start = Date.now();
  if (!statSync2(rootPath).isDirectory()) {
    throw new Error(`Path is not a directory: ${rootPath}`);
  }
  const filePaths = walkDir(rootPath);
  const files = filePaths.map(analyzeFile);
  return {
    rootPath,
    files,
    durationMs: Date.now() - start,
    stats: {
      programs: files.filter((f) => f.type === "program").length,
      copybooks: files.filter((f) => f.type === "copybook").length,
      jcl: files.filter((f) => f.type === "jcl").length,
      unknown: files.filter((f) => f.type === "unknown").length,
      totalLines: files.reduce((s, f) => s + f.lines, 0),
      totalSizeBytes: files.reduce((s, f) => s + f.sizeBytes, 0)
    }
  };
}

// ../parser-core/dist/flow/extractor.js
import { readFileSync as readFileSync3 } from "fs";
import { basename as basename2 } from "path";
var PARA_HEADER_RE = /^[ \t]{6,8}([A-Z][A-Z0-9-]*)\.[ \t]*$/;
var SCOPE_TERMINATORS = /* @__PURE__ */ new Set([
  "END-IF",
  "END-PERFORM",
  "END-EVALUATE",
  "END-READ",
  "END-WRITE",
  "END-COMPUTE",
  "END-CALL",
  "END-STRING",
  "END-UNSTRING",
  "END-MULTIPLY",
  "END-DIVIDE",
  "END-ADD",
  "END-SUBTRACT",
  "END-SEARCH"
]);
var STRUCTURAL_KEYWORDS = /* @__PURE__ */ new Set([
  "IDENTIFICATION",
  "ENVIRONMENT",
  "DATA",
  "PROCEDURE",
  "WORKING-STORAGE",
  "FILE",
  "LINKAGE",
  "COMMUNICATION",
  "LOCAL-STORAGE",
  "SCREEN",
  "REPORT",
  "CONFIGURATION",
  "INPUT-OUTPUT"
]);
var PERFORM_RE = /\bPERFORM\s+([A-Z][A-Z0-9-]*)(?:\s+(?:THRU|THROUGH|UNTIL|VARYING|WITH|TIMES)\b)?/gi;
var CALL_RE2 = /\bCALL\s+['"]([A-Z0-9][A-Z0-9-]*)['"]|\bCALL\s+([A-Z][A-Z0-9-]*)\b/gi;
function isParagraphHeader(line) {
  if (/\bDIVISION\b|\bSECTION\b/i.test(line))
    return null;
  const m = PARA_HEADER_RE.exec(line);
  if (!m)
    return null;
  const name = m[1].toUpperCase();
  if (STRUCTURAL_KEYWORDS.has(name))
    return null;
  if (SCOPE_TERMINATORS.has(name))
    return null;
  return name;
}
function extractPerforms(lines) {
  const performs = [];
  const seen = /* @__PURE__ */ new Set();
  for (const line of lines) {
    PERFORM_RE.lastIndex = 0;
    let m;
    while ((m = PERFORM_RE.exec(line)) !== null) {
      const name = m[1]?.toUpperCase();
      if (name && !seen.has(name)) {
        seen.add(name);
        performs.push(name);
      }
    }
  }
  return performs;
}
function extractCalls(lines) {
  const calls = [];
  const seen = /* @__PURE__ */ new Set();
  for (const line of lines) {
    CALL_RE2.lastIndex = 0;
    let m;
    while ((m = CALL_RE2.exec(line)) !== null) {
      const name = (m[1] ?? m[2])?.toUpperCase();
      if (name && !seen.has(name)) {
        seen.add(name);
        calls.push(name);
      }
    }
  }
  return calls;
}
function sliceProcedureDivision(lines) {
  const idx = lines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l));
  return idx === -1 ? [] : lines.slice(idx + 1);
}
function extractFlow(filePath) {
  const content = readFileSync3(filePath, "utf-8");
  const allLines = content.split("\n");
  const procLines = sliceProcedureDivision(allLines);
  const meta = analyzeFile(filePath);
  const paragraphs = [];
  let currentName = null;
  let currentStart = 0;
  let bodyLines = [];
  const flush = (endIdx) => {
    if (currentName === null)
      return;
    paragraphs.push({
      name: currentName,
      performs: extractPerforms(bodyLines),
      calls: extractCalls(bodyLines),
      lineStart: currentStart,
      lineEnd: endIdx
    });
    bodyLines = [];
  };
  procLines.forEach((line, i) => {
    if (line[6] === "*")
      return;
    const paraName = isParagraphHeader(line);
    if (paraName) {
      flush(i - 1);
      currentName = paraName;
      currentStart = i;
    } else if (currentName !== null) {
      bodyLines.push(line);
    }
  });
  flush(procLines.length - 1);
  return {
    programId: meta.programId,
    fileName: basename2(filePath),
    entryPoint: paragraphs[0]?.name ?? null,
    paragraphs
  };
}

// src/ui/renderer.ts
import chalk2 from "chalk";
var BRAND = chalk2.bold.hex("#00D4FF");
var DIM = chalk2.dim;
var SUCCESS = chalk2.green;
var WARN = chalk2.yellow;
var FILE_COLOR = chalk2.cyan;
var LABEL = chalk2.bold.white;
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatMs(ms) {
  return ms < 1e3 ? `${ms}ms` : `${(ms / 1e3).toFixed(2)}s`;
}
function pad(str, len) {
  return str.length >= len ? str.slice(0, len - 1) + "\u2026" : str.padEnd(len);
}
function row(cols, widths) {
  return "  \u2502 " + cols.map((c, i) => pad(c, widths[i] ?? 10)).join("  \u2502  ") + "  \u2502";
}
function divider(widths, char = "\u2500") {
  return "  \u251C\u2500" + widths.map((w) => char.repeat(w + 2)).join("\u2500\u253C\u2500") + "\u2500\u2524";
}
function topBorder(widths) {
  return "  \u250C\u2500" + widths.map((w) => "\u2500".repeat(w + 2)).join("\u2500\u252C\u2500") + "\u2500\u2510";
}
function bottomBorder(widths) {
  return "  \u2514\u2500" + widths.map((w) => "\u2500".repeat(w + 2)).join("\u2500\u2534\u2500") + "\u2500\u2518";
}
function renderScanResult(result) {
  const { files, stats, durationMs, rootPath } = result;
  console.log();
  console.log(BRAND("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI"));
  console.log(DIM("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${LABEL("Path")}      ${FILE_COLOR(rootPath)}`);
  console.log(
    `  ${LABEL("Files")}     ${SUCCESS(String(stats.programs))} programs  +  ${WARN(String(stats.copybooks))} copybooks`
  );
  console.log(
    `  ${LABEL("Lines")}     ${stats.totalLines.toLocaleString()}  ${DIM("\xB7")}  ${LABEL("Size")} ${formatBytes(stats.totalSizeBytes)}`
  );
  console.log(`  ${LABEL("Duration")}  ${formatMs(durationMs)}`);
  console.log();
  if (files.length === 0) {
    console.log(DIM("  No COBOL files found."));
    return;
  }
  const COL_WIDTHS = [28, 10, 6, 12, 8];
  const headers = ["File", "Type", "Lines", "Copybooks", "Calls"];
  console.log(DIM(topBorder(COL_WIDTHS)));
  console.log(
    DIM("  \u2502 ") + headers.map((h, i) => chalk2.bold(pad(h, COL_WIDTHS[i] ?? 10))).join(DIM("  \u2502  ")) + DIM("  \u2502")
  );
  console.log(DIM(divider(COL_WIDTHS)));
  for (const f of files) {
    const typeColor = f.type === "program" ? SUCCESS : f.type === "copybook" ? WARN : DIM;
    const cols = [
      FILE_COLOR(f.name),
      typeColor(f.type),
      String(f.lines),
      f.copybooks.length > 0 ? f.copybooks.join(", ") : DIM("\u2014"),
      f.calls.length > 0 ? String(f.calls.length) : DIM("\u2014")
    ];
    console.log(row(cols, COL_WIDTHS));
  }
  console.log(DIM(bottomBorder(COL_WIDTHS)));
  console.log();
  const copybookDeps = buildCopybookDependencies(files);
  if (copybookDeps.length > 0) {
    console.log(LABEL("  Copybook Dependencies"));
    console.log(DIM("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    for (const dep of copybookDeps) {
      console.log(
        `  ${WARN(pad(dep.copybook, 20))}  ${DIM("\u2190")}  ${dep.usedBy.map((f) => FILE_COLOR(f)).join(", ")}`
      );
    }
    console.log();
  }
  const callDeps = buildCallDependencies(files);
  const externalCalls = callDeps.filter(
    (c) => !files.some((f) => f.programId === c.target || f.name.replace(/\.[^.]+$/, "") === c.target)
  );
  if (externalCalls.length > 0) {
    console.log(LABEL("  External Calls"));
    console.log(DIM("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    for (const dep of externalCalls) {
      const callers = dep.calledBy.map((c) => `${FILE_COLOR(c.file)}${DIM(`(${c.count}\xD7)`)}`).join(", ");
      console.log(`  ${chalk2.magenta(pad(dep.target, 20))}  ${DIM("\u2190")}  ${callers}`);
    }
    console.log();
  }
}

// src/commands/scan.ts
var scanCommand = new Command2("scan").description("Scan a directory for COBOL files and analyze dependencies").argument("<path>", "Directory to scan").option("--json", "Output raw JSON").action(async (targetPath, options) => {
  const resolvedPath = resolve(targetPath);
  const spinner = ora2(`Scanning ${resolvedPath} \u2026`).start();
  try {
    const result = scanDirectory(resolvedPath);
    spinner.stop();
    if (options.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      return;
    }
    renderScanResult(result);
  } catch (err) {
    spinner.fail(`Scan failed: ${err.message}`);
    process.exitCode = 1;
  }
});

// src/commands/explain.ts
import { Command as Command3 } from "commander";
import chalk3 from "chalk";
import ora3 from "ora";
import { resolve as resolve6 } from "path";

// ../ai-runtime/dist/explain.js
import { readFileSync as readFileSync4 } from "fs";
import { resolve as resolve2 } from "path";

// ../ai-runtime/dist/prompts/explain.js
function buildExplainPrompt(file, sourceCode) {
  const copybookList = file.copybooks.length > 0 ? file.copybooks.join(", ") : "None";
  const callList = file.calls.length > 0 ? file.calls.join(", ") : "None";
  return `You are an expert COBOL analyst with deep knowledge of legacy mainframe systems, enterprise business logic, and software modernization.

Analyze the following COBOL program and provide a clear, structured explanation aimed at a modern software engineer who is not familiar with COBOL.

## Program Metadata
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Lines of code: ${file.lines}
- Copybooks (shared data structures): ${copybookList}
- External calls (subroutines/services): ${callList}

## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Provide a structured analysis with these sections:

### Purpose
One clear sentence describing what this program does from a business perspective.

### Business Rules
List the key business rules and logic implemented, numbered and explained in plain language.

### Data Flow
Describe how data enters, is processed, and exits the program. Mention key variables and their roles.

### External Dependencies
For each copybook and external CALL, explain its likely purpose based on context clues in the code.

### Modernization Notes
3-5 key considerations a developer should know when rewriting this program in a modern language (Node.js, Java, Python).

Keep explanations concise and practical. Avoid COBOL jargon without explanation.`;
}

// ../ai-runtime/dist/providers/openai.js
import OpenAI from "openai";
var OpenAIProvider = class {
  client;
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env["OPENAI_API_KEY"] });
  }
  async *streamCompletion(prompt, options = {}) {
    const stream = await this.client.chat.completions.create({
      model: options.model ?? "gpt-4o",
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
      messages: [{ role: "user", content: prompt }]
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      const done = chunk.choices[0]?.finish_reason === "stop";
      if (text)
        yield { text, done: false };
      if (done)
        yield { text: "", done: true };
    }
  }
};

// ../ai-runtime/dist/explain.js
async function* explainFile(input2) {
  const resolvedPath = resolve2(input2.filePath);
  const file = analyzeFile(resolvedPath);
  const sourceCode = readFileSync4(resolvedPath, "utf-8");
  const provider = input2.options?.provider ?? new OpenAIProvider();
  const prompt = buildExplainPrompt(file, sourceCode);
  for await (const chunk of provider.streamCompletion(prompt, input2.options)) {
    if (chunk.text)
      yield chunk.text;
  }
}

// ../ai-runtime/dist/agents/explainer.js
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { readFileSync as readFileSync5 } from "fs";
import { resolve as resolve3 } from "path";
var ExplainerAnnotation = Annotation.Root({
  filePath: Annotation(),
  cobolFile: Annotation(),
  sourceCode: Annotation(),
  explanation: Annotation(),
  error: Annotation()
});

// ../ai-runtime/dist/agents/dependency.js
import { Annotation as Annotation2, END as END2, START as START2, StateGraph as StateGraph2 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI2 } from "@langchain/openai";

// ../ai-runtime/dist/prompts/dependency.js
function buildDependencyPrompt(scan, callDeps, copybookDeps, targetProgram) {
  const programList = scan.files.filter((f) => f.type === "program").map((f) => `- ${f.programId ?? f.name} (${f.lines} lines, calls: ${f.calls.join(", ") || "none"})`).join("\n");
  const callGraph = callDeps.map((d) => `- ${d.target}: called by ${d.calledBy.map((c) => c.file).join(", ")}`).join("\n");
  const copybookGraph = copybookDeps.map((d) => `- ${d.copybook}: used by ${d.usedBy.join(", ")}`).join("\n");
  const focusSection = targetProgram ? `
## Focus Program
Analyze the specific impact of changing **${targetProgram}**. Which programs would be affected? What risks exist?
` : "";
  return `You are a COBOL systems analyst specializing in legacy modernization and dependency analysis.

## Codebase Overview
- Total programs: ${scan.stats.programs}
- Total copybooks: ${scan.stats.copybooks}
- Total lines: ${scan.stats.totalLines.toLocaleString()}

## Programs
${programList || "None found"}

## Call Graph (who calls whom)
${callGraph || "No inter-program calls detected"}

## Copybook Dependencies (shared data structures)
${copybookGraph || "No copybooks detected"}
${focusSection}
Generate a concise dependency analysis report in Markdown with these sections:

### Summary
One paragraph describing the overall system structure and coupling level.

### High-Risk Components
List programs or copybooks that, if changed, would ripple through the most other components. Explain why each is high-risk.

### Isolated Components
Programs that can be modified or replaced with minimal downstream risk.

### Modernization Order
Recommended sequence for migrating programs to modern languages, starting with the safest candidates.

### Key Risks
3-5 specific risks a team should address before starting modernization.

Be direct and actionable. Assume the audience is a senior engineer planning a migration project.`;
}

// ../ai-runtime/dist/agents/dependency.js
var DependencyAnnotation = Annotation2.Root({
  rootPath: Annotation2(),
  targetProgram: Annotation2(),
  scanResult: Annotation2(),
  callDeps: Annotation2(),
  copybookDeps: Annotation2(),
  report: Annotation2(),
  error: Annotation2()
});
function buildGraph(options) {
  const llm = new ChatOpenAI2({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph2(DependencyAnnotation).addNode("scan", async (state) => {
    try {
      const scanResult = await scanDirectory(state.rootPath);
      return {
        scanResult,
        callDeps: buildCallDependencies(scanResult.files),
        copybookDeps: buildCopybookDependencies(scanResult.files)
      };
    } catch (e) {
      return { error: e.message };
    }
  }).addNode("analyze", async (state) => {
    if (state.error || !state.scanResult)
      return {};
    try {
      const prompt = buildDependencyPrompt(state.scanResult, state.callDeps ?? [], state.copybookDeps ?? [], state.targetProgram);
      const response = await llm.invoke(prompt);
      return { report: response.content };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START2, "scan").addEdge("scan", "analyze").addEdge("analyze", END2).compile();
}
async function runDependencyAgent(rootPath, targetProgram, options = {}) {
  const graph = buildGraph(options);
  const result = await graph.invoke({ rootPath, targetProgram });
  return { report: result.report, error: result.error };
}

// ../ai-runtime/dist/agents/modernization.js
import { Annotation as Annotation3, END as END3, START as START3, StateGraph as StateGraph3 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI3 } from "@langchain/openai";
import { readFileSync as readFileSync6 } from "fs";
import { resolve as resolve4 } from "path";

// ../ai-runtime/dist/prompts/modernization.js
function buildModernizationPrompt(file, sourceCode, flow, targetLanguage) {
  const flowSection = flow ? `
## Execution Flow
Entry point: ${flow.entryPoint ?? "unknown"}
Paragraphs: ${flow.paragraphs.map((p) => p.name).join(", ")}
` : "";
  const langLabel = {
    typescript: "TypeScript (Node.js)",
    java: "Java 21",
    python: "Python 3.12",
    go: "Go 1.22"
  };
  const targetLabel = langLabel[targetLanguage] ?? targetLanguage;
  return `You are a senior software architect specializing in COBOL-to-modern migration.

## Source Program
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(", ") || "none"}
- External calls: ${file.calls.join(", ") || "none"}
${flowSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

## Target: ${targetLabel}

Produce a practical modernization plan in Markdown with these sections:

### Executive Summary
One paragraph: what this program does and the overall modernization complexity (Low / Medium / High) with justification.

### COBOL \u2192 ${targetLabel} Mapping
A table mapping key COBOL constructs in this program to their modern equivalents:
| COBOL Construct | Modern Equivalent | Notes |

### Data Structures
Show the equivalent data classes/types for the key WORKING-STORAGE items.

### Core Logic Translation
For the 2-3 most complex paragraphs or business rules, provide:
- A brief description of what the COBOL does
- The equivalent ${targetLabel} code snippet

### External Integration Points
For each CALL and COPY dependency: what modern service/library/API would replace it?

### Migration Steps
Numbered checklist of concrete steps to replace this program, in order.

### Risks & Gotchas
3-5 specific COBOL behaviors (e.g., implicit decimal alignment, numeric overflow, file handling) that are easy to get wrong when migrating to ${targetLabel}.

Be specific to this program's actual code, not generic COBOL advice.`;
}

// ../ai-runtime/dist/agents/modernization.js
var ModernizationAnnotation = Annotation3.Root({
  filePath: Annotation3(),
  targetLanguage: Annotation3(),
  cobolFile: Annotation3(),
  sourceCode: Annotation3(),
  flow: Annotation3(),
  plan: Annotation3(),
  error: Annotation3()
});
function buildGraph2(options) {
  const llm = new ChatOpenAI3({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph3(ModernizationAnnotation).addNode("analyze", async (state) => {
    try {
      const path = resolve4(state.filePath);
      const cobolFile = analyzeFile(path);
      const sourceCode = readFileSync6(path, "utf-8");
      let flow;
      try {
        flow = extractFlow(path);
      } catch {
      }
      return { cobolFile, sourceCode, flow };
    } catch (e) {
      return { error: e.message };
    }
  }).addNode("generate", async (state) => {
    if (state.error || !state.cobolFile || !state.sourceCode)
      return {};
    try {
      const prompt = buildModernizationPrompt(state.cobolFile, state.sourceCode, state.flow, state.targetLanguage);
      const response = await llm.invoke(prompt);
      return { plan: response.content };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START3, "analyze").addEdge("analyze", "generate").addEdge("generate", END3).compile();
}
async function runModernizationAgent(filePath, targetLanguage = "typescript", options = {}) {
  const graph = buildGraph2(options);
  const result = await graph.invoke({ filePath, targetLanguage });
  return { plan: result.plan, error: result.error };
}

// ../ai-runtime/dist/agents/docs.js
import { Annotation as Annotation4, END as END4, START as START4, StateGraph as StateGraph4 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI4 } from "@langchain/openai";
import { readFileSync as readFileSync7 } from "fs";
import { resolve as resolve5 } from "path";

// ../ai-runtime/dist/prompts/docs.js
function buildDocsPrompt(file, sourceCode, flow) {
  const flowSection = flow ? `
## Paragraphs
${flow.paragraphs.map((p) => `- **${p.name}** (lines ${p.lineStart}\u2013${p.lineEnd}): performs [${p.performs.join(", ") || "none"}], calls [${p.calls.join(", ") || "none"}]`).join("\n")}
` : "";
  return `You are a technical writer generating production-quality documentation for a legacy COBOL program.

## Program Metadata
- Program ID: ${file.programId ?? file.name}
- File: ${file.name}
- Type: ${file.type}
- Lines: ${file.lines}
- Size: ${Math.round(file.sizeBytes / 1024)}KB
- Copybooks: ${file.copybooks.join(", ") || "none"}
- External calls: ${file.calls.join(", ") || "none"}
${flowSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Generate complete Markdown documentation with these sections:

# [Program Name]

## Overview
2-3 sentences describing the program's business purpose.

## Business Context
What business process does this program support? Who uses it and when?

## Inputs & Outputs
| Name | Type | Direction | Description |

## Business Rules
Numbered list of all business rules implemented, in plain language.

## Data Dictionary
Key WORKING-STORAGE variables and their purpose:
| Variable | COBOL Type | Purpose |

## Control Flow
\`\`\`mermaid
flowchart TD
    [Generate a Mermaid flowchart showing the main execution path through paragraphs]
\`\`\`

## Dependencies
### Copybooks
For each copybook: what data structures it provides.

### External Programs (CALL)
For each called program: its likely purpose based on context.

## Maintenance Notes
- Known quirks or edge cases visible in the code
- Areas most likely to need changes for business rule updates

## Change Log
| Date | Author | Change |
|------|--------|--------|
| TBD  | \u2014      | Initial documentation generated |

Write documentation that a developer unfamiliar with COBOL can understand and act on.`;
}

// ../ai-runtime/dist/agents/docs.js
var DocsAnnotation = Annotation4.Root({
  filePath: Annotation4(),
  cobolFile: Annotation4(),
  sourceCode: Annotation4(),
  flow: Annotation4(),
  documentation: Annotation4(),
  error: Annotation4()
});
function buildGraph3(options) {
  const llm = new ChatOpenAI4({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph4(DocsAnnotation).addNode("parse", async (state) => {
    try {
      const path = resolve5(state.filePath);
      const cobolFile = analyzeFile(path);
      const sourceCode = readFileSync7(path, "utf-8");
      let flow;
      try {
        flow = extractFlow(path);
      } catch {
      }
      return { cobolFile, sourceCode, flow };
    } catch (e) {
      return { error: e.message };
    }
  }).addNode("generate", async (state) => {
    if (state.error || !state.cobolFile || !state.sourceCode)
      return {};
    try {
      const prompt = buildDocsPrompt(state.cobolFile, state.sourceCode, state.flow);
      const response = await llm.invoke(prompt);
      return { documentation: response.content };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START4, "parse").addEdge("parse", "generate").addEdge("generate", END4).compile();
}
async function runDocsAgent(filePath, options = {}) {
  const graph = buildGraph3(options);
  const result = await graph.invoke({ filePath });
  return { documentation: result.documentation, error: result.error };
}

// src/commands/explain.ts
var BRAND2 = chalk3.bold.hex("#00D4FF");
var DIM2 = chalk3.dim;
var LABEL2 = chalk3.bold.white;
var FILE_COLOR2 = chalk3.cyan;
var WARN2 = chalk3.yellow;
function renderExplainHeader(filePath) {
  const file = analyzeFile(filePath);
  console.log();
  console.log(BRAND2("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Explain"));
  console.log(DIM2("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${LABEL2("Program")}    ${BRAND2(file.programId ?? file.name.replace(/\.[^.]+$/, ""))}`);
  console.log(`  ${LABEL2("File")}       ${FILE_COLOR2(file.name)}`);
  console.log(`  ${LABEL2("Lines")}      ${file.lines}`);
  if (file.copybooks.length > 0) {
    console.log(`  ${LABEL2("Copybooks")}  ${file.copybooks.map((c) => WARN2(c)).join(", ")}`);
  }
  if (file.calls.length > 0) {
    console.log(`  ${LABEL2("Calls")}      ${file.calls.map((c) => chalk3.magenta(c)).join(", ")}`);
  }
  console.log();
  console.log(DIM2("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
}
var explainCommand = new Command3("explain").description("Explain the business logic of a COBOL program using AI").argument("<file>", "Path to the COBOL file").option("--model <model>", "OpenAI model to use", "gpt-4o").option("--raw", "Output raw markdown without header").action(async (filePath, options) => {
  const resolvedPath = resolve6(filePath);
  if (!options.raw) {
    renderExplainHeader(resolvedPath);
  }
  const spinner = ora3({ text: "Connecting to AI\u2026", color: "cyan" }).start();
  let firstChunk = true;
  try {
    for await (const text of explainFile({
      filePath: resolvedPath,
      options: { model: options.model }
    })) {
      if (firstChunk) {
        spinner.stop();
        firstChunk = false;
      }
      process.stdout.write(
        options.raw ? text : applyMarkdownColors(text)
      );
    }
    console.log();
    console.log();
  } catch (err) {
    spinner.fail(`Explain failed: ${err.message}`);
    process.exitCode = 1;
  }
});
function applyMarkdownColors(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk3.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk3.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk3.cyan(t));
}

// src/commands/flow.ts
import { Command as Command4 } from "commander";
import chalk4 from "chalk";
import { resolve as resolve7 } from "path";
var BRAND3 = chalk4.bold.hex("#00D4FF");
var DIM3 = chalk4.dim;
var LABEL3 = chalk4.bold.white;
var PARA_COLOR = chalk4.bold.green;
var CALL_COLOR = chalk4.magenta;
var ENTRY_BADGE = chalk4.bold.bgGreen.black(" ENTRY ");
var T = {
  branch: "\u251C\u2500",
  last: "\u2514\u2500",
  pipe: "\u2502 ",
  space: "  "
};
function buildTree(paraName, paraMap, visited) {
  const para = paraMap.get(paraName);
  if (!para || visited.has(paraName)) {
    return {
      label: visited.has(paraName) ? `${PARA_COLOR(paraName)} ${DIM3("(\u21BA recursive)")}` : `${PARA_COLOR(paraName)} ${DIM3("(external)")}`,
      children: []
    };
  }
  visited.add(paraName);
  const children = [];
  for (const target of para.performs) {
    children.push(buildTree(target, paraMap, new Set(visited)));
  }
  for (const call of para.calls) {
    children.push({
      label: `${CALL_COLOR("CALL")} ${chalk4.yellow(call)}`,
      children: []
    });
  }
  return { label: PARA_COLOR(paraName), children };
}
function renderTree(node, prefix = "", isLast = true) {
  const connector = isLast ? T.last : T.branch;
  const lines = [`${prefix}${connector} ${node.label}`];
  const childPrefix = prefix + (isLast ? T.space : T.pipe);
  node.children.forEach((child, i) => {
    const last = i === node.children.length - 1;
    lines.push(...renderTree(child, childPrefix, last));
  });
  return lines;
}
function renderFlow(result, file) {
  console.log();
  console.log(BRAND3("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Flow"));
  console.log(DIM3("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${LABEL3("Program")}     ${BRAND3(result.programId ?? result.fileName.replace(/\.[^.]+$/, ""))}`);
  console.log(`  ${LABEL3("File")}        ${chalk4.cyan(file)}`);
  console.log(`  ${LABEL3("Paragraphs")} ${result.paragraphs.length}`);
  console.log(`  ${LABEL3("Entry")}       ${result.entryPoint ? PARA_COLOR(result.entryPoint) : DIM3("unknown")}`);
  console.log();
  console.log(DIM3("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  if (result.paragraphs.length === 0) {
    console.log(DIM3("  No PROCEDURE DIVISION found."));
    return;
  }
  const paraMap = new Map(result.paragraphs.map((p) => [p.name, p]));
  const entryPoint = result.entryPoint;
  const programLabel = `${BRAND3(result.programId ?? result.fileName)} ${ENTRY_BADGE}`;
  console.log(`  ${programLabel}`);
  if (entryPoint) {
    const root = buildTree(entryPoint, paraMap, /* @__PURE__ */ new Set());
    const treeLines = renderTree(root, "", true);
    for (const line of treeLines) {
      console.log(`  ${line}`);
    }
  }
  console.log();
  const reachable = /* @__PURE__ */ new Set();
  function markReachable(name) {
    if (reachable.has(name)) return;
    reachable.add(name);
    const para = paraMap.get(name);
    if (para) para.performs.forEach(markReachable);
  }
  if (entryPoint) markReachable(entryPoint);
  const orphans = result.paragraphs.filter((p) => !reachable.has(p.name));
  if (orphans.length > 0) {
    console.log(DIM3(`  \u2500 Unreachable paragraphs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
    for (const p of orphans) {
      console.log(`  ${DIM3(T.last)} ${chalk4.dim(p.name)}`);
    }
    console.log();
  }
}
var flowCommand = new Command4("flow").description("Generate the execution flow tree of a COBOL program").argument("<file>", "Path to the COBOL file").option("--json", "Output raw JSON").action((filePath, options) => {
  const resolvedPath = resolve7(filePath);
  try {
    const result = extractFlow(resolvedPath);
    if (options.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      return;
    }
    renderFlow(result, resolvedPath);
  } catch (err) {
    console.error(chalk4.red(`Flow failed: ${err.message}`));
    process.exitCode = 1;
  }
});

// src/commands/embed.ts
import { Command as Command5 } from "commander";
import chalk5 from "chalk";
import ora4 from "ora";
import { resolve as resolve8 } from "path";

// ../rag-engine/dist/chunker/cobol.js
import { readFileSync as readFileSync8 } from "fs";
import { basename as basename3 } from "path";
function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function chunkId(filePath, descriptor) {
  const a = djb2(filePath);
  const b = djb2(descriptor);
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(0, 3)}-${b}${a.slice(0, 4)}`;
}
function buildProgramHeader(filePath, sourceLines) {
  const meta = analyzeFile(filePath);
  const headerLines = sourceLines.slice(0, sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l)) + 1).filter((l) => l.trim() && l[6] !== "*").join("\n").trim();
  return [
    `[COBOL Program: ${meta.programId ?? basename3(filePath)}]`,
    `File: ${basename3(filePath)}`,
    `Copybooks: ${meta.copybooks.join(", ") || "none"}`,
    `External calls: ${meta.calls.join(", ") || "none"}`,
    "",
    headerLines
  ].join("\n");
}
function extractParagraphSource(sourceLines, lineStart, lineEnd) {
  return sourceLines.slice(lineStart, lineEnd + 1).join("\n").trimEnd();
}
function chunkCopybookFile(filePath) {
  const source = readFileSync8(filePath, "utf-8");
  const sourceLines = source.split("\n");
  const meta = analyzeFile(filePath);
  const chunks = [];
  const level01Indices = [];
  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i] ?? "";
    const trimmed = line.trimStart();
    if (/^01\s+/i.test(trimmed) && line[6] !== "*") {
      level01Indices.push(i);
    }
  }
  if (level01Indices.length === 0) {
    const content = [
      `[COBOL Copybook: ${basename3(filePath)}]`,
      `File: ${basename3(filePath)}`,
      "",
      source.trim()
    ].join("\n");
    chunks.push({
      id: chunkId(filePath, "copybook-full"),
      content,
      payload: {
        file: basename3(filePath),
        programId: meta.programId,
        chunkType: "copybook",
        performs: [],
        calls: [],
        content,
        lineStart: 0,
        lineEnd: sourceLines.length - 1
      }
    });
    return chunks;
  }
  for (let i = 0; i < level01Indices.length; i++) {
    const lineStart = level01Indices[i];
    const lineEnd = (level01Indices[i + 1] ?? sourceLines.length) - 1;
    const block = sourceLines.slice(lineStart, lineEnd + 1).join("\n").trimEnd();
    const firstLine = sourceLines[lineStart] ?? "";
    const fieldMatch = /01\s+([A-Z0-9][A-Z0-9-]*)/i.exec(firstLine);
    const fieldName = fieldMatch?.[1]?.toUpperCase() ?? `item-${i}`;
    const content = [
      `[COBOL Copybook: ${basename3(filePath)} | Record: ${fieldName}]`,
      `File: ${basename3(filePath)}`,
      "",
      block
    ].join("\n");
    chunks.push({
      id: chunkId(filePath, `copybook::${fieldName}`),
      content,
      payload: {
        file: basename3(filePath),
        programId: meta.programId,
        chunkType: "copybook",
        paragraphName: fieldName,
        performs: [],
        calls: [],
        content,
        lineStart,
        lineEnd
      }
    });
  }
  return chunks;
}
function chunkProgramFile(filePath) {
  const source = readFileSync8(filePath, "utf-8");
  const sourceLines = source.split("\n");
  const flow = extractFlow(filePath);
  const meta = analyzeFile(filePath);
  const chunks = [];
  const headerContent = buildProgramHeader(filePath, sourceLines);
  chunks.push({
    id: chunkId(filePath, "program-header"),
    content: headerContent,
    payload: {
      file: basename3(filePath),
      programId: meta.programId,
      chunkType: "program-header",
      performs: [],
      calls: meta.calls,
      content: headerContent,
      lineStart: 0,
      lineEnd: sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l))
    }
  });
  const procOffset = sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l)) + 1;
  for (const para of flow.paragraphs) {
    const absStart = procOffset + para.lineStart;
    const absEnd = procOffset + para.lineEnd;
    const code = extractParagraphSource(sourceLines, absStart, absEnd);
    const content = [
      `[COBOL Program: ${meta.programId ?? basename3(filePath)} | Paragraph: ${para.name}]`,
      `Performs: ${para.performs.join(", ") || "none"}`,
      `Calls: ${para.calls.join(", ") || "none"}`,
      "",
      code
    ].join("\n");
    chunks.push({
      id: chunkId(filePath, `para::${para.name}`),
      content,
      payload: {
        file: basename3(filePath),
        programId: meta.programId,
        chunkType: "paragraph",
        paragraphName: para.name,
        performs: para.performs,
        calls: para.calls,
        content,
        lineStart: absStart,
        lineEnd: absEnd
      }
    });
  }
  return chunks;
}
function chunkCobolFile(filePath, type = "program") {
  if (type === "copybook")
    return chunkCopybookFile(filePath);
  return chunkProgramFile(filePath);
}

// ../rag-engine/dist/chunker/jcl.js
import { readFileSync as readFileSync9 } from "fs";
import { basename as basename4 } from "path";
function djb22(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function chunkId2(filePath, descriptor) {
  const a = djb22(filePath);
  const b = djb22(descriptor);
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(0, 3)}-${b}${a.slice(0, 4)}`;
}
function parseJclSteps(sourceLines) {
  let jobName = null;
  const steps = [];
  let currentStep = null;
  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i] ?? "";
    if (line.startsWith("//*"))
      continue;
    const jobMatch = /^\/\/([A-Z0-9@#$]{1,8})\s+JOB\s/i.exec(line);
    if (jobMatch && !jobName) {
      jobName = jobMatch[1]?.toUpperCase() ?? null;
      continue;
    }
    const execMatch = /^\/\/([A-Z0-9@#$]{1,8})\s+EXEC\s+(?:PGM=([A-Z0-9@#$-]+)|([A-Z0-9@#$-]+))/i.exec(line);
    if (execMatch) {
      if (currentStep) {
        currentStep.lineEnd = i - 1;
        steps.push(currentStep);
      }
      currentStep = {
        stepName: execMatch[1]?.toUpperCase() ?? `STEP${steps.length + 1}`,
        program: execMatch[2]?.toUpperCase() ?? null,
        proc: execMatch[3]?.toUpperCase() ?? null,
        lines: [line],
        lineStart: i,
        lineEnd: i
      };
      continue;
    }
    if (currentStep && line.startsWith("//")) {
      currentStep.lines.push(line);
    }
  }
  if (currentStep) {
    currentStep.lineEnd = sourceLines.length - 1;
    steps.push(currentStep);
  }
  return { jobName, steps };
}
function chunkJclFile(filePath) {
  const source = readFileSync9(filePath, "utf-8");
  const sourceLines = source.split("\n");
  const { jobName, steps } = parseJclSteps(sourceLines);
  const chunks = [];
  const fileName = basename4(filePath);
  if (steps.length === 0) {
    const content = [
      `[JCL Job: ${jobName ?? fileName}]`,
      `File: ${fileName}`,
      "",
      source.trim()
    ].join("\n");
    chunks.push({
      id: chunkId2(filePath, "jcl-full"),
      content,
      payload: {
        file: fileName,
        programId: jobName,
        chunkType: "jcl-step",
        performs: [],
        calls: [],
        content,
        lineStart: 0,
        lineEnd: sourceLines.length - 1
      }
    });
    return chunks;
  }
  for (const step of steps) {
    const target = step.program ?? step.proc ?? "UNKNOWN";
    const stepSource = step.lines.join("\n");
    const datasets = [];
    for (const line of step.lines) {
      const dsn = /DSN=([A-Z0-9.@#$-]+)/i.exec(line);
      if (dsn?.[1])
        datasets.push(dsn[1].toUpperCase());
    }
    const content = [
      `[JCL Job: ${jobName ?? fileName} | Step: ${step.stepName} | Program: ${target}]`,
      `File: ${fileName}`,
      `Calls program: ${target}`,
      datasets.length > 0 ? `Datasets: ${datasets.join(", ")}` : null,
      "",
      stepSource
    ].filter(Boolean).join("\n");
    chunks.push({
      id: chunkId2(filePath, `step::${step.stepName}`),
      content,
      payload: {
        file: fileName,
        programId: jobName,
        chunkType: "jcl-step",
        paragraphName: step.stepName,
        performs: [],
        calls: [target],
        content,
        lineStart: step.lineStart,
        lineEnd: step.lineEnd
      }
    });
  }
  return chunks;
}

// ../rag-engine/dist/store/qdrant.js
import { QdrantClient } from "@qdrant/js-client-rest";
var QdrantStore = class {
  client;
  collection;
  constructor(url, collection = "opencobol") {
    this.client = new QdrantClient({ url });
    this.collection = collection;
  }
  async ensureCollection(dimensions) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === this.collection);
    if (!exists) {
      await this.client.createCollection(this.collection, {
        vectors: { size: dimensions, distance: "Cosine" }
      });
    }
  }
  async upsert(points) {
    await this.client.upsert(this.collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload
      }))
    });
  }
  async deleteByIds(ids) {
    if (ids.length === 0)
      return;
    await this.client.delete(this.collection, {
      wait: true,
      points: ids
    });
  }
  async search(vector, limit = 5) {
    const result = await this.client.search(this.collection, {
      vector,
      limit,
      with_payload: true
    });
    return result.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload
    }));
  }
  async collectionCount() {
    const info = await this.client.getCollection(this.collection);
    return info.points_count ?? 0;
  }
};

// ../rag-engine/dist/providers/embedding/openai.js
import OpenAI2 from "openai";
var BATCH_SIZE = 100;
var OpenAIEmbeddings = class {
  model = "text-embedding-3-small";
  dimensions = 1536;
  client;
  constructor(apiKey) {
    this.client = new OpenAI2({ apiKey: apiKey ?? process.env["OPENAI_API_KEY"] });
  }
  async embed(texts) {
    const results = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }
};

// ../rag-engine/dist/manifest.js
import { readFileSync as readFileSync10, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2, existsSync as existsSync2, statSync as statSync3 } from "fs";
import { homedir as homedir2 } from "os";
import { join as join3 } from "path";
function manifestPath(collection) {
  const dir = join3(homedir2(), ".opencobol", "manifests");
  mkdirSync2(dir, { recursive: true });
  return join3(dir, `${collection}.json`);
}
function loadManifest(collection) {
  const path = manifestPath(collection);
  if (!existsSync2(path))
    return {};
  try {
    return JSON.parse(readFileSync10(path, "utf-8"));
  } catch {
    return {};
  }
}
function saveManifest(collection, manifest) {
  writeFileSync2(manifestPath(collection), JSON.stringify(manifest, null, 2));
}
function getFileMtime(filePath) {
  return statSync3(filePath).mtimeMs;
}
function isFileChanged(filePath, manifest) {
  const entry = manifest[filePath];
  if (!entry)
    return true;
  return getFileMtime(filePath) !== entry.mtime;
}
function setManifestEntry(manifest, filePath, chunkIds) {
  manifest[filePath] = { mtime: getFileMtime(filePath), chunkIds };
}
function removeManifestEntry(manifest, filePath) {
  const entry = manifest[filePath];
  delete manifest[filePath];
  return entry?.chunkIds ?? [];
}

// ../rag-engine/dist/indexer.js
async function* indexDirectory(rootPath, options = {}) {
  const collection = options.collection ?? process.env["QDRANT_COLLECTION"] ?? "opencobol";
  const provider = options.embeddingProvider ?? new OpenAIEmbeddings();
  const store = new QdrantStore(options.qdrantUrl ?? process.env["QDRANT_URL"] ?? "http://localhost:6333", collection);
  await store.ensureCollection(provider.dimensions);
  const scan = scanDirectory(rootPath);
  const indexableFiles = scan.files.filter((f) => f.type === "program" || f.type === "copybook" || f.type === "jcl");
  const manifest = loadManifest(collection);
  const currentPaths = new Set(indexableFiles.map((f) => f.path));
  let removedCount = 0;
  for (const [filePath, entry] of Object.entries(manifest)) {
    if (!currentPaths.has(filePath)) {
      await store.deleteByIds(entry.chunkIds);
      removeManifestEntry(manifest, filePath);
      removedCount++;
      yield { type: "removed", file: filePath.split("/").pop() ?? filePath };
    }
  }
  let totalIndexed = 0;
  let skippedCount = 0;
  for (const file of indexableFiles) {
    if (!isFileChanged(file.path, manifest)) {
      skippedCount++;
      yield { type: "skipped", file: file.name };
      continue;
    }
    try {
      const oldEntry = manifest[file.path];
      if (oldEntry) {
        await store.deleteByIds(oldEntry.chunkIds);
      }
      let chunks;
      if (file.type === "jcl") {
        chunks = chunkJclFile(file.path);
      } else {
        chunks = chunkCobolFile(file.path, file.type === "copybook" ? "copybook" : "program");
      }
      const vectors = await provider.embed(chunks.map((c) => c.content));
      await store.upsert(chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        payload: chunk.payload
      })));
      setManifestEntry(manifest, file.path, chunks.map((c) => c.id));
      totalIndexed += chunks.length;
      yield { type: "file", file: file.name, chunks: chunks.length, indexed: totalIndexed };
    } catch (err) {
      yield { type: "error", file: file.name, error: err.message };
    }
  }
  saveManifest(collection, manifest);
  yield {
    type: "done",
    total: indexableFiles.length,
    indexed: totalIndexed,
    skipped: skippedCount,
    removed: removedCount
  };
}

// ../rag-engine/dist/retriever.js
async function retrieve(query, options = {}) {
  const provider = options.embeddingProvider ?? new OpenAIEmbeddings();
  const store = new QdrantStore(options.qdrantUrl ?? process.env["QDRANT_URL"] ?? "http://localhost:6333", options.collection ?? "opencobol");
  const [queryVector] = await provider.embed([query]);
  if (!queryVector)
    throw new Error("Failed to generate query embedding");
  const hits = await store.search(queryVector, options.topK ?? 5);
  return hits.map((hit) => ({
    hit,
    formattedChunk: formatHit(hit)
  }));
}
function formatHit(hit) {
  const { payload, score } = hit;
  const scoreStr = `[relevance: ${(score * 100).toFixed(0)}%]`;
  if (payload.chunkType === "program-header") {
    return `--- Program: ${payload.programId ?? payload.file} (header) ${scoreStr}
${payload.content}`;
  }
  if (payload.chunkType === "paragraph") {
    return `--- ${payload.file} \u203A ${payload.paragraphName} ${scoreStr}
${payload.content}`;
  }
  return `--- ${payload.file} ${scoreStr}
${payload.content}`;
}
function buildRagPrompt(query, contexts) {
  const contextBlock = contexts.map((c) => c.formattedChunk).join("\n\n");
  return `You are an expert COBOL analyst. Answer the question based solely on the COBOL code excerpts provided below. Be concise and practical. If the answer is not in the context, say so.

## Relevant Code Excerpts

${contextBlock}

## Question

${query}`;
}

// src/commands/embed.ts
var BRAND4 = chalk5.bold.hex("#00D4FF");
var DIM4 = chalk5.dim;
var SUCCESS2 = chalk5.green;
var WARN3 = chalk5.yellow;
var LABEL4 = chalk5.bold.white;
var embedCommand = new Command5("embed").description("Index a COBOL directory into the vector database for semantic search").argument("<path>", "Directory to index").option("--qdrant <url>", "Qdrant URL", "http://localhost:6333").option("--collection <name>", "Qdrant collection name", "opencobol").action(async (targetPath, options) => {
  const resolvedPath = resolve8(targetPath);
  console.log();
  console.log(BRAND4("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Embed"));
  console.log(DIM4("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${LABEL4("Path")}        ${chalk5.cyan(resolvedPath)}`);
  console.log(`  ${LABEL4("Qdrant")}      ${DIM4(options.qdrant)}`);
  console.log(`  ${LABEL4("Collection")}  ${DIM4(options.collection)}`);
  console.log();
  const spinner = ora4("Connecting to Qdrant\u2026").start();
  let firstEvent = true;
  try {
    for await (const progress of indexDirectory(resolvedPath, {
      qdrantUrl: options.qdrant,
      collection: options.collection
    })) {
      if (firstEvent && progress.type !== "done") {
        spinner.stop();
        firstEvent = false;
      }
      if (progress.type === "file") {
        console.log(
          `  ${SUCCESS2("\u2714")}  ${chalk5.cyan(progress.file ?? "")}  ` + DIM4(`${progress.chunks} chunk${(progress.chunks ?? 0) > 1 ? "s" : ""} indexed`)
        );
      } else if (progress.type === "skipped") {
        console.log(`  ${DIM4("\u2013")}  ${DIM4(progress.file ?? "")}  ${DIM4("unchanged, skipped")}`);
      } else if (progress.type === "removed") {
        console.log(`  ${WARN3("\u2715")}  ${chalk5.yellow(progress.file ?? "")}  ${DIM4("removed from index")}`);
      } else if (progress.type === "error") {
        console.log(`  ${WARN3("\u26A0")}  ${chalk5.cyan(progress.file ?? "")}  ${WARN3(progress.error ?? "")}`);
      } else if (progress.type === "done") {
        if (firstEvent) {
          spinner.stop();
          firstEvent = false;
        }
        console.log();
        const parts = [
          `${SUCCESS2(String(progress.total))} files scanned`,
          progress.indexed ? `${SUCCESS2(String(progress.indexed))} chunks indexed` : null,
          progress.skipped ? `${DIM4(String(progress.skipped))} unchanged` : null,
          progress.removed ? `${WARN3(String(progress.removed))} removed` : null
        ].filter(Boolean).join("  \xB7  ");
        console.log(`  ${SUCCESS2("Done!")}  ${parts}`);
        console.log();
        console.log(DIM4(`  Run ${chalk5.white("opencobol ask")} to start querying.`));
        console.log();
      }
    }
  } catch (err) {
    spinner.fail(`Embed failed: ${err.message}`);
    process.exitCode = 1;
  }
});

// src/commands/ask.ts
import { Command as Command6 } from "commander";
import chalk6 from "chalk";
import ora5 from "ora";
import { createInterface } from "readline";
var BRAND5 = chalk6.bold.hex("#00D4FF");
var DIM5 = chalk6.dim;
var PROMPT_CHAR = chalk6.bold.hex("#00D4FF")("\u25B6");
var AI_COLOR = chalk6.white;
function applyMarkdownColors2(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk6.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk6.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk6.cyan(t));
}
async function answerQuestion(question, options) {
  const spinner = ora5({ text: "Searching codebase\u2026", color: "cyan" }).start();
  let contexts;
  try {
    contexts = await retrieve(question, {
      qdrantUrl: options.qdrant,
      collection: options.collection,
      topK: options.topK
    });
    spinner.stop();
  } catch (err) {
    spinner.fail(`Retrieval failed: ${err.message}`);
    return;
  }
  if (contexts.length === 0) {
    console.log(DIM5("\n  No relevant context found. Try running opencobol embed first.\n"));
    return;
  }
  const sources = [...new Set(contexts.map((c) => c.hit.payload.file))];
  console.log(DIM5(`
  Context from: ${sources.join(", ")}
`));
  const provider = new OpenAIProvider();
  const prompt = buildRagPrompt(question, contexts);
  console.log(chalk6.dim("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  let firstChunk = true;
  const genSpinner = ora5({ text: "Generating answer\u2026", color: "cyan" }).start();
  try {
    for await (const chunk of provider.streamCompletion(prompt, { model: options.model })) {
      if (firstChunk) {
        genSpinner.stop();
        firstChunk = false;
        process.stdout.write("  ");
      }
      process.stdout.write(AI_COLOR(applyMarkdownColors2(chunk.text)));
    }
    console.log("\n");
  } catch (err) {
    genSpinner.fail(`Generation failed: ${err.message}`);
  }
}
var askCommand = new Command6("ask").description("Ask a question about your COBOL codebase using semantic search + AI").argument("[question]", "Question to ask (omit for interactive mode)").option("--qdrant <url>", "Qdrant URL", "http://localhost:6333").option("--collection <name>", "Qdrant collection name", "opencobol").option("--model <model>", "OpenAI model", "gpt-4o").option("--top-k <n>", "Number of context chunks to retrieve", "5").action(async (question, options) => {
  const resolvedOptions = { ...options, topK: parseInt(options.topK, 10) };
  if (question) {
    await answerQuestion(question, resolvedOptions);
    return;
  }
  console.log();
  console.log(BRAND5("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Ask"));
  console.log(DIM5("  Type a question about your COBOL codebase. Ctrl+C to exit."));
  console.log();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const loop = () => {
    rl.question(`  ${PROMPT_CHAR} `, async (input2) => {
      const trimmed = input2.trim();
      if (!trimmed) {
        loop();
        return;
      }
      if (trimmed === "/exit" || trimmed === "/quit") {
        console.log(DIM5("\n  Bye!\n"));
        rl.close();
        return;
      }
      await answerQuestion(trimmed, resolvedOptions);
      loop();
    });
  };
  loop();
});

// src/commands/deps.ts
import { Command as Command7 } from "commander";
import chalk7 from "chalk";
import ora6 from "ora";
import { resolve as resolve9 } from "path";
var BRAND6 = chalk7.bold.hex("#00D4FF");
var DIM6 = chalk7.dim;
var AI_COLOR2 = chalk7.white;
function applyMarkdownColors3(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk7.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk7.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk7.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk7.dim(m));
}
var depsCommand = new Command7("deps").description("Analyze inter-program dependencies and produce a migration impact report").argument("<path>", "Directory to scan").option("--program <name>", "Focus on impact of changing a specific program").option("--model <model>", "OpenAI model", "gpt-4o").action(async (targetPath, options) => {
  const resolvedPath = resolve9(targetPath);
  console.log();
  console.log(BRAND6("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Dependency Analysis"));
  console.log(DIM6("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  if (options.program) {
    console.log(`  ${chalk7.bold.white("Focus")}  ${chalk7.cyan(options.program)}`);
    console.log();
  }
  const spinner = ora6({ text: "Scanning codebase\u2026", color: "cyan" }).start();
  const { report, error } = await runDependencyAgent(resolvedPath, options.program, {
    model: options.model
  });
  spinner.stop();
  if (error) {
    console.error(chalk7.red(`  Error: ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(chalk7.dim("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  for (const line of (report ?? "").split("\n")) {
    console.log("  " + AI_COLOR2(applyMarkdownColors3(line)));
  }
  console.log();
});

// src/commands/modernize.ts
import { Command as Command8 } from "commander";
import chalk8 from "chalk";
import ora7 from "ora";
import { resolve as resolve10, basename as basename5, extname as extname3 } from "path";
import { writeFileSync as writeFileSync3 } from "fs";
var BRAND7 = chalk8.bold.hex("#00D4FF");
var DIM7 = chalk8.dim;
var SUCCESS3 = chalk8.green;
var AI_COLOR3 = chalk8.white;
function applyMarkdownColors4(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk8.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk8.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk8.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk8.dim(m));
}
var modernizeCommand = new Command8("modernize").description("Generate a modernization plan for a COBOL program").argument("<file>", "COBOL file to modernize").option("--lang <language>", "Target language (typescript, java, python, go)", "typescript").option("--model <model>", "OpenAI model", "gpt-4o").option("--output <file>", "Save plan to a markdown file").action(async (filePath, options) => {
  const resolvedPath = resolve10(filePath);
  const programName = basename5(filePath, extname3(filePath)).toUpperCase();
  console.log();
  console.log(BRAND7("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Modernize"));
  console.log(DIM7("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${chalk8.bold.white("Program")}   ${chalk8.cyan(programName)}`);
  console.log(`  ${chalk8.bold.white("Target")}    ${chalk8.cyan(options.lang)}`);
  console.log();
  const spinner = ora7({ text: "Analyzing program\u2026", color: "cyan" }).start();
  const { plan, error } = await runModernizationAgent(resolvedPath, options.lang, {
    model: options.model
  });
  spinner.stop();
  if (error) {
    console.error(chalk8.red(`  Error: ${error}`));
    process.exitCode = 1;
    return;
  }
  const content = plan ?? "";
  if (options.output) {
    writeFileSync3(resolve10(options.output), content, "utf-8");
    console.log(SUCCESS3(`  Plan saved to ${options.output}`));
    console.log();
    return;
  }
  console.log(chalk8.dim("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  for (const line of content.split("\n")) {
    console.log("  " + AI_COLOR3(applyMarkdownColors4(line)));
  }
  console.log();
  console.log(DIM7(`  Tip: use --output plan.md to save as a markdown file.`));
  console.log();
});

// src/commands/docs.ts
import { Command as Command9 } from "commander";
import chalk9 from "chalk";
import ora8 from "ora";
import { resolve as resolve11, basename as basename6, extname as extname4 } from "path";
import { writeFileSync as writeFileSync4 } from "fs";
var BRAND8 = chalk9.bold.hex("#00D4FF");
var DIM8 = chalk9.dim;
var SUCCESS4 = chalk9.green;
var AI_COLOR4 = chalk9.white;
function applyMarkdownColors5(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk9.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk9.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk9.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk9.dim(m));
}
var docsCommand = new Command9("docs").description("Generate markdown documentation for a COBOL program").argument("<file>", "COBOL file to document").option("--model <model>", "OpenAI model", "gpt-4o").option("--output <file>", "Save documentation to a file (default: <program>.md)").action(async (filePath, options) => {
  const resolvedPath = resolve11(filePath);
  const programName = basename6(filePath, extname4(filePath)).toUpperCase();
  const defaultOutput = `${basename6(filePath, extname4(filePath))}.md`;
  console.log();
  console.log(BRAND8("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Generate Docs"));
  console.log(DIM8("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${chalk9.bold.white("Program")}   ${chalk9.cyan(programName)}`);
  console.log();
  const spinner = ora8({ text: "Generating documentation\u2026", color: "cyan" }).start();
  const { documentation, error } = await runDocsAgent(resolvedPath, { model: options.model });
  spinner.stop();
  if (error) {
    console.error(chalk9.red(`  Error: ${error}`));
    process.exitCode = 1;
    return;
  }
  const content = documentation ?? "";
  const outputPath = options.output ?? defaultOutput;
  writeFileSync4(resolve11(outputPath), content, "utf-8");
  console.log(SUCCESS4(`  Documentation saved to ${outputPath}`));
  console.log();
  const preview = content.split("\n").slice(0, 20).join("\n");
  console.log(DIM8("  Preview:"));
  console.log(DIM8("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  for (const line of preview.split("\n")) {
    console.log("  " + AI_COLOR4(applyMarkdownColors5(line)));
  }
  if (content.split("\n").length > 20) {
    console.log(DIM8(`  \u2026 (${content.split("\n").length - 20} more lines in ${outputPath})`));
  }
  console.log();
});

// src/index.ts
applyConfig();
var program = new Command10();
program.name("opencobol").description("OpenCobol AI \u2014 Transform legacy COBOL into AI-navigable context").version("0.1.0");
program.addCommand(initCommand);
program.addCommand(scanCommand);
program.addCommand(explainCommand);
program.addCommand(flowCommand);
program.addCommand(embedCommand);
program.addCommand(askCommand);
program.addCommand(depsCommand);
program.addCommand(modernizeCommand);
program.addCommand(docsCommand);
program.parse(process.argv);
