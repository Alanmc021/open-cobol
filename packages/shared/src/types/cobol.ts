export type CobolFileType = 'program' | 'copybook' | 'jcl' | 'unknown'

export interface CobolFile {
  path: string
  name: string
  type: CobolFileType
  programId: string | null
  copybooks: string[]
  calls: string[]
  lines: number
  sizeBytes: number
}

export interface ScanResult {
  rootPath: string
  files: CobolFile[]
  durationMs: number
  stats: {
    programs: number
    copybooks: number
    jcl: number
    unknown: number
    totalLines: number
    totalSizeBytes: number
  }
}

export interface CopybookDependency {
  copybook: string
  usedBy: string[]
}

export interface CallDependency {
  target: string
  calledBy: Array<{ file: string; count: number }>
}
