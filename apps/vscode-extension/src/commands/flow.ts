import * as vscode from 'vscode'
import { extractFlow } from '@opencobol/parser-core'
import { showMarkdownPanel } from '../utils/panel.js'

export async function flowCommand(uri: vscode.Uri | undefined, context: vscode.ExtensionContext) {
  const filePath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath

  if (!filePath) {
    vscode.window.showWarningMessage('OpenCobol: Open a COBOL file first.')
    return
  }

  try {
    const flow = extractFlow(filePath)
    const fileName = filePath.split('/').pop() ?? filePath

    const lines: string[] = [
      `PROGRAM: ${fileName}`,
      `PARAGRAPHS: ${flow.paragraphs.length}`,
      '',
    ]

    for (const para of flow.paragraphs) {
      lines.push(`▶ ${para.name}  (line ${para.lineStart + 1})`)
      if (para.performs.length > 0) {
        lines.push(`   PERFORMS: ${para.performs.join(', ')}`)
      }
      if (para.calls.length > 0) {
        lines.push(`   CALLS:    ${para.calls.join(', ')}`)
      }
      lines.push('')
    }

    showMarkdownPanel(`Flow: ${fileName}`, lines.join('\n'), context)
  } catch (err) {
    vscode.window.showErrorMessage(`OpenCobol flow failed: ${(err as Error).message}`)
  }
}
