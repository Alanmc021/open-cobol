export type CobolFileType = 'program' | 'copybook' | 'jcl' | 'unknown'

export type DataSection = 'WORKING-STORAGE' | 'FILE' | 'LINKAGE' | 'LOCAL-STORAGE'

export interface DataField {
  level: number
  name: string
  pic: string | null
  usage: string | null
  value: string | null
  section: DataSection
}

export interface DataDivision {
  fields: DataField[]
  workingStorage: DataField[]
  linkage: DataField[]
  fileSection: DataField[]
}

export interface CobolFile {
  path: string
  name: string
  type: CobolFileType
  programId: string | null
  copybooks: string[]
  calls: string[]
  lines: number
  sizeBytes: number
  dataDivision?: DataDivision
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
