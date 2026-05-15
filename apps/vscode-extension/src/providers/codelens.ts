import * as vscode from 'vscode'
import { extractFlow } from '@opencobol/parser-core'

export function registerCodeLensProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCodeLensProvider(
    { language: 'cobol' },
    {
      provideCodeLenses(document) {
        const filePath = document.uri.fsPath
        const lenses: vscode.CodeLens[] = []

        try {
          const flow = extractFlow(filePath)
          // Find PROCEDURE DIVISION offset
          let procOffset = 0
          for (let i = 0; i < document.lineCount; i++) {
            if (/\bPROCEDURE\s+DIVISION\b/i.test(document.lineAt(i).text)) {
              procOffset = i + 1
              break
            }
          }

          for (const para of flow.paragraphs) {
            const line = procOffset + para.lineStart
            if (line >= document.lineCount) continue

            const range = new vscode.Range(line, 0, line, 0)
            const parts: string[] = []

            if (para.performs.length > 0) parts.push(`⤷ ${para.performs.length} performs`)
            if (para.calls.length > 0) parts.push(`📞 ${para.calls.length} calls`)
            if (parts.length === 0) parts.push('no outbound calls')

            lenses.push(
              new vscode.CodeLens(range, {
                title: parts.join('  ·  '),
                command: 'opencobol.flow',
                arguments: [document.uri],
                tooltip: `Paragraph: ${para.name}\nPerforms: ${para.performs.join(', ') || 'none'}\nCalls: ${para.calls.join(', ') || 'none'}`,
              }),
            )
          }
        } catch {
          // Not a parseable COBOL file
        }

        return lenses
      },
    },
  )

  context.subscriptions.push(provider)
}
