#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

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
    qdrantCollection: process.env["QDRANT_COLLECTION"] ?? fileConfig.qdrantCollection,
    langsmithApiKey: process.env["LANGCHAIN_API_KEY"] ?? fileConfig.langsmithApiKey,
    langsmithProject: process.env["LANGCHAIN_PROJECT"] ?? fileConfig.langsmithProject
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
  if (config.langsmithApiKey && !process.env["LANGCHAIN_API_KEY"]) {
    process.env["LANGCHAIN_API_KEY"] = config.langsmithApiKey;
    process.env["LANGCHAIN_TRACING_V2"] = "true";
    process.env["LANGCHAIN_PROJECT"] = config.langsmithProject ?? "opencobol-ai";
  }
}

// src/index.ts
import { Command as Command14 } from "commander";

// src/commands/init.ts
import { Command } from "commander";
import { input, password, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
function printBanner(version) {
  const width = 56;
  const border = chalk.cyan("\u2550".repeat(width));
  const side = chalk.cyan("\u2551");
  const line = (text) => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, "");
    const spaces = " ".repeat(Math.max(0, width - visible.length - 2));
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
  printBanner("0.1.4");
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
  console.log();
  const useLangSmith = await confirm({
    message: "Enable LangSmith observability? " + chalk.dim("(traces every AI agent run)"),
    default: false
  });
  if (useLangSmith) {
    console.log();
    console.log(chalk.dim("  Get your key at: https://smith.langchain.com \u2192 Settings \u2192 API Keys\n"));
    const lsKey = await password({
      message: "LangSmith API Key",
      mask: "\u25CF",
      validate: (v) => v.startsWith("ls__") && v.length > 10 ? true : "Key must start with ls__"
    });
    config.langsmithApiKey = lsKey;
    config.langsmithProject = await input({
      message: "LangSmith project name",
      default: "opencobol-ai"
    });
  }
  saveConfig(config);
  console.log();
  console.log(chalk.cyan("\u2500".repeat(58)));
  console.log();
  console.log(`  ${chalk.green("\u2714")}  Config saved to ${chalk.dim(CONFIG_PATH)}`);
  if (useLangSmith) {
    console.log(`  ${chalk.green("\u2714")}  LangSmith tracing enabled \u2014 all agent runs will be traced`);
  }
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
import { readFileSync as readFileSync3, statSync } from "fs";
import { extname, basename } from "path";

// ../parser-core/dist/scanner/data-division.js
import { readFileSync as readFileSync2 } from "fs";
var DATA_DIVISION_RE = /^\s*DATA\s+DIVISION\b/i;
var PROCEDURE_DIVISION_RE = /^\s*PROCEDURE\s+DIVISION\b/i;
var SECTION_RE = /^\s*(WORKING-STORAGE|FILE|LINKAGE|LOCAL-STORAGE)\s+SECTION\b/i;
var FIELD_RE = /^\s+(\d{1,2})\s+([A-Z0-9][A-Z0-9-]*)\b(.*)/i;
var PIC_RE = /\bPIC(?:TURE)?\s+(?:IS\s+)?([\w()V./]+)/i;
var USAGE_RE = /\b(?:USAGE\s+(?:IS\s+)?)?(COMP(?:-[1-5])?|BINARY|DISPLAY|PACKED-DECIMAL)\b/i;
var VALUE_RE = /\bVALUE\s+(?:IS\s+)?(['"][^'"]*['"]|[\w-]+)/i;
function parseLines(lines) {
  let inDataDivision = false;
  let currentSection = "WORKING-STORAGE";
  const fields = [];
  for (const line of lines) {
    if (line[6] === "*")
      continue;
    if (PROCEDURE_DIVISION_RE.test(line))
      break;
    if (DATA_DIVISION_RE.test(line)) {
      inDataDivision = true;
      continue;
    }
    if (!inDataDivision)
      continue;
    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toUpperCase();
      continue;
    }
    const fieldMatch = FIELD_RE.exec(line);
    if (!fieldMatch)
      continue;
    const level = parseInt(fieldMatch[1], 10);
    const name = fieldMatch[2].toUpperCase();
    const rest = fieldMatch[3] ?? "";
    const picMatch = PIC_RE.exec(rest);
    const pic = picMatch?.[1]?.toUpperCase() ?? null;
    const usageMatch = USAGE_RE.exec(rest);
    const usage = usageMatch?.[1]?.toUpperCase() ?? null;
    const valueMatch = VALUE_RE.exec(rest);
    const value = valueMatch?.[1] ?? null;
    fields.push({ level, name, pic, usage, value, section: currentSection });
  }
  return {
    fields,
    workingStorage: fields.filter((f) => f.section === "WORKING-STORAGE"),
    linkage: fields.filter((f) => f.section === "LINKAGE"),
    fileSection: fields.filter((f) => f.section === "FILE")
  };
}
function parseDataDivisionFromSource(source) {
  return parseLines(source.split("\n"));
}

