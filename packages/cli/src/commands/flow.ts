import { Command } from 'commander'
import chalk from 'chalk'
import { resolve } from 'node:path'
import { extractFlow } from '@opencobol/parser-core'
import type { FlowResult, CobolParagraph } from '@opencobol/shared'

const BRAND = chalk.bold.hex('#00D4FF')
const DIM = chalk.dim
const LABEL = chalk.bold.white
const PARA_COLOR = chalk.bold.green
const CALL_COLOR = chalk.magenta
const ENTRY_BADGE = chalk.bold.bgGreen.black(' ENTRY ')

// Tree drawing characters
const T = {
  branch: '├─',
  last: '└─',
  pipe: '│ ',
  space: '  ',
}

interface TreeNode {
  label: string
  children: TreeNode[]
}

function buildTree(
  paraName: string,
  paraMap: Map<string, CobolParagraph>,
  visited: Set<string>,
): TreeNode {
  const para = paraMap.get(paraName)

  if (!para || visited.has(paraName)) {
    return {
      label: visited.has(paraName)
        ? `${PARA_COLOR(paraName)} ${DIM('(↺ recursive)')}`
        : `${PARA_COLOR(paraName)} ${DIM('(external)')}`,
      children: [],
    }
  }

  visited.add(paraName)

  const children: TreeNode[] = []

  // Interleave performs and calls in order they appear (performs first per paragraph convention)
  for (const target of para.performs) {
    children.push(buildTree(target, paraMap, new Set(visited)))
  }
  for (const call of para.calls) {
    children.push({
      label: `${CALL_COLOR('CALL')} ${chalk.yellow(call)}`,
      children: [],
    })
  }

  return { label: PARA_COLOR(paraName), children }
}

function renderTree(node: TreeNode, prefix = '', isLast = true): string[] {
  const connector = isLast ? T.last : T.branch
  const lines = [`${prefix}${connector} ${node.label}`]
  const childPrefix = prefix + (isLast ? T.space : T.pipe)

  node.children.forEach((child, i) => {
    const last = i === node.children.length - 1
    lines.push(...renderTree(child, childPrefix, last))
  })

  return lines
}

function renderFlow(result: FlowResult, file: string): void {
  console.log()
  console.log(BRAND('  ██████  OpenCobol AI — Flow'))
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()
  console.log(`  ${LABEL('Program')}     ${BRAND(result.programId ?? result.fileName.replace(/\.[^.]+$/, ''))}`)
  console.log(`  ${LABEL('File')}        ${chalk.cyan(file)}`)
  console.log(`  ${LABEL('Paragraphs')} ${result.paragraphs.length}`)
  console.log(`  ${LABEL('Entry')}       ${result.entryPoint ? PARA_COLOR(result.entryPoint) : DIM('unknown')}`)
  console.log()
  console.log(DIM('  ─────────────────────────────────────'))
  console.log()

  if (result.paragraphs.length === 0) {
    console.log(DIM('  No PROCEDURE DIVISION found.'))
    return
  }

  const paraMap = new Map(result.paragraphs.map((p) => [p.name, p]))
  const entryPoint = result.entryPoint

  // Root label
  const programLabel = `${BRAND(result.programId ?? result.fileName)} ${ENTRY_BADGE}`
  console.log(`  ${programLabel}`)

  if (entryPoint) {
    const root = buildTree(entryPoint, paraMap, new Set())
    const treeLines = renderTree(root, '', true)
    for (const line of treeLines) {
      console.log(`  ${line}`)
    }
  }

  console.log()

  // Orphan paragraphs (not reachable from entry point)
  const reachable = new Set<string>()
  function markReachable(name: string) {
    if (reachable.has(name)) return
    reachable.add(name)
    const para = paraMap.get(name)
    if (para) para.performs.forEach(markReachable)
  }
  if (entryPoint) markReachable(entryPoint)

  const orphans = result.paragraphs.filter((p) => !reachable.has(p.name))
  if (orphans.length > 0) {
    console.log(DIM(`  ─ Unreachable paragraphs ─────────────`))
    for (const p of orphans) {
      console.log(`  ${DIM(T.last)} ${chalk.dim(p.name)}`)
    }
    console.log()
  }
}

export const flowCommand = new Command('flow')
  .description('Generate the execution flow tree of a COBOL program')
  .argument('<file>', 'Path to the COBOL file')
  .option('--json', 'Output raw JSON')
  .action((filePath: string, options: { json?: boolean }) => {
    const resolvedPath = resolve(filePath)

    try {
      const result = extractFlow(resolvedPath)

      if (options.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        return
      }

      renderFlow(result, resolvedPath)
    } catch (err) {
      console.error(chalk.red(`Flow failed: ${(err as Error).message}`))
      process.exitCode = 1
    }
  })
