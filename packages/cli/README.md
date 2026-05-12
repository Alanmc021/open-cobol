# OpenCobol AI

> Ask questions about your legacy COBOL systems using semantic search and AI.

OpenCobol AI indexes your entire COBOL codebase into a vector database and lets you chat with it using natural language. Built for teams that need to understand, document, and modernize legacy systems — without needing to be COBOL experts.

## Installation

```bash
npm install -g opencobol-ai
```

**Requirements:**
- Node.js >= 20
- An OpenAI API key
- [Docker](https://docker.com) (for Qdrant — the semantic search engine)

## Quick Start

```bash
# 1. Install
npm install -g opencobol-ai

# 2. Start the vector database
docker run -p 6333:6333 qdrant/qdrant

# 3. Configure (interactive wizard)
opencobol init

# 4. Index your COBOL codebase
opencobol embed ./legacy

# 5. Ask questions
opencobol ask "Which programs calculate payroll?"
opencobol ask "What does this system do?"
opencobol ask "Which programs write to the database?"
```

That's the full product. You now have a semantic search engine over your COBOL system.

---

## Commands

### `init` — Interactive setup wizard

Configures your API key, model, and Qdrant connection in under a minute.

```bash
opencobol init
```

---

### `embed` — Index your codebase

Chunks and embeds your COBOL codebase into Qdrant for semantic search.

```bash
opencobol embed ./legacy
opencobol embed ./legacy --qdrant http://localhost:6333 --collection myproject
```

---

### `ask` — Chat with your codebase

Ask natural language questions. Uses RAG to find relevant code before answering.

```bash
# Interactive REPL
opencobol ask

# One-shot
opencobol ask "What does the PAYROLL program do?"
opencobol ask "Which programs depend on CUSTMAST?"
opencobol ask "Where is tax calculation handled?"
```

---

### `explain` — Understand a program

Uses AI to explain what a COBOL program does in plain language.

```bash
opencobol explain ./legacy/PAYROLL.cbl
opencobol explain ./legacy/PAYROLL.cbl --model gpt-4o
```

---

### `deps` — Dependency impact analysis

Analyzes inter-program dependencies and generates a migration impact report.

```bash
opencobol deps ./legacy
opencobol deps ./legacy --program PAYROLL
```

---

### `modernize` — Generate a migration plan

Produces a step-by-step modernization plan for a COBOL program in a modern language.

```bash
opencobol modernize ./legacy/PAYROLL.cbl --lang typescript
opencobol modernize ./legacy/PAYROLL.cbl --lang java
opencobol modernize ./legacy/PAYROLL.cbl --output plan.md
```

Supported targets: `typescript`, `java`, `python`, `go`

---

### `docs` — Generate documentation

Generates complete Markdown documentation including a Mermaid flowchart.

```bash
opencobol docs ./legacy/PAYROLL.cbl
opencobol docs ./legacy/PAYROLL.cbl --output ./docs/PAYROLL.md
```

---

## Offline Tools

These commands work without an API key or Qdrant.

### `scan` — Detect files and map dependencies

```bash
opencobol scan ./legacy
```

### `flow` — Show execution flow

```bash
opencobol flow ./legacy/PAYROLL.cbl
```

---

## Configuration

Run `opencobol init` for the interactive wizard, or set environment variables manually:

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini
```

Or create a `.env` file in your project directory:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Config is also saved to `~/.opencobol/config.json` by `opencobol init`.

---

## All Options

| Command | Option | Default | Description |
|---|---|---|---|
| all AI commands | `--model <model>` | `gpt-4o-mini` | OpenAI model to use |
| `embed`, `ask` | `--qdrant <url>` | `http://localhost:6333` | Qdrant URL |
| `embed`, `ask` | `--collection <name>` | `opencobol` | Qdrant collection |
| `ask` | `--top-k <n>` | `5` | Number of context chunks to retrieve |
| `modernize` | `--lang <language>` | `typescript` | Target language |
| `modernize`, `docs` | `--output <file>` | — | Save output to a file |
| `deps` | `--program <name>` | — | Focus analysis on one program |

## License

MIT
