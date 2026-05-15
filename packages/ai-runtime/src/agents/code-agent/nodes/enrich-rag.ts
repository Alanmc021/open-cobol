import { retrieve } from '@opencobol/rag-engine'
import type { CodeAgentState } from '../state.js'

export async function enrichRagNode(state: CodeAgentState): Promise<Partial<CodeAgentState>> {
  if (state.error) return {}
  try {
    const programId = state.cobolMetadata?.programId ?? state.cobolMetadata?.name ?? 'unknown'
    const query = `${programId} data structures business rules calculations`
    const ragContexts = await retrieve(query, {
      qdrantUrl: state.options?.qdrantUrl ?? process.env['QDRANT_URL'] ?? 'http://localhost:6333',
      collection: state.options?.collection ?? process.env['QDRANT_COLLECTION'] ?? 'opencobol',
      topK: 10,
    })
    return { ragContexts }
  } catch {
    // RAG enrichment is best-effort — never block the pipeline
    return { ragContexts: [] }
  }
}
