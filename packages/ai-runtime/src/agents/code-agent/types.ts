import type { AgentRunOptions } from '../types.js'

export interface CodeAgentInput {
  filePath: string
  targetLanguage: 'typescript' | 'java' | 'python' | 'go' | 'cobol'
  outputDir: string
  options?: CodeAgentOptions
}

export interface CodeAgentOptions extends AgentRunOptions {
  maxRetries?: number
  autoApprove?: boolean
  validate?: boolean
  qdrantUrl?: string
  collection?: string
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  sourceLocation: string
  inputs: string[]
  outputs: string[]
  invariants?: string[]
}

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface ValidationResult {
  passed: boolean
  testCount: number
  passCount: number
  failCount: number
  errors: string[]
}

export type AgentPhase =
  | 'analyzing'
  | 'enriching'
  | 'extracting-rules'
  | 'generating-tests'
  | 'generating-code'
  | 'validating'
  | 'fixing'
  | 'writing'
  | 'done'
  | 'error'
