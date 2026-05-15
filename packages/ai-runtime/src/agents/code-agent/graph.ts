import { END, START, StateGraph } from '@langchain/langgraph'
import { CodeAgentAnnotation, type CodeAgentState } from './state.js'
import { analyzeNode } from './nodes/analyze.js'
import { enrichRagNode } from './nodes/enrich-rag.js'
import { extractRulesNode } from './nodes/extract-rules.js'
import { genTestsNode } from './nodes/gen-tests.js'
import { genCodeNode } from './nodes/gen-code.js'
import { validateNode } from './nodes/validate.js'
import { fixCodeNode } from './nodes/fix-code.js'
import { writeFilesNode } from './nodes/write-files.js'
import { summarizeNode } from './nodes/summarize.js'
import { createCheckpointer } from './checkpointer.js'

export function buildCodeAgentGraph() {
  const checkpointer = createCheckpointer()

  return new StateGraph(CodeAgentAnnotation)
    .addNode('analyze', analyzeNode)
    .addNode('enrich-rag', enrichRagNode)
    .addNode('extract-rules', (state) => extractRulesNode(state))
    .addNode('gen-tests', (state) => genTestsNode(state))
    .addNode('gen-code', (state) => genCodeNode(state))
    .addNode('validate', validateNode)
    .addNode('fix-code', (state) => fixCodeNode(state))
    .addNode('write-files', writeFilesNode)
    .addNode('summarize', summarizeNode)
    .addEdge(START, 'analyze')
    .addEdge('analyze', 'enrich-rag')
    .addEdge('enrich-rag', 'extract-rules')
    .addEdge('extract-rules', 'gen-tests')
    .addEdge('gen-tests', 'gen-code')
    .addEdge('gen-code', 'validate')
    .addConditionalEdges('validate', (state: CodeAgentState) => {
      const max = state.options?.maxRetries ?? 3
      if (!state.validationResult?.passed && state.iteration < max) return 'fix-code'
      return 'write-files'
    })
    .addEdge('fix-code', 'validate')
    .addEdge('write-files', 'summarize')
    .addEdge('summarize', END)
    .compile({ checkpointer })
}
