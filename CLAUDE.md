# OpenCobol AI Platform

## Visão do Projeto

**OpenCobol AI** é uma plataforma AI-first para análise, entendimento, documentação e modernização de sistemas COBOL legados. O objetivo central não é um compilador — é **transformar sistemas COBOL em contexto navegável por IA**.

## Stack Oficial

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Runtime | Node.js |
| CLI | Commander.js + Chalk + Ora |
| Backend | NestJS |
| IA | LangChain + LangGraph |
| Banco | PostgreSQL + MongoDB |
| Vector DB | Qdrant |
| Observabilidade | LangSmith + OpenTelemetry + Grafana + Prometheus |
| Infra | Docker + Terraform + EC2 |

## Estrutura do Monorepo

```
apps/          # aplicações (CLI, API, Frontend)
packages/      # bibliotecas internas compartilhadas
  parser-core  # AST e parser COBOL (tree-sitter ou ANTLR)
  cli          # Commander.js CLI
  ai-runtime   # LangGraph agents
  shared       # tipos, utils, constantes
  rag-engine   # embeddings, chunking, busca semântica
  observability # LangSmith, OpenTelemetry wrappers
services/      # serviços standalone (workers, etc.)
```

## Arquitetura

```
CLI / UI
  └── API Gateway
        ├── Parser Core → AST Builder → Indexer
        ├── AI Runtime  → LangGraph  → RAG Engine
        └── Observability → LangSmith → Metrics
                               └── Qdrant (Vector DB)
```

## Roadmap de Fases

| Fase | Nome | Objetivo principal |
|---|---|---|
| 0 | Foundation | Monorepo, Docker Compose, infra base |
| 1 | CLI MVP | `scan`, `explain`, `flow` — CLI funcional |
| 2 | Parser Engine | AST COBOL robusto, dependency graph, métricas |
| 3 | RAG Engine | Embeddings, chunking inteligente, busca semântica |
| 4 | AI Runtime | Agentes LangGraph (Explainer, Dependency, Modernization, Docs) |
| 5 | Observabilidade | LangSmith tracing, evals, métricas de custo/latência |
| 6 | API Platform | REST + Streaming (SSE/WS) + Auth JWT/RBAC |
| 7 | Frontend | Next.js dashboard, chat, graph viewer, editor COBOL |
| 8 | Enterprise Runtime | Multi-tenant, workers/filas, Redis cache, retry |
| 9 | Modernization Engine | `generate-api`, `generate-docs`, sugestões Java/Node |
| 10 | AI Engineering Platform | MCP, multi-agent, memory, marketplace, modelos locais |

## Ponto de Partida Recomendado

**Fase 0 → Fase 1 → Fase 3** (Foundation + CLI MVP + RAG básico)

Isso já entrega: `opencobol scan`, `opencobol explain`, `opencobol ask` — um produto funcional e demonstrável.

## Comandos CLI Planejados

```bash
opencobol scan ./legacy          # detecta arquivos COBOL, copybooks, módulos
opencobol explain CUSTOMER.cbl   # explica regra de negócio via IA
opencobol flow PAYROLL.cbl       # gera fluxo textual do programa
opencobol deps                   # gera dependency graph
opencobol embed ./legacy         # gera embeddings para RAG
opencobol ask                    # chat semântico sobre o código legado
opencobol generate-api           # gera API REST equivalente
opencobol generate-docs          # gera documentação markdown
opencobol architecture           # gera diagrama de arquitetura
```

## Convenções de Código

- TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess: true`)
- ESM modules (`"type": "module"` em todos os packages)
- Testes com Vitest
- Linting com ESLint + Prettier
- Commits semânticos: `feat:`, `fix:`, `chore:`, `docs:`
- Cada package tem seu próprio `package.json` com `exports` mapeados
- Injeção de dependência via NestJS no backend; factory functions nos packages puros

## Agentes LangGraph (Fase 4)

- **Code Explainer Agent**: explica funções e regras de negócio
- **Dependency Agent**: mapeia impacto de mudanças e cadeia de chamadas
- **Modernization Agent**: sugere refatorações e APIs modernas equivalentes
- **Documentation Agent**: gera markdown e diagramas automaticamente

## Observabilidade (Fase 5)

- Todos os agentes LangGraph devem ser instrumentados com LangSmith callbacks
- Métricas expostas via OpenTelemetry → Prometheus → Grafana
- Evals obrigatórios: groundedness, relevance, faithfulness

## Infra Local (Desenvolvimento)

```bash
docker compose up -d   # sobe PostgreSQL, Qdrant, Redis, Grafana, Prometheus
```

## Notas Importantes

- Nunca implementar lógica de negócio diretamente na camada de transporte (CLI/API)
- O `parser-core` deve ser 100% puro (sem I/O, sem IA) — apenas AST
- O `rag-engine` abstrai o provider de embeddings (OpenAI, Cohere, local)
- Todos os agentes devem ser testáveis de forma isolada com mocks de LLM
