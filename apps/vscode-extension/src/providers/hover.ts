import * as vscode from 'vscode'
import { scanDirectory } from '@opencobol/parser-core'

// Cache scan results per workspace to avoid rescanning on every hover
const scanCache = new Map<string, ReturnType<typeof scanDirectory>>()

function getScanResult(workspaceRoot: string) {
  if (!scanCache.has(workspaceRoot)) {
    try {
      scanCache.set(workspaceRoot, scanDirectory(workspaceRoot))
    } catch {
      return null
    }
  }
  return scanCache.get(workspaceRoot) ?? null
}

export function registerHoverProvider(context: vscode.ExtensionContext) {
  // Invalidate cache when files change
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{cbl,cob,cpy,CBL,COB}')
  watcher.onDidChange(() => scanCache.clear())
  watcher.onDidCreate(() => scanCache.clear())
  watcher.onDidDelete(() => scanCache.clear())
  context.subscriptions.push(watcher)

  const provider = vscode.languages.registerHoverProvider(
    { language: 'cobol' },
    {
      provideHover(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /[A-Z0-9][A-Z0-9-]*/i)
        if (!wordRange) return

        const word = document.getText(wordRange).toUpperCase()
        const line = document.lineAt(position.line).text.toUpperCase()

        const isCall = /\bCALL\s+['"]?/.test(line.slice(0, wordRange.start.character + word.length))
        const isCopy = /\bCOPY\s+/.test(line.slice(0, wordRange.start.character + word.length))

        if (!isCall && !isCopy) return

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        if (!workspaceRoot) return

        const scan = getScanResult(workspaceRoot)
        if (!scan) return

        const target = scan.files.find(
          (f) =>
            f.name.toUpperCase().replace(/\.(CBL|COB|COBOL|CPY|COPY)$/, '') === word ||
            f.programId === word,
        )

        if (!target) return

        const md = new vscode.MarkdownString()
        md.isTrusted = true
        md.appendMarkdown(`**OpenCobol AI** — \`${target.name}\`\n\n`)
        md.appendMarkdown(`| | |\n|---|---|\n`)
        md.appendMarkdown(`| Type | ${target.type} |\n`)
        md.appendMarkdown(`| Lines | ${target.lines} |\n`)
        if (target.copybooks.length > 0) md.appendMarkdown(`| Copybooks | ${target.copybooks.join(', ')} |\n`)
        if (target.calls.length > 0) md.appendMarkdown(`| Calls | ${target.calls.join(', ')} |\n`)

        const fileUri = vscode.Uri.file(target.path)
        md.appendMarkdown(`\n[Open file](${fileUri.toString()})`)

        return new vscode.Hover(md, wordRange)
      },
    },
  )

  context.subscriptions.push(provider)
}