// ../parser-core/dist/scanner/detector.js
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
  const content = readFileSync3(filePath, "utf-8");
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
  const base = {
    path: filePath,
    name: basename(filePath),
    type,
    programId,
    copybooks: [...copybooks],
    calls: [...calls],
    lines: content.split("\n").length,
    sizeBytes: stat.size
  };
  if (type === "program" || type === "copybook") {
    return { ...base, dataDivision: parseDataDivisionFromSource(content) };
  }
  return base;
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
import { readFileSync as readFileSync4 } from "fs";
import { basename as basename2 } from "path";
var PARA_HEADER_RE = /^[ \t]{6,8}([A-Z0-9][A-Z0-9-]*)\.[ \t]*$/;
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
var PERFORM_RE = /\bPERFORM\s+([A-Z0-9][A-Z0-9-]*)(?:\s+(?:THRU|THROUGH|UNTIL|VARYING|WITH|TIMES)\b)?/gi;
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
  const content = readFileSync4(filePath, "utf-8");
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
var scanCommand = new Command2("scan").description("Scan a directory for COBOL files and analyze dependencies").argument("[path]", "Directory to scan (default: current directory)").option("--json", "Output raw JSON").action(async (targetPath, options) => {
  const resolvedPath = resolve(targetPath ?? ".");
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
import { resolve as resolve11 } from "path";

// ../ai-runtime/dist/explain.js
import { readFileSync as readFileSync5 } from "fs";
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
    yield* this.streamChat([{ role: "user", content: prompt }], options);
  }
  async *streamChat(messages, options = {}) {
    const stream = await this.client.chat.completions.create({
      model: options.model ?? "gpt-4o",
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
      messages
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
  const sourceCode = readFileSync5(resolvedPath, "utf-8");
  const provider = input2.options?.provider ?? new OpenAIProvider();
  const prompt = buildExplainPrompt(file, sourceCode);
  for await (const chunk of provider.streamCompletion(prompt, input2.options)) {
    if (chunk.text)
      yield chunk.text;
  }
}

// ../ai-runtime/dist/diagrams/flow.js
function nodeId(name) {
  return "N_" + name.replace(/[-@#$]/g, "_");
}
function generateFlowDiagram(flow) {
  const { programId, entryPoint, paragraphs } = flow;
  const title = programId ?? flow.fileName.replace(/\.[^.]+$/, "");
  const paraSet = new Set(paragraphs.map((p) => p.name));
  const externalCalls = /* @__PURE__ */ new Set();
  for (const p of paragraphs) {
    for (const c of p.calls) {
      if (!paraSet.has(c))
        externalCalls.add(c);
    }
  }
  const lines = ["flowchart TD"];
  const shown = paragraphs.slice(0, 40);
  for (const p of shown) {
    const id = nodeId(p.name);
    if (p.name === entryPoint) {
      lines.push(`    ${id}["${p.name}"]:::entry`);
    } else if (/ABEND|ERROR|ABORT/i.test(p.name)) {
      lines.push(`    ${id}["${p.name}"]:::error`);
    } else if (/CLOSE|END|EXIT/i.test(p.name)) {
      lines.push(`    ${id}["${p.name}"]:::close`);
    } else {
      lines.push(`    ${id}["${p.name}"]`);
    }
  }
  if (paragraphs.length > 40) {
    lines.push(`    TRUNCATED["... ${paragraphs.length - 40} more paragraphs"]:::dim`);
  }
  for (const ext of externalCalls) {
    lines.push(`    ${nodeId("EXT_" + ext)}[/"${ext}"/]:::external`);
  }
  lines.push("");
  const shownNames = new Set(shown.map((p) => p.name));
  for (const p of shown) {
    for (const target of p.performs) {
      if (shownNames.has(target)) {
        lines.push(`    ${nodeId(p.name)} --> ${nodeId(target)}`);
      }
    }
    for (const call of p.calls) {
      if (!paraSet.has(call)) {
        lines.push(`    ${nodeId(p.name)} -.-> ${nodeId("EXT_" + call)}`);
      }
    }
  }
  lines.push("");
  lines.push("    classDef entry fill:#00D4FF,color:#000,font-weight:bold,stroke:#0099bb");
  lines.push("    classDef external fill:#f5f5f5,stroke:#999,stroke-dasharray:5 5");
  lines.push("    classDef error fill:#ff6b6b,color:#fff,stroke:#cc0000");
  lines.push("    classDef close fill:#b0c4de,color:#000,stroke:#708090");
  lines.push("    classDef dim fill:#eee,color:#aaa,stroke:#ccc");
  return `# Flow Diagram \u2014 ${title}

\`\`\`mermaid
${lines.join("\n")}
\`\`\`
`;
}

// ../ai-runtime/dist/diagrams/calls.js
function nodeId2(name) {
  return "N_" + name.replace(/[-@#$]/g, "_");
}
function generateCallsDiagram(file) {
  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, "");
  const mainId = nodeId2(progName);
  const lines = ["graph LR"];
  lines.push(`    ${mainId}["${progName}"]:::main`);
  lines.push("");
  if (file.calls.length === 0 && file.copybooks.length === 0) {
    lines.push(`    NONE["No external dependencies"]:::dim`);
  }
  for (const call of file.calls) {
    const id = nodeId2("CALL_" + call);
    lines.push(`    ${id}(["${call}"]):::external`);
    lines.push(`    ${mainId} -->|CALL| ${id}`);
  }
  if (file.calls.length > 0 && file.copybooks.length > 0)
    lines.push("");
  for (const copy of file.copybooks) {
    const id = nodeId2("COPY_" + copy);
    lines.push(`    ${id}[["${copy}"]]:::copybook`);
    lines.push(`    ${mainId} -.-|COPY| ${id}`);
  }
  lines.push("");
  lines.push("    classDef main fill:#00D4FF,color:#000,font-weight:bold,stroke:#0099bb");
  lines.push("    classDef external fill:#98FB98,stroke:#2d8a2d,color:#000");
  lines.push("    classDef copybook fill:#FFD700,stroke:#b8860b,color:#000");
  lines.push("    classDef dim fill:#eee,color:#aaa,stroke:#ccc");
  return `# Call Graph \u2014 ${progName}

\`\`\`mermaid
${lines.join("\n")}
\`\`\`
`;
}

// ../ai-runtime/dist/diagrams/data.js
function nodeId3(name) {
  return "WS_" + name.replace(/[-]/g, "_");
}
function groupByLevel1(fields) {
  const groups = [];
  let current = null;
  for (const f of fields) {
    if (f.name === "FILLER")
      continue;
    if (f.level === 1 || f.level === 77) {
      if (current)
        groups.push(current);
      current = { name: f.name, level: f.level, fields: [] };
    } else if (current && f.level <= 15 && f.pic) {
      current.fields.push(f);
    }
  }
  if (current)
    groups.push(current);
  return groups;
}
function generateDataDiagram(programId, wsFields) {
  if (wsFields.length === 0) {
    return `# Data Structures \u2014 ${programId}

_No WORKING-STORAGE fields found._
`;
  }
  const groups = groupByLevel1(wsFields);
  const withFields = groups.filter((g) => g.fields.length > 0).slice(0, 12);
  if (withFields.length === 0) {
    return `# Data Structures \u2014 ${programId}

_No typed fields (PIC clauses) found in WORKING-STORAGE._
`;
  }
  const lines = ["classDiagram"];
  for (const g of withFields) {
    const id = nodeId3(g.name);
    const stereotype = g.level === 77 ? "<<independent>>" : "<<group>>";
    lines.push(`    class ${id} {`);
    lines.push(`        ${stereotype}`);
    for (const f of g.fields.slice(0, 10)) {
      const usage = f.usage ? ` [${f.usage}]` : "";
      lines.push(`        +${f.name} ${f.pic}${usage}`);
    }
    if (g.fields.length > 10) {
      lines.push(`        ... ${g.fields.length - 10} more fields`);
    }
    lines.push(`    }`);
  }
  const skipped = groups.length - withFields.length;
  const note = skipped > 0 ? `
> _${skipped} group(s) omitted (no PIC fields or limit reached)._` : "";
  return `# Data Structures \u2014 ${programId}

\`\`\`mermaid
${lines.join("\n")}
\`\`\`${note}
`;
}

// ../ai-runtime/dist/agents/diagram.js
import { ChatOpenAI } from "@langchain/openai";
function buildArchPrompt(file, flow, source) {
  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, "");
  const paraList = flow?.paragraphs.map((p) => p.name).join(", ") ?? "unknown";
  const callList = file.calls.join(", ") || "none";
  const copyList = file.copybooks.join(", ") || "none";
  return `You are a software architect creating an architecture overview diagram for a COBOL program.

Generate a Mermaid flowchart diagram (use "flowchart TD" syntax) that shows:
- The program as the central component
- Key processing phases (not individual paragraphs \u2014 group them semantically)
- External systems/programs it calls
- Data inputs and outputs it accesses
- The general data flow at a high level

## Program Info
- Name: ${progName}
- External calls: ${callList}
- Copybooks: ${copyList}
- Paragraphs: ${paraList}

## Source (first 3000 chars)
\`\`\`cobol
${source.slice(0, 3e3)}
\`\`\`

Rules:
- Use flowchart TD syntax only
- Keep it high-level (5\u201312 nodes max)
- Node IDs must be simple alphanumeric (no dashes)
- Include classDef styles
- Return ONLY the Mermaid code block \u2014 no explanations, no text before or after`;
}
async function generateArchDiagram(file, source, flow, options = {}) {
  const llm = new ChatOpenAI({
    model: options.model ?? "gpt-4o",
    temperature: 0
  });
  const response = await llm.invoke(buildArchPrompt(file, flow, source));
  const content = response.content;
  const progName = file.programId ?? file.name.replace(/\.[^.]+$/, "");
  const mermaidMatch = content.match(/```(?:mermaid)?\s*([\s\S]+?)\s*```/);
  const diagram = mermaidMatch ? mermaidMatch[1].trim() : content.trim();
  return `# Architecture Diagram \u2014 ${progName}

\`\`\`mermaid
${diagram}
\`\`\`
`;
}

// ../ai-runtime/dist/agents/explainer.js
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI2 } from "@langchain/openai";
import { readFileSync as readFileSync6 } from "fs";
import { resolve as resolve3 } from "path";
var ExplainerAnnotation = Annotation.Root({
  filePath: Annotation(),
  cobolFile: Annotation(),
  sourceCode: Annotation(),
  explanation: Annotation(),
  error: Annotation()
});
function buildGraph(options) {
  const llm = new ChatOpenAI2({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph(ExplainerAnnotation).addNode("parse", async (state) => {
    try {
      const path = resolve3(state.filePath);
      return {
        cobolFile: analyzeFile(path),
        sourceCode: readFileSync6(path, "utf-8")
      };
    } catch (e) {
      return { error: e.message };
    }
  }).addNode("generate", async (state) => {
    if (state.error || !state.cobolFile || !state.sourceCode)
      return {};
    try {
      const prompt = buildExplainPrompt(state.cobolFile, state.sourceCode);
      const response = await llm.invoke(prompt);
      return { explanation: response.content };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START, "parse").addEdge("parse", "generate").addEdge("generate", END).compile();
}
async function runExplainerAgent(filePath, options = {}) {
  const graph = buildGraph(options);
  const result = await graph.invoke({ filePath });
  return { explanation: result.explanation, error: result.error };
}

// ../ai-runtime/dist/agents/dependency.js
import { Annotation as Annotation2, END as END2, START as START2, StateGraph as StateGraph2 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI3 } from "@langchain/openai";

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
function buildGraph2(options) {
  const llm = new ChatOpenAI3({
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
  const graph = buildGraph2(options);
  const result = await graph.invoke({ rootPath, targetProgram });
  return { report: result.report, error: result.error };
}

// ../ai-runtime/dist/agents/modernization.js
import { Annotation as Annotation3, END as END3, START as START3, StateGraph as StateGraph3 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI4 } from "@langchain/openai";
import { readFileSync as readFileSync7 } from "fs";
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
function buildGraph3(options) {
  const llm = new ChatOpenAI4({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph3(ModernizationAnnotation).addNode("analyze", async (state) => {
    try {
      const path = resolve4(state.filePath);
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
      const prompt = buildModernizationPrompt(state.cobolFile, state.sourceCode, state.flow, state.targetLanguage);
      const response = await llm.invoke(prompt);
      return { plan: response.content };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START3, "analyze").addEdge("analyze", "generate").addEdge("generate", END3).compile();
}
async function runModernizationAgent(filePath, targetLanguage = "typescript", options = {}) {
  const graph = buildGraph3(options);
  const result = await graph.invoke({ filePath, targetLanguage });
  return { plan: result.plan, error: result.error };
}

// ../ai-runtime/dist/agents/docs.js
import { Annotation as Annotation4, END as END4, START as START4, StateGraph as StateGraph4 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI5 } from "@langchain/openai";
import { readFileSync as readFileSync8 } from "fs";
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
function buildGraph4(options) {
  const llm = new ChatOpenAI5({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph4(DocsAnnotation).addNode("parse", async (state) => {
    try {
      const path = resolve5(state.filePath);
      const cobolFile = analyzeFile(path);
      const sourceCode = readFileSync8(path, "utf-8");
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
  const graph = buildGraph4(options);
  const result = await graph.invoke({ filePath });
  return { documentation: result.documentation, error: result.error };
}

// ../ai-runtime/dist/agents/api-generator.js
import { Annotation as Annotation5, END as END5, START as START5, StateGraph as StateGraph5 } from "@langchain/langgraph";
import { ChatOpenAI as ChatOpenAI6 } from "@langchain/openai";
import { readFileSync as readFileSync9 } from "fs";
import { resolve as resolve6 } from "path";

// ../ai-runtime/dist/prompts/api-generator.js
function buildApiGeneratorPrompt(file, sourceCode, flow, framework) {
  const flowSection = flow ? `
Execution flow \u2014 entry: ${flow.entryPoint ?? "unknown"}, paragraphs: ${flow.paragraphs.map((p) => p.name).join(" \u2192 ")}
` : "";
  return `You are a senior software architect. Convert the COBOL program below into a production-ready ${framework} REST API.

## COBOL Program
- Program ID: ${file.programId ?? file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(", ") || "none"}
- External calls: ${file.calls.join(", ") || "none"}
${flowSection}
\`\`\`cobol
${sourceCode}
\`\`\`

## Output Requirements
Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:

{
  "programName": "<lowercase program name, e.g. payroll>",
  "description": "<one sentence describing what this API does>",
  "endpoints": [
    {
      "method": "POST|GET|PUT|DELETE",
      "path": "/<resource>/<action>",
      "description": "<what this endpoint does>"
    }
  ],
  "files": {
    "<name>.dto.ts": "<full TypeScript NestJS DTO file content>",
    "<name>.service.ts": "<full TypeScript NestJS service file content>",
    "<name>.controller.ts": "<full TypeScript NestJS controller file content>",
    "<name>.module.ts": "<full TypeScript NestJS module file content>"
  }
}

## Rules
- Map each major COBOL paragraph (or logical group) to a REST endpoint
- Map WORKING-STORAGE numeric fields to TypeScript number types
- Map WORKING-STORAGE string/alphanumeric fields to string types
- Replace COBOL CALL targets with injected NestJS services (stub them with TODO comments)
- COPY dependencies become comments referencing the shared types
- Use class-validator decorators in DTOs (@IsNumber, @IsString, @IsOptional, etc.)
- Use @nestjs/common decorators (@Controller, @Post, @Get, @Body, @Injectable, etc.)
- Use @nestjs/swagger decorators (@ApiProperty, @ApiOperation, @ApiResponse)
- Keep logic faithful to the original COBOL business rules
- Add JSDoc comments explaining each method's COBOL origin`;
}

// ../ai-runtime/dist/agents/api-generator.js
var ApiGeneratorAnnotation = Annotation5.Root({
  filePath: Annotation5(),
  framework: Annotation5(),
  cobolFile: Annotation5(),
  sourceCode: Annotation5(),
  flow: Annotation5(),
  result: Annotation5(),
  error: Annotation5()
});
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (block?.[1]) {
    try {
      return JSON.parse(block[1]);
    } catch {
    }
  }
  const brace = text.match(/\{[\s\S]+\}/);
  if (brace?.[0]) {
    return JSON.parse(brace[0]);
  }
  throw new Error("Could not extract JSON from LLM response");
}
function buildGraph5(options) {
  const llm = new ChatOpenAI6({
    model: options.model ?? "gpt-4o",
    temperature: options.temperature ?? 0
  });
  return new StateGraph5(ApiGeneratorAnnotation).addNode("analyze", async (state) => {
    try {
      const path = resolve6(state.filePath);
      const cobolFile = analyzeFile(path);
      const sourceCode = readFileSync9(path, "utf-8");
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
      const prompt = buildApiGeneratorPrompt(state.cobolFile, state.sourceCode, state.flow, state.framework);
      const response = await llm.invoke(prompt);
      const parsed = extractJson(response.content);
      return { result: parsed };
    } catch (e) {
      return { error: e.message };
    }
  }).addEdge(START5, "analyze").addEdge("analyze", "generate").addEdge("generate", END5).compile();
}
async function runApiGeneratorAgent(filePath, framework = "nestjs", options = {}) {
  const graph = buildGraph5(options);
  const state = await graph.invoke({ filePath, framework });
  return { result: state.result, error: state.error };
}

// ../ai-runtime/dist/agents/orchestrator/graph.js
import { END as END6, START as START6, StateGraph as StateGraph6 } from "@langchain/langgraph";

// ../ai-runtime/dist/agents/orchestrator/state.js
import { Annotation as Annotation6 } from "@langchain/langgraph";
var OrchestratorAnnotation = Annotation6.Root({
  rootPath: Annotation6(),
  scanResult: Annotation6(),
  callDeps: Annotation6(),
  copybookDeps: Annotation6(),
  dependencyReport: Annotation6(),
  explanations: Annotation6(),
  finalReport: Annotation6(),
  error: Annotation6(),
  options: Annotation6()
});

// ../ai-runtime/dist/agents/orchestrator/graph.js
var MAX_EXPLAIN_FILES = 5;
async function scanNode(state) {
  try {
    const scanResult = await scanDirectory(state.rootPath);
    const callDeps = buildCallDependencies(scanResult.files);
    const copybookDeps = buildCopybookDependencies(scanResult.files);
    return { scanResult, callDeps, copybookDeps };
  } catch (e) {
    return { error: e.message };
  }
}
async function dependencyNode(state) {
  if (state.error || !state.scanResult)
    return {};
  try {
    const { report } = await runDependencyAgent(state.rootPath, void 0, state.options ?? {});
    return { dependencyReport: report };
  } catch (e) {
    return { error: e.message };
  }
}
async function explainNode(state) {
  if (state.error || !state.scanResult)
    return {};
  try {
    const programs = state.scanResult.files.filter((f) => f.type === "program").slice(0, MAX_EXPLAIN_FILES);
    const explanations = [];
    for (const program2 of programs) {
      const { explanation } = await runExplainerAgent(program2.path, state.options ?? {});
      if (explanation) {
        explanations.push({ file: program2.name, explanation });
      }
    }
    return { explanations };
  } catch (e) {
    return { error: e.message };
  }
}
function docsNode(state) {
  if (state.error || !state.scanResult)
    return {};
  const { scanResult, callDeps, copybookDeps, dependencyReport, explanations } = state;
  const { stats } = scanResult;
  const lines = [];
  lines.push("# OpenCobol Analysis Report");
  lines.push("");
  lines.push(`**Root:** \`${scanResult.rootPath}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Type | Count |`);
  lines.push(`|---|---|`);
  lines.push(`| Programs | ${stats.programs} |`);
  lines.push(`| Copybooks | ${stats.copybooks} |`);
  lines.push(`| JCL | ${stats.jcl} |`);
  lines.push(`| Total lines | ${stats.totalLines.toLocaleString()} |`);
  lines.push("");
  lines.push("## Programs Found");
  lines.push("");
  const programs = scanResult.files.filter((f) => f.type === "program");
  for (const p of programs) {
    const calls = p.calls.length > 0 ? ` \u2014 calls: ${p.calls.join(", ")}` : "";
    const copies = p.copybooks.length > 0 ? ` \u2014 copies: ${p.copybooks.join(", ")}` : "";
    lines.push(`- **${p.programId ?? p.name}** (\`${p.name}\`, ${p.lines} lines)${calls}${copies}`);
  }
  lines.push("");
  if (callDeps && callDeps.length > 0) {
    lines.push("## Call Dependencies");
    lines.push("");
    for (const dep of callDeps) {
      const callers = dep.calledBy.map((c) => c.file).join(", ");
      lines.push(`- \`${dep.target}\` \u2190 called by: ${callers}`);
    }
    lines.push("");
  }
  if (copybookDeps && copybookDeps.length > 0) {
    lines.push("## Copybook Usage");
    lines.push("");
    for (const dep of copybookDeps) {
      lines.push(`- \`${dep.copybook}\` \u2190 used by: ${dep.usedBy.join(", ")}`);
    }
    lines.push("");
  }
  if (dependencyReport) {
    lines.push("## Dependency Analysis (AI)");
    lines.push("");
    lines.push(dependencyReport);
    lines.push("");
  }
  if (explanations && explanations.length > 0) {
    lines.push("## Program Explanations");
    lines.push("");
    for (const { file, explanation } of explanations) {
      lines.push(`### ${file}`);
      lines.push("");
      lines.push(explanation);
      lines.push("");
    }
  }
  return { finalReport: lines.join("\n") };
}
function buildOrchestratorGraph() {
  return new StateGraph6(OrchestratorAnnotation).addNode("scan", scanNode).addNode("dependency", dependencyNode).addNode("explain", explainNode).addNode("docs", docsNode).addEdge(START6, "scan").addEdge("scan", "dependency").addEdge("dependency", "explain").addEdge("explain", "docs").addEdge("docs", END6).compile();
}

// ../ai-runtime/dist/agents/orchestrator/index.js
async function runOrchestratorAgent(rootPath, options = {}) {
  const graph = buildOrchestratorGraph();
  const result = await graph.invoke({ rootPath, options });
  return { finalReport: result.finalReport, error: result.error };
}

// ../ai-runtime/dist/agents/code-agent/index.js
import { mkdirSync as mkdirSync6 } from "fs";
import { resolve as resolve10 } from "path";

// ../ai-runtime/dist/agents/code-agent/graph.js
import { END as END7, START as START7, StateGraph as StateGraph7 } from "@langchain/langgraph";

// ../ai-runtime/dist/agents/code-agent/state.js
import { Annotation as Annotation7 } from "@langchain/langgraph";
var CodeAgentAnnotation = Annotation7.Root({
  filePath: Annotation7(),
  targetLanguage: Annotation7(),
  outputDir: Annotation7(),
  options: Annotation7(),
  cobolMetadata: Annotation7(),
  cobolSource: Annotation7(),
  flowResult: Annotation7(),
  ragContexts: Annotation7({ value: (_a, b) => b, default: () => [] }),
  businessRules: Annotation7({ value: (_a, b) => b, default: () => [] }),
  testFiles: Annotation7({ value: (_a, b) => b, default: () => [] }),
  sourceFiles: Annotation7({ value: (_a, b) => b, default: () => [] }),
  validationResult: Annotation7(),
  iteration: Annotation7({ value: (_a, b) => b, default: () => 0 }),
  writtenPaths: Annotation7({ value: (_a, b) => b, default: () => [] }),
  error: Annotation7()
});

// ../ai-runtime/dist/agents/code-agent/nodes/analyze.js
import { readFileSync as readFileSync10 } from "fs";
import { resolve as resolve7 } from "path";
async function analyzeNode(state) {
  try {
    const path = resolve7(state.filePath);
    const cobolMetadata = analyzeFile(path);
    const cobolSource = readFileSync10(path, "utf-8");
    let flowResult = void 0;
    try {
      flowResult = extractFlow(path);
    } catch {
    }
    return { cobolMetadata, cobolSource, flowResult };
  } catch (e) {
    return { error: e.message };
  }
}

// ../rag-engine/dist/chunker/cobol.js
import { readFileSync as readFileSync11 } from "fs";
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
var MAX_CHUNK_TOKENS = 6e3;
var CHARS_PER_TOKEN = 4;
function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
function splitIntoSubChunks(lines, maxTokens) {
  const chunks = [];
  let current = [];
  let currentTokens = 0;
  for (const line of lines) {
    const lineTokens = estimateTokens(line);
    if (currentTokens + lineTokens > maxTokens && current.length > 0) {
      chunks.push(current.join("\n"));
      current = [];
      currentTokens = 0;
    }
    current.push(line);
    currentTokens += lineTokens;
  }
  if (current.length > 0)
    chunks.push(current.join("\n"));
  return chunks;
}
function buildProgramHeader(filePath, sourceLines) {
  const meta = analyzeFile(filePath);
  const procIdx = sourceLines.findIndex((l) => /\bPROCEDURE\s+DIVISION\b/i.test(l));
  const dataDivLines = sourceLines.slice(0, procIdx + 1).filter((l) => l.trim() && l[6] !== "*");
  const cappedLines = dataDivLines.slice(0, 150);
  const truncated = dataDivLines.length > 150;
  return [
    `[COBOL Program: ${meta.programId ?? basename3(filePath)}]`,
    `File: ${basename3(filePath)}`,
    `Copybooks: ${meta.copybooks.join(", ") || "none"}`,
    `External calls: ${meta.calls.join(", ") || "none"}`,
    truncated ? `[DATA DIVISION truncated at 150 lines \u2014 ${dataDivLines.length} total]` : "",
    "",
    cappedLines.join("\n").trim()
  ].filter((l) => l !== "").join("\n");
}
function extractParagraphSource(sourceLines, lineStart, lineEnd) {
  return sourceLines.slice(lineStart, lineEnd + 1).join("\n").trimEnd();
}
function chunkCopybookFile(filePath) {
  const source = readFileSync11(filePath, "utf-8");
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
  const source = readFileSync11(filePath, "utf-8");
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
    const header = [
      `[COBOL Program: ${meta.programId ?? basename3(filePath)} | Paragraph: ${para.name}]`,
      `Performs: ${para.performs.join(", ") || "none"}`,
      `Calls: ${para.calls.join(", ") || "none"}`,
      ""
    ].join("\n");
    const fullContent = header + code;
    if (estimateTokens(fullContent) <= MAX_CHUNK_TOKENS) {
      chunks.push({
        id: chunkId(filePath, `para::${para.name}`),
        content: fullContent,
        payload: {
          file: basename3(filePath),
          programId: meta.programId,
          chunkType: "paragraph",
          paragraphName: para.name,
          performs: para.performs,
          calls: para.calls,
          content: fullContent,
          lineStart: absStart,
          lineEnd: absEnd
        }
      });
    } else {
      const codeLines = code.split("\n");
      const subChunks = splitIntoSubChunks(codeLines, MAX_CHUNK_TOKENS - estimateTokens(header));
      subChunks.forEach((sub, idx) => {
        const content = header + sub;
        chunks.push({
          id: chunkId(filePath, `para::${para.name}::${idx}`),
          content,
          payload: {
            file: basename3(filePath),
            programId: meta.programId,
            chunkType: "paragraph",
            paragraphName: `${para.name} (part ${idx + 1}/${subChunks.length})`,
            performs: para.performs,
            calls: para.calls,
            content,
            lineStart: absStart,
            lineEnd: absEnd
          }
        });
      });
    }
  }
  return chunks;
}
function chunkCobolFile(filePath, type = "program") {
  if (type === "copybook")
    return chunkCopybookFile(filePath);
  return chunkProgramFile(filePath);
}

// ../rag-engine/dist/chunker/jcl.js
import { readFileSync as readFileSync12 } from "fs";
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
  const source = readFileSync12(filePath, "utf-8");
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
    this.client = new QdrantClient({ url, checkCompatibility: false });
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
var MODEL_DIMENSIONS = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "text-embedding-ada-002": 1536
};
var OpenAIEmbeddings = class {
  model;
  dimensions;
  client;
  constructor(apiKey, model) {
    this.model = model ?? process.env["OPENAI_EMBEDDING_MODEL"] ?? "text-embedding-3-small";
    this.dimensions = MODEL_DIMENSIONS[this.model] ?? 1536;
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
import { readFileSync as readFileSync13, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2, existsSync as existsSync2, statSync as statSync3 } from "fs";
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
    return JSON.parse(readFileSync13(path, "utf-8"));
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
import OpenAI3 from "openai";
function isLikelyNonEnglish(text) {
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) ?? []).length / text.length;
  if (nonAsciiRatio > 0.05)
    return true;
  const ptEsKeywords = /\b(como|funciona|qual|quais|onde|quando|calculo|cálculo|como|qué|cómo|wie|funktioniert|comment|fonctionne)\b/i;
  return ptEsKeywords.test(text);
}
async function translateToEnglish(query) {
  try {
    const client = new OpenAI3({ apiKey: process.env["OPENAI_API_KEY"] });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: "Translate the following query to English for searching a COBOL codebase. Return only the translated text, nothing else."
        },
        { role: "user", content: query }
      ]
    });
    return res.choices[0]?.message?.content?.trim() ?? query;
  } catch {
    return query;
  }
}
async function retrieve(query, options = {}) {
  const provider = options.embeddingProvider ?? new OpenAIEmbeddings();
  const store = new QdrantStore(options.qdrantUrl ?? process.env["QDRANT_URL"] ?? "http://localhost:6333", options.collection ?? "opencobol");
  const shouldTranslate = options.translateQuery !== false && isLikelyNonEnglish(query);
  const embeddingQuery = shouldTranslate ? await translateToEnglish(query) : query;
  const [queryVector] = await provider.embed([embeddingQuery]);
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
function buildRagSystemPrompt(contexts) {
  const contextBlock = contexts.map((c) => c.formattedChunk).join("\n\n");
  return `You are an expert COBOL analyst with deep knowledge of legacy systems. Answer questions based on the COBOL code excerpts below. Be concise and practical. You have access to the conversation history \u2014 use it to give contextually coherent answers. If the answer is not in the provided context, say so clearly. IMPORTANT: Always respond in the same language the user used in their question. If the question is in Portuguese, answer in Portuguese. If in English, answer in English. Never switch languages mid-conversation.

## Relevant Code Excerpts

${contextBlock}`;
}

// ../ai-runtime/dist/agents/code-agent/nodes/enrich-rag.js
async function enrichRagNode(state) {
  if (state.error)
    return {};
  try {
    const programId = state.cobolMetadata?.programId ?? state.cobolMetadata?.name ?? "unknown";
    const query = `${programId} data structures business rules calculations`;
    const ragContexts = await retrieve(query, {
      qdrantUrl: state.options?.qdrantUrl ?? process.env["QDRANT_URL"] ?? "http://localhost:6333",
      collection: state.options?.collection ?? process.env["QDRANT_COLLECTION"] ?? "opencobol",
      topK: 10
    });
    return { ragContexts };
  } catch {
    return { ragContexts: [] };
  }
}

// ../ai-runtime/dist/agents/code-agent/nodes/extract-rules.js
import { ChatOpenAI as ChatOpenAI7 } from "@langchain/openai";

// ../ai-runtime/dist/agents/code-agent/prompts/extract-rules.js
function buildExtractRulesPrompt(file, sourceCode, flow, ragContexts) {
  const flowSection = flow ? `
## Execution Flow
Entry point: ${flow.entryPoint ?? "unknown"}
Paragraphs: ${flow.paragraphs.map((p) => p.name).join(", ")}
` : "";
  const ragSection = ragContexts.length > 0 ? `
## Related Codebase Context
${ragContexts.map((c) => c.formattedChunk).join("\n\n")}
` : "";
  return `You are a senior COBOL analyst. Extract the business rules from the following COBOL program.

## Program
- ID: ${file.programId ?? file.name}
- Lines: ${file.lines}
- Copybooks: ${file.copybooks.join(", ") || "none"}
- External calls: ${file.calls.join(", ") || "none"}
${flowSection}${ragSection}
## Source Code
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object (no markdown, no explanation \u2014 only JSON) with this exact shape:
{
  "rules": [
    {
      "id": "RULE-ID-UPPERCASE",
      "name": "Human readable name",
      "description": "What this rule does in plain English",
      "sourceLocation": "PARAGRAPH-NAME or section name",
      "inputs": ["WS-FIELD-NAME"],
      "outputs": ["WS-RESULT-FIELD"],
      "invariants": ["output >= 0", "optional testable property"]
    }
  ]
}

Rules:
- One entry per distinct business rule (not per paragraph \u2014 a paragraph may contain multiple rules)
- Ignore infrastructure logic (file I/O setup, display output, program initialization)
- Focus on calculations, validations, and data transformations
- invariants must be simple boolean expressions suitable for unit test assertions
- Return at least one rule, even for simple programs`;
}

// ../ai-runtime/dist/agents/code-agent/nodes/extract-rules.js
function extractJson2(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (block?.[1]) {
    try {
      return JSON.parse(block[1]);
    } catch {
    }
  }
  const brace = text.match(/\{[\s\S]+\}/);
  if (brace?.[0])
    return JSON.parse(brace[0]);
  throw new Error("Could not extract JSON from LLM response");
}
async function extractRulesNode(state, llm) {
  if (state.error || !state.cobolMetadata || !state.cobolSource)
    return {};
  try {
    const model = llm ?? new ChatOpenAI7({
      model: state.options?.model ?? "gpt-4o",
      temperature: state.options?.temperature ?? 0
    });
    const prompt = buildExtractRulesPrompt(state.cobolMetadata, state.cobolSource, state.flowResult, state.ragContexts);
    const response = await model.invoke(prompt);
    const parsed = extractJson2(response.content);
    return { businessRules: parsed.rules ?? [] };
  } catch (e) {
    return { error: e.message };
  }
}

// ../ai-runtime/dist/agents/code-agent/nodes/gen-tests.js
import { ChatOpenAI as ChatOpenAI8 } from "@langchain/openai";

// ../ai-runtime/dist/agents/code-agent/prompts/gen-tests.js
function buildGenTestsPrompt(programId, rules, targetLanguage) {
  const rulesJson = JSON.stringify(rules, null, 2);
  if (targetLanguage === "typescript") {
    return `You are a TypeScript test engineer. Generate Vitest unit tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Generate a single TypeScript test file using Vitest. Requirements:
- Import the service as: import { ${toPascalCase(programId)}Service } from './${programId.toLowerCase()}.service.js'
- One \`describe\` block per business rule (use rule.name as the label)
- One \`it\` block per invariant in rule.invariants
- If no invariants, write at least one test that validates the described behavior
- Use \`expect\` assertions
- Do NOT import vitest \u2014 use the global API (describe, it, expect)
- Each test must call a real method on the service (e.g., service.calcNetPay({ grossPay: 1000, taxRate: 0.2 }))
- Method names should be camelCase derived from the rule.id

Return ONLY the TypeScript code, no markdown fences, no explanation.`;
  }
  if (targetLanguage === "java") {
    return `You are a Java test engineer. Generate JUnit 5 unit tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Generate a single Java test class. Requirements:
- Class name: ${toPascalCase(programId)}ServiceTest
- One nested @Nested class per business rule
- One @Test method per invariant
- Use AssertJ (assertThat) for assertions
- Service class: ${toPascalCase(programId)}Service

Return ONLY the Java code, no markdown fences, no explanation.`;
  }
  if (targetLanguage === "python") {
    return `You are a Python test engineer. Generate pytest tests for the following business rules extracted from a COBOL program.

## Program: ${programId}

## Business Rules
${rulesJson}

Requirements:
- One test class per business rule
- One test method per invariant
- Import the service as: from ${programId.toLowerCase()}_service import ${toPascalCase(programId)}Service

Return ONLY the Python code, no markdown fences, no explanation.`;
  }
  return `Generate unit tests for the following business rules from COBOL program ${programId} in ${targetLanguage}:
${rulesJson}`;
}
function toPascalCase(s) {
  return s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
}

// ../ai-runtime/dist/agents/code-agent/nodes/gen-tests.js
async function genTestsNode(state, llm) {
  if (state.error || !state.cobolMetadata || state.businessRules.length === 0)
    return {};
  try {
    const model = llm ?? new ChatOpenAI8({
      model: state.options?.model ?? "gpt-4o",
      temperature: state.options?.temperature ?? 0
    });
    const programId = (state.cobolMetadata.programId ?? state.cobolMetadata.name).toLowerCase().replace(/[^a-z0-9]/g, "-");
    const prompt = buildGenTestsPrompt(programId, state.businessRules, state.targetLanguage);
    const response = await model.invoke(prompt);
    const content = response.content;
    const ext = langExt(state.targetLanguage);
    const testFiles = [
      { path: `${programId}.test.${ext}`, content, language: state.targetLanguage }
    ];
    return { testFiles };
  } catch (e) {
    return { error: e.message };
  }
}
function langExt(lang) {
  const map = { typescript: "ts", java: "java", python: "py", go: "go" };
  return map[lang] ?? "ts";
}

// ../ai-runtime/dist/agents/code-agent/nodes/gen-code.js
import { ChatOpenAI as ChatOpenAI9 } from "@langchain/openai";

// ../ai-runtime/dist/agents/code-agent/prompts/gen-code.js
function buildGenCodePrompt(file, sourceCode, flow, rules, targetLanguage) {
  const rulesSection = JSON.stringify(rules, null, 2);
  const flowSection = flow ? `Entry point: ${flow.entryPoint ?? "unknown"}
Paragraphs: ${flow.paragraphs.map((p) => p.name).join(", ")}` : "Not available";
  const programId = file.programId ?? file.name.replace(/\.[^.]+$/, "");
  if (targetLanguage === "typescript") {
    return `You are a senior TypeScript/NestJS engineer migrating a COBOL program.

## COBOL Program
- ID: ${programId}
- Lines: ${file.lines}
- Flow: ${flowSection}

## Business Rules to Implement
${rulesSection}

## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Generate a complete NestJS module with these files. Return a JSON object with this exact shape:
{
  "files": {
    "${programId.toLowerCase()}.dto.ts": "...full file content...",
    "${programId.toLowerCase()}.service.ts": "...full file content...",
    "${programId.toLowerCase()}.controller.ts": "...full file content...",
    "${programId.toLowerCase()}.module.ts": "...full file content..."
  }
}

Requirements:
- DTO: use class-validator decorators (@IsNumber, @IsString, etc.)
- Service: one method per business rule, named after rule.id in camelCase
- Controller: POST endpoints mapping to service methods, with @ApiOperation Swagger decorator
- Module: wire DTO, Service, Controller together
- Use strict TypeScript (no any, explicit return types)
- No imports from external packages beyond @nestjs/*, class-validator, class-transformer
- Return ONLY the JSON object, no markdown, no explanation`;
  }
  if (targetLanguage === "java") {
    return `You are a senior Java/Spring Boot engineer migrating a COBOL program.

## COBOL Program: ${programId}
## Business Rules
${rulesSection}
## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object:
{
  "files": {
    "src/main/java/${programId.toLowerCase()}/${toPascalCase2(programId)}Dto.java": "...",
    "src/main/java/${programId.toLowerCase()}/${toPascalCase2(programId)}Service.java": "...",
    "src/main/java/${programId.toLowerCase()}/${toPascalCase2(programId)}Controller.java": "..."
  }
}

Requirements: Spring Boot 3, Java 21, use BigDecimal for monetary values, @RestController, @Service.
Return ONLY the JSON, no markdown.`;
  }
  if (targetLanguage === "python") {
    return `You are a senior Python/FastAPI engineer migrating a COBOL program.

## COBOL Program: ${programId}
## Business Rules
${rulesSection}
## Source Reference
\`\`\`cobol
${sourceCode}
\`\`\`

Return a JSON object:
{
  "files": {
    "${programId.toLowerCase()}_schemas.py": "...",
    "${programId.toLowerCase()}_service.py": "...",
    "${programId.toLowerCase()}_router.py": "..."
  }
}

Requirements: FastAPI, Pydantic v2, use Decimal for monetary values.
Return ONLY the JSON, no markdown.`;
  }
  return `Migrate COBOL program ${programId} to ${targetLanguage}. Business rules: ${rulesSection}. Source: ${sourceCode}`;
}
function toPascalCase2(s) {
  return s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
}

// ../ai-runtime/dist/agents/code-agent/nodes/gen-code.js
function extractJson3(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (block?.[1]) {
    try {
      return JSON.parse(block[1]);
    } catch {
    }
  }
  const brace = text.match(/\{[\s\S]+\}/);
  if (brace?.[0])
    return JSON.parse(brace[0]);
  throw new Error("Could not extract JSON from LLM response");
}
async function genCodeNode(state, llm) {
  if (state.error || !state.cobolMetadata || !state.cobolSource)
    return {};
  if (state.targetLanguage === "cobol") {
    return { error: "COBOL generation not yet implemented" };
  }
  try {
    const model = llm ?? new ChatOpenAI9({
      model: state.options?.model ?? "gpt-4o",
      temperature: state.options?.temperature ?? 0
    });
    const prompt = buildGenCodePrompt(state.cobolMetadata, state.cobolSource, state.flowResult, state.businessRules, state.targetLanguage);
    const response = await model.invoke(prompt);
    const parsed = extractJson3(response.content);
    const sourceFiles = Object.entries(parsed.files ?? {}).map(([path, content]) => ({
      path,
      content,
      language: state.targetLanguage
    }));
    return { sourceFiles };
  } catch (e) {
    return { error: e.message };
  }
}

// ../ai-runtime/dist/agents/code-agent/nodes/validate.js
import { spawnSync } from "child_process";
import { mkdirSync as mkdirSync3, writeFileSync as writeFileSync3, rmSync } from "fs";
import { join as join4 } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
async function validateNode(state) {
  if (state.error)
    return {};
  if (state.options?.validate === false) {
    return {
      validationResult: { passed: true, testCount: 0, passCount: 0, failCount: 0, errors: [] }
    };
  }
  if (state.targetLanguage !== "typescript") {
    return {
      validationResult: {
        passed: true,
        testCount: 0,
        passCount: 0,
        failCount: 0,
        errors: [`Validation not implemented for ${state.targetLanguage} \u2014 skipped`]
      }
    };
  }
  const tmpDir = join4(tmpdir(), `opencobol-validate-${randomUUID()}`);
  try {
    mkdirSync3(tmpDir, { recursive: true });
    for (const file of [...state.sourceFiles, ...state.testFiles]) {
      const filePath = join4(tmpDir, file.path);
      mkdirSync3(join4(tmpDir, file.path.split("/").slice(0, -1).join("/")), { recursive: true });
      writeFileSync3(filePath, file.content, "utf-8");
    }
    writeFileSync3(join4(tmpDir, "package.json"), JSON.stringify({ type: "module", dependencies: { "@nestjs/common": "*", "class-validator": "*" } }));
    writeFileSync3(join4(tmpDir, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        noEmit: true
      }
    }));
    const tscResult = spawnSync("npx", ["tsc", "--noEmit"], {
      cwd: tmpDir,
      encoding: "utf-8",
      timeout: 3e4
    });
    if (tscResult.status !== 0) {
      const errors = (tscResult.stdout + tscResult.stderr).split("\n").filter(Boolean).slice(0, 20);
      return {
        validationResult: { passed: false, testCount: 0, passCount: 0, failCount: errors.length, errors }
      };
    }
    const vitestResult = spawnSync("npx", ["vitest", "run", "--reporter", "json", "--outputFile", "test-results.json"], { cwd: tmpDir, encoding: "utf-8", timeout: 6e4 });
    const validationResult = parseVitestOutput(vitestResult.stdout, vitestResult.stderr);
    return { validationResult };
  } catch (e) {
    return {
      validationResult: {
        passed: false,
        testCount: 0,
        passCount: 0,
        failCount: 1,
        errors: [e.message]
      }
    };
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
    }
  }
}
function parseVitestOutput(stdout, stderr) {
  try {
    const json = JSON.parse(stdout);
    const testCount = json.numTotalTests ?? 0;
    const passCount = json.numPassedTests ?? 0;
    const failCount = json.numFailedTests ?? 0;
    const errors = [];
    if (json.testResults) {
      for (const suite of json.testResults) {
        for (const test of suite.testResults ?? []) {
          if (test.status === "failed") {
            errors.push(`${test.fullName}: ${test.failureMessages?.join(" ")}`);
          }
        }
      }
    }
    return { passed: failCount === 0, testCount, passCount, failCount, errors };
  } catch {
    const lines = (stdout + stderr).split("\n").filter(Boolean).slice(0, 20);
    return { passed: false, testCount: 0, passCount: 0, failCount: 1, errors: lines };
  }
}

// ../ai-runtime/dist/agents/code-agent/nodes/fix-code.js
import { ChatOpenAI as ChatOpenAI10 } from "@langchain/openai";

// ../ai-runtime/dist/agents/code-agent/prompts/fix-code.js
function buildFixCodePrompt(sourceFiles, testFiles, validation, targetLanguage) {
  const errorsBlock = validation.errors.join("\n");
  const sourceBlock = sourceFiles.map((f) => `### ${f.path}
\`\`\`${targetLanguage}
${f.content}
\`\`\``).join("\n\n");
  const testBlock = testFiles.map((f) => `### ${f.path}
\`\`\`${targetLanguage}
${f.content}
\`\`\``).join("\n\n");
  return `You are a ${targetLanguage} engineer fixing compilation and test errors.

## Errors (${validation.failCount} of ${validation.testCount} tests failed)
\`\`\`
${errorsBlock}
\`\`\`

## Current Source Files
${sourceBlock}

## Test Files (do NOT modify these)
${testBlock}

Fix ALL errors in the source files. Return a JSON object with the same shape as before:
{
  "files": {
    "<filename>": "...corrected full content..."
  }
}

Rules:
- Include ALL source files in the response, even unchanged ones
- Do NOT modify test files
- Fix every error listed above
- Preserve all business logic \u2014 only fix compilation/type errors and test failures
- Return ONLY the JSON, no markdown, no explanation`;
}

// ../ai-runtime/dist/agents/code-agent/nodes/fix-code.js
function extractJson4(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (block?.[1]) {
    try {
      return JSON.parse(block[1]);
    } catch {
    }
  }
  const brace = text.match(/\{[\s\S]+\}/);
  if (brace?.[0])
    return JSON.parse(brace[0]);
  throw new Error("Could not extract JSON from LLM response");
}
async function fixCodeNode(state, llm) {
  if (state.error || !state.validationResult)
    return {};
  try {
    const model = llm ?? new ChatOpenAI10({
      model: state.options?.model ?? "gpt-4o",
      temperature: state.options?.temperature ?? 0
    });
    const prompt = buildFixCodePrompt(state.sourceFiles, state.testFiles, state.validationResult, state.targetLanguage);
    const response = await model.invoke(prompt);
    const parsed = extractJson4(response.content);
    const sourceFiles = Object.entries(parsed.files ?? {}).map(([path, content]) => ({
      path,
      content,
      language: state.targetLanguage
    }));
    return { sourceFiles, iteration: state.iteration + 1 };
  } catch (e) {
    return { error: e.message };
  }
}

// ../ai-runtime/dist/agents/code-agent/nodes/write-files.js
import { mkdirSync as mkdirSync4, writeFileSync as writeFileSync4 } from "fs";
import { dirname, join as join5, resolve as resolve8 } from "path";
import { interrupt } from "@langchain/langgraph";
async function writeFilesNode(state) {
  if (state.error)
    return {};
  const allFiles = [...state.sourceFiles, ...state.testFiles];
  if (!state.options?.autoApprove) {
    interrupt({
      type: "approval",
      files: allFiles.map((f) => f.path),
      message: "Approve writing these files to disk?"
    });
  }
  const outputDir = resolve8(state.outputDir);
  const writtenPaths = [];
  for (const file of allFiles) {
    const dest = join5(outputDir, file.path);
    mkdirSync4(dirname(dest), { recursive: true });
    writeFileSync4(dest, file.content, "utf-8");
    writtenPaths.push(dest);
  }
  return { writtenPaths };
}

// ../ai-runtime/dist/agents/code-agent/nodes/summarize.js
import { writeFileSync as writeFileSync5 } from "fs";
import { join as join6, resolve as resolve9 } from "path";
async function summarizeNode(state) {
  if (state.error)
    return {};
  const programId = state.cobolMetadata?.programId ?? state.cobolMetadata?.name ?? "Unknown";
  const validation = state.validationResult;
  const validationSection = validation ? `## Validation Results
- Tests: ${validation.testCount} total, ${validation.passCount} passed, ${validation.failCount} failed
- Status: ${validation.passed ? "\u2705 All tests passed" : "\u26A0\uFE0F Some tests failed"}
${validation.errors.length > 0 ? `
### Failures
${validation.errors.map((e) => `- ${e}`).join("\n")}` : ""}` : "## Validation\nSkipped (--no-validate flag)";
  const rulesSection = state.businessRules.length > 0 ? `## Business Rules Extracted (${state.businessRules.length})
${state.businessRules.map((r) => `- **${r.name}** (\`${r.id}\`): ${r.description}`).join("\n")}` : "## Business Rules\nNone extracted";
  const filesSection = state.writtenPaths.length > 0 ? `## Generated Files
${state.writtenPaths.map((p) => `- \`${p}\``).join("\n")}` : "## Generated Files\nNone written";
  const externalCalls = state.cobolMetadata?.calls ?? [];
  const copybooks = state.cobolMetadata?.copybooks ?? [];
  const manualReview = [
    externalCalls.length > 0 ? `External CALL targets not migrated: ${externalCalls.join(", ")}` : null,
    copybooks.length > 0 ? `Copybook dependencies used: ${copybooks.join(", ")} \u2014 verify data layout equivalence` : null,
    state.iteration > 0 ? `Code required ${state.iteration} fix iteration(s) \u2014 review generated code carefully` : null
  ].filter(Boolean).map((n) => `- ${n}`).join("\n");
  const notes = `# Migration Notes: ${programId}

## Source
- File: \`${state.filePath}\`
- Target language: ${state.targetLanguage}
- Lines: ${state.cobolMetadata?.lines ?? "unknown"}

${rulesSection}

${filesSection}

${validationSection}

## Manual Review Required
${manualReview || "- No specific issues detected"}

---
*Generated by OpenCobol AI*
`;
  const dest = join6(resolve9(state.outputDir), "MIGRATION_NOTES.md");
  writeFileSync5(dest, notes, "utf-8");
  return {};
}

// ../ai-runtime/dist/agents/code-agent/checkpointer.js
import { MemorySaver } from "@langchain/langgraph";
import { homedir as homedir3 } from "os";
import { join as join7 } from "path";
import { mkdirSync as mkdirSync5 } from "fs";
import { createHash } from "crypto";
function createCheckpointer() {
  try {
    const { SqliteSaver } = __require("@langchain/langgraph-checkpoint-sqlite");
    const dir = join7(homedir3(), ".opencobol", "checkpoints");
    mkdirSync5(dir, { recursive: true });
    return SqliteSaver.fromConnString(join7(dir, "agent.db"));
  } catch {
    return new MemorySaver();
  }
}
function threadId(filePath, targetLanguage) {
  return createHash("sha1").update(`${filePath}:${targetLanguage}`).digest("hex").slice(0, 16);
}

// ../ai-runtime/dist/agents/code-agent/graph.js
function buildCodeAgentGraph() {
  const checkpointer = createCheckpointer();
  return new StateGraph7(CodeAgentAnnotation).addNode("analyze", analyzeNode).addNode("enrich-rag", enrichRagNode).addNode("extract-rules", (state) => extractRulesNode(state)).addNode("gen-tests", (state) => genTestsNode(state)).addNode("gen-code", (state) => genCodeNode(state)).addNode("validate", validateNode).addNode("fix-code", (state) => fixCodeNode(state)).addNode("write-files", writeFilesNode).addNode("summarize", summarizeNode).addEdge(START7, "analyze").addEdge("analyze", "enrich-rag").addEdge("enrich-rag", "extract-rules").addEdge("extract-rules", "gen-tests").addEdge("gen-tests", "gen-code").addEdge("gen-code", "validate").addConditionalEdges("validate", (state) => {
    const max = state.options?.maxRetries ?? 3;
    if (!state.validationResult?.passed && state.iteration < max)
      return "fix-code";
    return "write-files";
  }).addEdge("fix-code", "validate").addEdge("write-files", "summarize").addEdge("summarize", END7).compile({ checkpointer });
}

// ../ai-runtime/dist/agents/code-agent/index.js
var NODE_LABELS = {
  "analyze": "Analyzing COBOL program\u2026",
  "enrich-rag": "Searching codebase context\u2026",
  "extract-rules": "Extracting business rules\u2026",
  "gen-tests": "Generating tests\u2026",
  "gen-code": "Generating code\u2026",
  "validate": "Running validation\u2026",
  "fix-code": "Fixing errors\u2026",
  "write-files": "Writing files\u2026",
  "summarize": "Generating migration notes\u2026"
};
async function* streamCodeAgent(input2) {
  mkdirSync6(resolve10(input2.outputDir), { recursive: true });
  const graph = buildCodeAgentGraph();
  const config = {
    configurable: { thread_id: threadId(input2.filePath, input2.targetLanguage) },
    streamMode: "updates"
  };
  const stream = await graph.stream({
    filePath: input2.filePath,
    targetLanguage: input2.targetLanguage,
    outputDir: input2.outputDir,
    options: input2.options
  }, config);
  for await (const updates of stream) {
    for (const [node, state] of Object.entries(updates)) {
      yield { node, state };
    }
  }
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
  const resolvedPath = resolve11(filePath);
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
import { resolve as resolve12 } from "path";
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
  const resolvedPath = resolve12(filePath);
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
import { resolve as resolve13 } from "path";
var BRAND4 = chalk5.bold.hex("#00D4FF");
var DIM4 = chalk5.dim;
var SUCCESS2 = chalk5.green;
var WARN3 = chalk5.yellow;
var LABEL4 = chalk5.bold.white;
var embedCommand = new Command5("embed").description("Index a COBOL directory into the vector database for semantic search").argument("[path]", "Directory to index (default: current directory)").option("--qdrant <url>", "Qdrant URL", "http://localhost:6333").option("--collection <name>", "Qdrant collection name", "opencobol").action(async (targetPath, options) => {
  const resolvedPath = resolve13(targetPath ?? ".");
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
var META = chalk6.dim.italic;
var AI_COLOR = chalk6.white;
var HINT = chalk6.dim.yellow;
function makePrompt(collection) {
  return `  ${chalk6.bold.hex("#00D4FF")(`\u25B6 [${collection}]`)} `;
}
function applyMarkdownColors2(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk6.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk6.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk6.cyan(t));
}
function buildRagQuery(question, history) {
  const lastUser = history.filter((m) => m.role === "user").at(-1);
  if (!lastUser) return question;
  return `${lastUser.content} ${question}`;
}
async function chat(question, history, options, provider) {
  const spinner = ora5({ text: "Searching codebase\u2026", color: "cyan" }).start();
  const ragQuery = buildRagQuery(question, history);
  let system;
  let sources;
  try {
    const contexts = await retrieve(ragQuery, {
      qdrantUrl: options.qdrant,
      collection: options.collection,
      topK: options.topK
    });
    spinner.stop();
    sources = [...new Set(contexts.map((c) => c.hit.payload.file))];
    system = buildRagSystemPrompt(contexts);
  } catch (err) {
    spinner.fail(`Retrieval failed: ${err.message}`);
    return "";
  }
  if (sources.length === 0) {
    console.log(DIM5("\n  No relevant context found. Try running opencobol embed first.\n"));
    return "";
  }
  console.log(META(`
  Context: ${sources.join(", ")}
`));
  console.log(DIM5("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  const messages = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: question }
  ];
  let fullAnswer = "";
  let firstChunk = true;
  const genSpinner = ora5({ text: "Generating\u2026", color: "cyan" }).start();
  try {
    for await (const chunk of provider.streamChat(messages, { model: options.model })) {
      if (firstChunk) {
        genSpinner.stop();
        firstChunk = false;
        process.stdout.write("  ");
      }
      if (chunk.text) {
        process.stdout.write(AI_COLOR(applyMarkdownColors2(chunk.text)));
        fullAnswer += chunk.text;
      }
    }
    console.log("\n");
  } catch (err) {
    genSpinner.fail(`Generation failed: ${err.message}`);
  }
  return fullAnswer;
}
var askCommand = new Command6("ask").description("Chat with your COBOL codebase \u2014 conversation memory + collection switching").argument("[question]", "Question to ask (omit for interactive mode)").option("--qdrant <url>", "Qdrant URL", "http://localhost:6333").option("--collection <name>", "Qdrant collection name", "opencobol").option("--model <model>", "OpenAI model", "gpt-4o").option("--top-k <n>", "Number of context chunks to retrieve", "5").action(
  async (question, opts) => {
    const options = { ...opts, topK: parseInt(opts.topK, 10) };
    const provider = new OpenAIProvider();
    if (question) {
      await chat(question, [], options, provider);
      return;
    }
    console.log();
    console.log(BRAND5("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Chat"));
    console.log(DIM5(`  Collection: ${options.collection} \xB7 Model: ${options.model}`));
    console.log(DIM5("  /exit to quit  \xB7  /clear to reset  \xB7  /collection <name> to switch  \xB7  /help"));
    console.log();
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: makePrompt(options.collection)
    });
    const history = [];
    rl.on("close", () => {
      console.log(DIM5("\n  At\xE9 logo!\n"));
      process.exit(0);
    });
    rl.on("line", async (rawInput) => {
      rl.pause();
      const trimmed = rawInput.trim();
      if (!trimmed) {
        rl.setPrompt(makePrompt(options.collection));
        rl.prompt();
        return;
      }
      if (trimmed === "/exit" || trimmed === "/quit") {
        rl.close();
        return;
      }
      if (trimmed === "/clear") {
        history.length = 0;
        console.log(DIM5("\n  Hist\xF3rico limpo. Nova conversa iniciada.\n"));
        rl.setPrompt(makePrompt(options.collection));
        rl.prompt();
        return;
      }
      if (trimmed === "/history") {
        if (history.length === 0) {
          console.log(DIM5("\n  Nenhuma mensagem no hist\xF3rico ainda.\n"));
        } else {
          console.log();
          history.forEach((m, i) => {
            const label = m.role === "user" ? chalk6.bold.cyan("  Voc\xEA") : chalk6.bold.white("  AI  ");
            const preview = m.content.length > 140 ? m.content.slice(0, 140) + "\u2026" : m.content;
            console.log(`${label} [${Math.floor(i / 2) + 1}]: ${DIM5(preview)}`);
          });
          console.log();
        }
        rl.setPrompt(makePrompt(options.collection));
        rl.prompt();
        return;
      }
      if (trimmed.startsWith("/collection")) {
        const newCollection = trimmed.split(/\s+/)[1]?.trim();
        if (!newCollection) {
          console.log(HINT(`
  Collection atual: ${options.collection}
  Uso: /collection <nome>
`));
        } else {
          options.collection = newCollection;
          history.length = 0;
          console.log(DIM5(`
  Switched to "${newCollection}". Hist\xF3rico resetado.
`));
        }
        rl.setPrompt(makePrompt(options.collection));
        rl.prompt();
        return;
      }
      if (trimmed === "/help") {
        console.log(`
  ${chalk6.bold("Comandos dispon\xEDveis:")}
  ${chalk6.cyan("/collection <name>")}   Troca a collection (reseta o hist\xF3rico)
  ${chalk6.cyan("/clear")}               Reseta o hist\xF3rico da conversa
  ${chalk6.cyan("/history")}             Mostra as mensagens da sess\xE3o
  ${chalk6.cyan("/exit")}                Sai do chat
`);
        rl.setPrompt(makePrompt(options.collection));
        rl.prompt();
        return;
      }
      const answer = await chat(trimmed, history, options, provider);
      if (answer) {
        history.push({ role: "user", content: trimmed });
        history.push({ role: "assistant", content: answer });
      }
      rl.setPrompt(makePrompt(options.collection));
      rl.prompt();
    });
    rl.prompt();
  }
);

// src/commands/deps.ts
import { Command as Command7 } from "commander";
import chalk7 from "chalk";
import ora6 from "ora";
import { resolve as resolve14 } from "path";
var BRAND6 = chalk7.bold.hex("#00D4FF");
var DIM6 = chalk7.dim;
var AI_COLOR2 = chalk7.white;
function applyMarkdownColors3(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk7.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk7.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk7.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk7.dim(m));
}
var depsCommand = new Command7("deps").description("Analyze inter-program dependencies and produce a migration impact report").argument("[path]", "Directory to scan (default: current directory)").option("--program <name>", "Focus on impact of changing a specific program").option("--model <model>", "OpenAI model", "gpt-4o").action(async (targetPath, options) => {
  const resolvedPath = resolve14(targetPath ?? ".");
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
import { resolve as resolve15, basename as basename5, extname as extname3 } from "path";
import { writeFileSync as writeFileSync6 } from "fs";
var BRAND7 = chalk8.bold.hex("#00D4FF");
var DIM7 = chalk8.dim;
var SUCCESS3 = chalk8.green;
var AI_COLOR3 = chalk8.white;
function applyMarkdownColors4(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk8.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk8.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk8.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk8.dim(m));
}
var modernizeCommand = new Command8("modernize").description("Generate a modernization plan for a COBOL program").argument("<file>", "COBOL file to modernize").option("--lang <language>", "Target language (typescript, java, python, go)", "typescript").option("--model <model>", "OpenAI model", "gpt-4o").option("--output <file>", "Save plan to a markdown file").action(async (filePath, options) => {
  const resolvedPath = resolve15(filePath);
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
    writeFileSync6(resolve15(options.output), content, "utf-8");
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
import { resolve as resolve16, basename as basename6, extname as extname4 } from "path";
import { writeFileSync as writeFileSync7 } from "fs";
var BRAND8 = chalk9.bold.hex("#00D4FF");
var DIM8 = chalk9.dim;
var SUCCESS4 = chalk9.green;
var AI_COLOR4 = chalk9.white;
function applyMarkdownColors5(text) {
  return text.replace(/^(#{1,3} .+)$/gm, (m) => chalk9.bold.white(m)).replace(/\*\*(.+?)\*\*/g, (_, t) => chalk9.bold(t)).replace(/`(.+?)`/g, (_, t) => chalk9.cyan(t)).replace(/\|(.+)\|/g, (m) => chalk9.dim(m));
}
var docsCommand = new Command9("docs").description("Generate markdown documentation for a COBOL program").argument("<file>", "COBOL file to document").option("--model <model>", "OpenAI model", "gpt-4o").option("--output <file>", "Save documentation to a file (default: <program>.md)").action(async (filePath, options) => {
  const resolvedPath = resolve16(filePath);
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
  writeFileSync7(resolve16(outputPath), content, "utf-8");
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

// src/commands/generate-api.ts
import { Command as Command10 } from "commander";
import chalk10 from "chalk";
import ora9 from "ora";
import { resolve as resolve17, basename as basename7, extname as extname5, join as join8 } from "path";
import { mkdirSync as mkdirSync7, writeFileSync as writeFileSync8 } from "fs";
var BRAND9 = chalk10.bold.hex("#00D4FF");
var DIM9 = chalk10.dim;
var SUCCESS5 = chalk10.green;
var FILE_COLOR3 = chalk10.cyan;
function formatBytes2(str) {
  const bytes = Buffer.byteLength(str, "utf-8");
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
var generateApiCommand = new Command10("generate-api").description("Generate a NestJS REST API from a COBOL program").argument("<file>", "COBOL source file").option("--framework <name>", "Target framework (nestjs)", "nestjs").option("--model <model>", "OpenAI model", "gpt-4o").option("--output-dir <dir>", "Output directory", "./generated-api").action(async (filePath, options) => {
  const resolvedPath = resolve17(filePath);
  const programName = basename7(filePath, extname5(filePath)).toUpperCase();
  console.log();
  console.log(BRAND9("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Generate API"));
  console.log(DIM9("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${chalk10.bold.white("Program")}    ${FILE_COLOR3(programName)}`);
  console.log(`  ${chalk10.bold.white("Framework")} ${FILE_COLOR3(options.framework)}`);
  console.log(`  ${chalk10.bold.white("Output")}    ${FILE_COLOR3(options.outputDir)}`);
  console.log();
  const spinner = ora9({ text: "Analyzing COBOL program\u2026", color: "cyan" }).start();
  const { result, error } = await runApiGeneratorAgent(resolvedPath, options.framework, {
    model: options.model
  });
  spinner.stop();
  if (error || !result) {
    console.error(chalk10.red(`  Error: ${error ?? "No output generated"}`));
    process.exitCode = 1;
    return;
  }
  const outDir = join8(resolve17(options.outputDir), result.programName);
  mkdirSync7(outDir, { recursive: true });
  console.log(SUCCESS5(`  \u2714 Generated ${Object.keys(result.files).length} files`));
  console.log();
  console.log(`  ${chalk10.bold.white("Description")}`);
  console.log(`  ${DIM9(result.description)}`);
  console.log();
  console.log(`  ${chalk10.bold.white("Endpoints")}`);
  for (const ep of result.endpoints) {
    const method = ep.method.padEnd(6);
    console.log(`  ${chalk10.green(method)} ${FILE_COLOR3(ep.path)}  ${DIM9(ep.description)}`);
  }
  console.log();
  console.log(`  ${chalk10.bold.white("Files")}`);
  for (const [filename, content] of Object.entries(result.files)) {
    const filePath2 = join8(outDir, filename);
    writeFileSync8(filePath2, content, "utf-8");
    console.log(`  ${SUCCESS5("\u2192")} ${FILE_COLOR3(join8(result.programName, filename))}  ${DIM9(formatBytes2(content))}`);
  }
  console.log();
  console.log(DIM9(`  Run: cd ${options.outputDir} && npm install`));
  console.log();
});

// src/commands/agent.ts
import { Command as Command11 } from "commander";
import chalk11 from "chalk";
import ora10 from "ora";
import { resolve as resolve18, basename as basename8, extname as extname6 } from "path";
import { existsSync as existsSync3 } from "fs";
import { createInterface as createInterface2 } from "readline";
import { setMaxListeners } from "events";
setMaxListeners(50);
var BRAND10 = chalk11.bold.hex("#00D4FF");
var DIM10 = chalk11.dim;
var SUCCESS6 = chalk11.green;
var WARN4 = chalk11.yellow;
var ERROR = chalk11.red;
var PROMPT_CHAR = chalk11.bold.hex("#00D4FF")("\u25B6");
function confirmWriteFiles(files) {
  return new Promise((res) => {
    const rl = createInterface2({ input: process.stdin, output: process.stdout });
    console.log();
    console.log(DIM10("  Files to be written:"));
    for (const f of files) console.log(`  ${chalk11.cyan("+")} ${f}`);
    rl.question(`
  Proceed with writing files? [y/N] `, (answer) => {
      rl.close();
      res(answer.trim().toLowerCase() === "y");
    });
  });
}
async function runAgent(filePath, opts) {
  const resolvedPath = resolve18(filePath.replace(/^~/, process.env["HOME"] ?? "~"));
  if (!existsSync3(resolvedPath)) {
    console.log(ERROR(`
  File not found: ${resolvedPath}
`));
    return;
  }
  const programName = basename8(resolvedPath, extname6(resolvedPath)).toUpperCase();
  console.log();
  console.log(DIM10("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log(`  ${chalk11.bold.white("Program")}    ${chalk11.cyan(programName)}`);
  console.log(`  ${chalk11.bold.white("Target")}     ${chalk11.cyan(opts.lang)}`);
  console.log(`  ${chalk11.bold.white("Output")}     ${chalk11.cyan(opts.output)}`);
  console.log(`  ${chalk11.bold.white("Validate")}   ${opts.validate ? chalk11.green("yes") : DIM10("no")}`);
  console.log();
  const spinner = ora10({ color: "cyan" }).start("Starting agent\u2026");
  let currentIteration = 0;
  let mergedState = {};
  let aborted = false;
  try {
    const stream = streamCodeAgent({
      filePath: resolvedPath,
      targetLanguage: opts.lang,
      outputDir: opts.output,
      options: {
        model: opts.model,
        maxRetries: opts.maxRetries,
        autoApprove: opts.auto,
        validate: opts.validate,
        collection: opts.collection,
        qdrantUrl: opts.qdrant
      }
    });
    for await (const { node, state } of stream) {
      mergedState = { ...mergedState, ...state };
      if (node === "fix-code") {
        currentIteration++;
        spinner.text = `${WARN4("Fixing errors\u2026")} (attempt ${currentIteration}/${opts.maxRetries})`;
        continue;
      }
      if (node === "validate" && currentIteration > 0) {
        const v = state.validationResult;
        if (v && !v.passed) {
          spinner.text = `${WARN4("Validation failed")} \u2014 ${v.failCount} error(s), retrying\u2026`;
          continue;
        }
      }
      if (node === "__interrupt__") {
        spinner.stop();
        const sourceFiles = mergedState.sourceFiles ?? [];
        const files = sourceFiles.map((f) => f.path);
        const approved = await confirmWriteFiles(files);
        if (!approved) {
          console.log(ERROR("\n  Aborted. No files written.\n"));
          aborted = true;
          break;
        }
        spinner.start("Writing files\u2026");
        continue;
      }
      spinner.text = NODE_LABELS[node] ?? node;
    }
    spinner.stop();
    if (aborted || !Object.keys(mergedState).length) return;
    console.log();
    console.log(SUCCESS6(`  \u2714 ${programName} modernized`));
    console.log();
    const businessRules = mergedState.businessRules ?? [];
    if (businessRules.length > 0) {
      console.log(`  ${chalk11.bold.white("Business rules:")} ${chalk11.cyan(businessRules.length)}`);
      for (const r of businessRules) {
        console.log(`    ${DIM10("\u2022")} ${r.name} ${DIM10(`(${r.id})`)}`);
      }
      console.log();
    }
    const writtenPaths = mergedState.writtenPaths ?? [];
    if (writtenPaths.length > 0) {
      console.log(`  ${chalk11.bold.white("Files written:")}`);
      for (const p of writtenPaths) {
        console.log(`    ${chalk11.green("+")} ${p}`);
      }
      console.log();
    }
    const vr = mergedState.validationResult;
    if (vr) {
      const icon = vr.passed ? SUCCESS6("\u2714") : WARN4("\u26A0");
      console.log(`  ${icon} ${chalk11.bold.white("Tests:")} ${vr.passCount}/${vr.testCount} passed`);
      if (!vr.passed && vr.errors.length > 0) {
        console.log();
        console.log(WARN4("  Failures:"));
        for (const err of vr.errors.slice(0, 5)) {
          console.log(`    ${DIM10("\u2022")} ${err}`);
        }
      }
      console.log();
    }
    if (mergedState.error) {
      console.log(ERROR(`  Error: ${mergedState.error}
`));
    } else {
      console.log(DIM10(`  Migration notes \u2192 ${opts.output}/MIGRATION_NOTES.md`));
      console.log();
    }
  } catch (err) {
    spinner.stop();
    console.error(ERROR(`
  Fatal error: ${err.message}
`));
  }
}
function printHelp() {
  console.log();
  console.log(DIM10("  Paste a .cbl file path to modernize it. Or:"));
  console.log();
  console.log(`    ${chalk11.cyan("/set lang")}       <typescript|java|python|go>`);
  console.log(`    ${chalk11.cyan("/set output")}     <dir>`);
  console.log(`    ${chalk11.cyan("/set model")}      <gpt-4o|gpt-4o-mini>`);
  console.log(`    ${chalk11.cyan("/set collection")} <name>`);
  console.log(`    ${chalk11.cyan("/set auto")}       toggle auto-approve`);
  console.log(`    ${chalk11.cyan("/set validate")}   <true|false>`);
  console.log(`    ${chalk11.cyan("/settings")}       show current settings`);
  console.log(`    ${chalk11.cyan("/exit")}           quit`);
  console.log();
}
function printSettings(opts) {
  console.log();
  console.log(`  ${chalk11.bold.white("lang")}       ${chalk11.cyan(opts.lang)}`);
  console.log(`  ${chalk11.bold.white("model")}      ${chalk11.cyan(opts.model)}`);
  console.log(`  ${chalk11.bold.white("output")}     ${chalk11.cyan(opts.output)}`);
  console.log(`  ${chalk11.bold.white("collection")} ${chalk11.cyan(opts.collection)}`);
  console.log(`  ${chalk11.bold.white("auto")}       ${opts.auto ? chalk11.green("yes") : DIM10("no")}`);
  console.log(`  ${chalk11.bold.white("validate")}   ${opts.validate ? chalk11.green("yes") : DIM10("no")}`);
  console.log(`  ${chalk11.bold.white("retries")}    ${chalk11.cyan(opts.maxRetries)}`);
  console.log();
}
var agentCommand = new Command11("agent").description("Autonomously modernize a COBOL program with AI (analyze \u2192 generate \u2192 validate \u2192 write)").argument("[file]", "COBOL file to modernize (omit to start interactive session)").option("--lang <language>", "Target language: typescript, java, python, go", "typescript").option("--output <dir>", "Output directory", "./generated").option("--model <model>", "OpenAI model", "gpt-4o").option("--auto", "Auto-approve file writes (skip confirmation)", false).option("--no-validate", "Skip running generated tests").option("--max-retries <n>", "Max fix iterations if tests fail", "3").option("--collection <name>", "Qdrant collection to use for RAG context", "opencobol").option("--qdrant <url>", "Qdrant URL", "http://localhost:6333").action(async (filePath, rawOptions) => {
  const opts = {
    lang: rawOptions.lang,
    output: rawOptions.output,
    model: rawOptions.model,
    auto: rawOptions.auto,
    validate: rawOptions.validate,
    maxRetries: parseInt(rawOptions.maxRetries, 10),
    collection: rawOptions.collection,
    qdrant: rawOptions.qdrant
  };
  if (filePath) {
    console.log();
    console.log(BRAND10("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Agent"));
    await runAgent(filePath, opts);
    return;
  }
  console.log();
  console.log(BRAND10("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Agent"));
  console.log(DIM10("  Paste a .cbl file path to modernize it. Type /help for commands."));
  console.log(DIM10("  Ctrl+C to exit."));
  console.log();
  console.log(`  ${chalk11.bold.white("lang")} ${chalk11.cyan(opts.lang)}  ${chalk11.bold.white("model")} ${chalk11.cyan(opts.model)}  ${chalk11.bold.white("output")} ${chalk11.cyan(opts.output)}`);
  console.log();
  const rl = createInterface2({ input: process.stdin, output: process.stdout });
  rl.on("close", () => {
    console.log(DIM10("\n  Bye!\n"));
    process.exit(0);
  });
  const loop = () => {
    rl.question(`  ${PROMPT_CHAR} `, async (input2) => {
      const trimmed = input2.trim();
      if (!trimmed) {
        loop();
        return;
      }
      if (trimmed === "/exit" || trimmed === "/quit") {
        rl.close();
        return;
      }
      if (trimmed === "/help") {
        printHelp();
        loop();
        return;
      }
      if (trimmed === "/settings") {
        printSettings(opts);
        loop();
        return;
      }
      if (trimmed.startsWith("/set ")) {
        const rest = trimmed.slice(5).trim();
        const spaceIdx = rest.indexOf(" ");
        const key = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
        const val = spaceIdx === -1 ? "" : rest.slice(spaceIdx + 1).trim();
        switch (key) {
          case "lang":
            opts.lang = val;
            break;
          case "output":
            opts.output = val;
            break;
          case "model":
            opts.model = val;
            break;
          case "collection":
            opts.collection = val;
            break;
          case "auto":
            opts.auto = !opts.auto;
            break;
          case "validate":
            opts.validate = val !== "false";
            break;
          case "retries":
            opts.maxRetries = parseInt(val, 10) || opts.maxRetries;
            break;
          default:
            console.log(WARN4(`  Unknown setting: ${key}. Type /help to see options.
`));
            loop();
            return;
        }
        console.log(SUCCESS6(`  \u2714 ${key} = ${key === "auto" ? opts.auto ? "yes" : "no" : val || "(toggled)"}`));
        console.log();
        loop();
        return;
      }
      if (/\.(cbl|cob)$/i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("~/") || trimmed.startsWith("../")) {
        await runAgent(trimmed, opts);
        loop();
        return;
      }
      console.log(WARN4(`  Unknown command. Type /help or paste a .cbl file path.
`));
      loop();
    });
  };
  loop();
});

// src/commands/diagram.ts
import { Command as Command12 } from "commander";
import chalk12 from "chalk";
import ora11 from "ora";
import { resolve as resolve19, basename as basename9, extname as extname7, join as join9 } from "path";
import { existsSync as existsSync4, readFileSync as readFileSync14, mkdirSync as mkdirSync8, writeFileSync as writeFileSync9 } from "fs";
var BRAND11 = chalk12.bold.hex("#00D4FF");
var DIM11 = chalk12.dim;
var SUCCESS7 = chalk12.green;
var ERROR2 = chalk12.red;
var TYPE_LABELS = {
  flow: "Execution Flow",
  calls: "Call Graph",
  data: "Data Structures",
  arch: "Architecture Overview (AI)",
  all: "All Diagrams"
};
var diagramCommand = new Command12("diagram").description("Generate Mermaid diagrams for a COBOL program (flow, calls, data, arch)").argument("<file>", "COBOL file to diagram").option("--type <type>", "Diagram type: flow | calls | data | arch | all", "all").option("--output <dir>", "Save diagram(s) to a directory (prints to stdout if omitted)").option("--model <model>", "OpenAI model for --type arch", "gpt-4o").action(
  async (filePath, options) => {
    const resolvedPath = resolve19(filePath.replace(/^~/, process.env["HOME"] ?? "~"));
    if (!existsSync4(resolvedPath)) {
      console.error(ERROR2(`
  File not found: ${resolvedPath}
`));
      process.exit(1);
    }
    const type = options.type;
    const validTypes = ["flow", "calls", "data", "arch", "all"];
    if (!validTypes.includes(type)) {
      console.error(ERROR2(`
  Invalid type "${type}". Use: flow | calls | data | arch | all
`));
      process.exit(1);
    }
    const programName = basename9(resolvedPath, extname7(resolvedPath)).toUpperCase();
    console.log();
    console.log(BRAND11("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Diagram"));
    console.log(DIM11("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    console.log(`  ${chalk12.bold.white("Program")}  ${chalk12.cyan(programName)}`);
    console.log(`  ${chalk12.bold.white("Type")}     ${chalk12.cyan(TYPE_LABELS[type])}`);
    if (options.output) {
      console.log(`  ${chalk12.bold.white("Output")}   ${chalk12.cyan(options.output)}`);
    }
    console.log();
    const spinner = ora11({ text: "Parsing COBOL\u2026", color: "cyan" }).start();
    let cobolFile;
    let flow = null;
    let source = "";
    let wsFields = [];
    try {
      cobolFile = analyzeFile(resolvedPath);
      source = readFileSync14(resolvedPath, "utf-8");
      const dataDivision = parseDataDivisionFromSource(source);
      wsFields = dataDivision.workingStorage;
      try {
        flow = extractFlow(resolvedPath);
      } catch {
      }
      spinner.succeed("COBOL parsed");
    } catch (err) {
      spinner.fail(`Parse failed: ${err.message}`);
      process.exit(1);
    }
    const progId = cobolFile.programId ?? programName;
    const results = [];
    const toGenerate = type === "all" ? ["flow", "calls", "data", "arch"] : [type];
    for (const t of toGenerate) {
      const label = TYPE_LABELS[t];
      const s = ora11({ text: `Generating ${label}\u2026`, color: "cyan" }).start();
      try {
        let content;
        if (t === "flow") {
          if (!flow) {
            s.warn("Flow extraction failed \u2014 skipping");
            continue;
          }
          content = generateFlowDiagram(flow);
        } else if (t === "calls") {
          content = generateCallsDiagram(cobolFile);
        } else if (t === "data") {
          content = generateDataDiagram(progId, wsFields);
        } else {
          content = await generateArchDiagram(cobolFile, source, flow, { model: options.model });
        }
        s.succeed(label);
        results.push({ type: t, content });
      } catch (err) {
        s.fail(`${label} failed: ${err.message}`);
      }
    }
    if (results.length === 0) {
      console.log(ERROR2("\n  No diagrams generated.\n"));
      process.exit(1);
    }
    if (options.output) {
      mkdirSync8(resolve19(options.output), { recursive: true });
      if (type === "all") {
        const combined = results.map((r) => r.content).join("\n---\n\n");
        const outPath = join9(resolve19(options.output), `${progId}-diagrams.md`);
        writeFileSync9(outPath, combined, "utf-8");
        console.log();
        console.log(SUCCESS7(`  \u2714 Written to ${outPath}`));
      } else {
        const outPath = join9(resolve19(options.output), `${progId}-${type}.md`);
        writeFileSync9(outPath, results[0].content, "utf-8");
        console.log();
        console.log(SUCCESS7(`  \u2714 Written to ${outPath}`));
      }
    } else {
      console.log();
      for (const r of results) {
        console.log(r.content);
        if (results.length > 1) console.log(DIM11("\u2500".repeat(60)) + "\n");
      }
    }
  }
);

// src/commands/analyze.ts
import { Command as Command13 } from "commander";
import chalk13 from "chalk";
import ora12 from "ora";
import { resolve as resolve20 } from "path";
import { writeFileSync as writeFileSync10 } from "fs";
var BRAND12 = chalk13.bold.hex("#00D4FF");
var DIM12 = chalk13.dim;
var OK = chalk13.green("\u2714");
var FAIL = chalk13.red("\u2718");
var analyzeCommand = new Command13("analyze").description("Run full AI analysis on a COBOL codebase and generate a report").argument("[path]", "Root directory containing COBOL files (default: current directory)").option("--model <model>", "OpenAI model to use", "gpt-4o").option("--output <file>", "Output file for the report", "opencobol-report.md").action(async (dirPath, options) => {
  const rootPath = resolve20(dirPath ?? ".");
  const outputFile = resolve20(options.output);
  console.log();
  console.log(BRAND12("  \u2588\u2588\u2588\u2588\u2588\u2588  OpenCobol AI \u2014 Analyze"));
  console.log(DIM12("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log();
  console.log(`  ${chalk13.bold("Directory")}  ${chalk13.cyan(rootPath)}`);
  console.log(`  ${chalk13.bold("Model")}      ${chalk13.cyan(options.model)}`);
  console.log(`  ${chalk13.bold("Output")}     ${chalk13.cyan(outputFile)}`);
  console.log();
  const phases = [
    { key: "scan", label: "Scanning COBOL files\u2026" },
    { key: "dependency", label: "Analyzing dependencies\u2026" },
    { key: "explain", label: "Explaining programs with AI\u2026" },
    { key: "docs", label: "Assembling report\u2026" }
  ];
  let phaseIndex = 0;
  const spinner = ora12({ text: phases[0].label, color: "cyan" }).start();
  const advancePhase = () => {
    phaseIndex++;
    if (phaseIndex < phases.length) {
      spinner.text = phases[phaseIndex].label;
    }
  };
  const originalLog = console.log;
  let callCount = 0;
  console.log = (...args) => {
    callCount++;
    if (callCount % 3 === 0) advancePhase();
    originalLog(...args);
  };
  try {
    const { finalReport, error } = await runOrchestratorAgent(rootPath, {
      model: options.model
    });
    console.log = originalLog;
    if (error || !finalReport) {
      spinner.fail(`${FAIL} Analysis failed: ${error ?? "no output generated"}`);
      process.exitCode = 1;
      return;
    }
    spinner.succeed(`${OK} Analysis complete`);
    console.log();
    writeFileSync10(outputFile, finalReport, "utf-8");
    const lineCount = finalReport.split("\n").length;
    console.log(`  ${chalk13.bold("Report")}     ${chalk13.green(outputFile)}`);
    console.log(`  ${chalk13.bold("Lines")}      ${lineCount}`);
    console.log();
    console.log(DIM12("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    console.log();
  } catch (err) {
    console.log = originalLog;
    spinner.fail(`${FAIL} Analysis failed: ${err.message}`);
    process.exitCode = 1;
  }
});

// src/index.ts
applyConfig();
var program = new Command14();
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
program.addCommand(generateApiCommand);
program.addCommand(agentCommand);
program.addCommand(diagramCommand);
program.addCommand(analyzeCommand);
program.parse(process.argv);
