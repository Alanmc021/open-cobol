export interface CobolParagraph {
  name: string
  performs: string[]
  calls: string[]
  lineStart: number
  lineEnd: number
}

export interface FlowResult {
  programId: string | null
  fileName: string
  entryPoint: string | null
  paragraphs: CobolParagraph[]
}
