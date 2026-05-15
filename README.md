<div align="center">

# OpenCobol AI

**Transform legacy COBOL systems into AI-navigable context.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-f69220?logo=pnpm)](https://pnpm.io/)

[Website](https://opencobol.ai) · [Documentation](#commands) · [Contributing](#contributing) · [Discord](#community)

</div>

---

## What is OpenCobol AI?

OpenCobol AI is an **open source, CLI-first platform** for understanding, documenting, and modernizing legacy COBOL codebases using AI.

Point it at any folder of COBOL code and get:

- Semantic search across your entire codebase (`ask`)
- AI explanations of business rules (`explain`)
- Dependency and impact analysis (`deps`)
- Full orchestrated analysis reports (`analyze`)
- Migration plans to modern languages (`modernize`)

**No vendor lock-in. No cloud required. Runs entirely on your machine.**

```bash
cd /your/cobol/project
opencobol embed        # index everything
opencobol analyze      # full AI report in seconds
opencobol ask          # chat with your codebase
```

---

## Why OpenCobol?

| | IBM Watsonx for Z | AWS Transform | OpenCobol AI |
|---|:---:|:---:|:---:|
| Open source | ❌ | ❌ | ✅ |
| CLI first | ❌ | ❌ | ✅ |
| No cloud lock-in | ❌ | ❌ | ✅ |
| RAG semantic search | ✅ | ✅ | ✅ |
| LangGraph multi-agent | ✅ | ✅ | ✅ |
| Deep DATA DIVISION parse | ✅ | ✅ | ✅ |
| Free to use | ❌ | ❌ | ✅ |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for Qdrant vector database)
- OpenAI API key

### 1. Install

```bash
npm install -g opencobol-ai
```

### 2. Start infrastructure

```bash
# Clone the repo to get docker-compose.yml
git clone https://github.com/Alanmc021/open-cobol.git
cd open-cobol
docker compose up -d
```

### 3. Configure

```bash
opencobol init
# → enter your OpenAI API key when prompted
```

### 4. Index your COBOL codebase

```bash
cd /path/to/your/cobol/project
opencobol embed
```

Output:
```
  ✔  PAYROLL.cbl      12 chunks indexed
  ✔  CUSTOMER.cbl      9 chunks indexed
  ✔  INVENTORY.cbl     6 chunks indexed
  –  COMMON.cpy        unchanged, skipped

  Done!  4 files scanned  ·  27 chunks indexed
  Run opencobol ask to start querying.
```

### 5. Start exploring

```bash
opencobol ask "What programs handle customer balance?"
opencobol explain PAYROLL.cbl
opencobol analyze
```

---

## Commands

| Command | Description |
|---|---|
| `opencobol init` | Configure API key, Qdrant endpoint and project settings |
| `opencobol scan` | Detect all COBOL files and map the call graph |
| `opencobol flow <file>` | Show execution flow of a program |
| `opencobol embed` | Chunk, embed and index the codebase into Qdrant |
| `opencobol ask` | Semantic chat — ask anything about your system |
| `opencobol explain <file>` | AI explanation of a program with business rules |
| `opencobol deps` | Dependency graph and impact analysis |
| `opencobol analyze` | Full orchestrated analysis: scan → deps → explain → Markdown report |
| `opencobol modernize <file>` | Generate migration plan to TypeScript / Java / Python |
| `opencobol generate-api <file>` | Generate equivalent REST API spec |
| `opencobol generate-docs <file>` | Generate Markdown documentation |
| `opencobol diagram <file>` | Generate architecture diagram |

> All directory commands default to the current folder — no path argument needed.

---

## How It Works

```
Your COBOL folder
      │
      ▼
  opencobol embed
      │
      ├── parser-core   → scans files, extracts PROGRAM-ID, COPY, CALL,
      │                   DATA DIVISION variables (PIC types, WORKING-STORAGE)
      │
      ├── rag-engine    → chunks by paragraph/section, generates OpenAI
      │                   embeddings, stores in Qdrant
      │
      └── manifest      → tracks file changes, skips unchanged files

  opencobol ask / analyze / explain
      │
      ├── retriever     → semantic search in Qdrant
      │
      └── ai-runtime    → LangGraph multi-agent orchestrator
                          scan → dependency → explain → docs
```

---

## Architecture

```
packages/
  parser-core    # Pure COBOL parser — AST, DATA DIVISION, dependency graph
  rag-engine     # Embeddings, chunking, Qdrant vector store
  ai-runtime     # LangGraph agents (explainer, dependency, modernization, orchestrator)
  cli            # Commander.js CLI
  shared         # Types, interfaces
  observability  # LangSmith tracing, OpenTelemetry

apps/
  api            # NestJS REST API with JWT auth and SSE streaming
  vscode-extension  # VS Code extension with COBOL syntax, hover, CodeLens
```

---

## Supported COBOL Features

- `PROGRAM-ID` extraction
- `COPY` / `CALL` dependency mapping
- `DATA DIVISION` variable parsing — field names, PIC types (`X`, `9`, `S9V99`), `COMP-3`, `WORKING-STORAGE`, `LINKAGE`
- `PROCEDURE DIVISION` paragraph and `PERFORM` flow
- JCL `EXEC PGM=` dependency mapping
- Copybook expansion tracking

---

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict ESM) |
| CLI | Commander.js + Chalk + Ora |
| AI Agents | LangChain + LangGraph |
| Vector DB | Qdrant |
| Embeddings | OpenAI text-embedding-3-small |
| Backend API | NestJS |
| Observability | LangSmith + OpenTelemetry |
| Infrastructure | Docker + Terraform |

---

## Contributing

Contributions are welcome! OpenCobol is MIT licensed and open to everyone.

```bash
# Clone and install
git clone https://github.com/Alanmc021/open-cobol.git
cd open-cobol
pnpm install

# Start infrastructure
docker compose up -d

# Run tests
pnpm test

# Build all packages
pnpm build
```

### Good first issues

- Add support for more PIC clause types
- Improve chunking strategy for large COBOL programs
- Add new LangGraph agent (summarizer, auditor)
- Write integration tests for the CLI commands

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

---

## Roadmap

| Phase | Status | Description |
|---|:---:|---|
| 0 — Foundation | ✅ Done | Monorepo, Docker Compose, base infra |
| 1 — CLI MVP | ✅ Done | `scan`, `explain`, `flow`, `ask` |
| 2 — Parser Engine | ✅ Done | DATA DIVISION, dependency graph |
| 3 — RAG Engine | ✅ Done | Embeddings, chunking, semantic search |
| 4 — AI Runtime | ✅ Done | LangGraph agents + orchestrator |
| 5 — Observability | 🔄 In progress | LangSmith tracing, evals |
| 6 — API Platform | 🔄 In progress | NestJS REST + JWT auth |
| 7 — Frontend | 📋 Planned | Next.js dashboard, chat, graph viewer |
| 8 — Enterprise | 📋 Planned | Multi-tenant, queues, Redis cache |
| 9 — Modernization | 📋 Planned | Code generation, TDD pipeline |
| 10 — AI Platform | 📋 Planned | MCP, multi-agent memory, marketplace |

---

## Community

- **Issues:** [github.com/Alanmc021/open-cobol/issues](https://github.com/Alanmc021/open-cobol/issues)
- **Discussions:** [github.com/Alanmc021/open-cobol/discussions](https://github.com/Alanmc021/open-cobol/discussions)

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with love for the developers maintaining the systems that run the world.

**⭐ Star this repo if OpenCobol helped you understand a legacy system.**

</div>
