import * as vscode from 'vscode'
import { runDocsAgent } from '@opencobol/ai-runtime'
import { showMarkdownPanel } from '../utils/panel.js'
import { getConfig } from '../utils/config.js'

export async function docsCommand(uri: vscode.Uri | undefined, context: vscode.ExtensionContext) {
  const filePath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath

  if (!filePath) {
    vscode.window.showWarningMessage('OpenCobol: Open a COBOL file first.')
    return
  }

  const { apiKey, model } = getConfig()
  if (!apiKey) {
    vscode.window.showErrorMessage('OpenCobol: Set your OpenAI API key in settings or run opencobol init.')
    return
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `OpenCobol: Generating docs for ${filePath.split('/').pop()}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await runDocsAgent(filePath, { model })
        if (result.error) throw new Error(result.error)

        const doc = result.result ?? ''
        showMarkdownPanel(`Docs: ${filePath.split('/').pop()}`, doc, context)

        const save = await vscode.window.showInformationMessage(
          'Documentation generated. Save to file?',
          'Save',
          'Dismiss',
        )

        if (save === 'Save') {
          const defaultName = filePath.replace(/\.(cbl|cob|cobol)$/i, '.md')
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultName),
            filters: { Markdown: ['md'] },
          })
          if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(doc))
            vscode.window.showInformationMessage(`Saved to ${saveUri.fsPath}`)
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`OpenCobol docs failed: ${(err as Error).message}`)
      }
    },
  )
}
