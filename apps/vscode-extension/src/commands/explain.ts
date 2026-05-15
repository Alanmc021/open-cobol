import * as vscode from 'vscode'
import { runExplainerAgent } from '@opencobol/ai-runtime'
import { showMarkdownPanel } from '../utils/panel.js'
import { getConfig } from '../utils/config.js'

export async function explainCommand(uri: vscode.Uri | undefined, context: vscode.ExtensionContext) {
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
      title: `OpenCobol: Explaining ${filePath.split('/').pop()}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await runExplainerAgent(filePath, { model })
        if (result.error) throw new Error(result.error)
        showMarkdownPanel(
          `Explain: ${filePath.split('/').pop()}`,
          result.result ?? '',
          context,
        )
      } catch (err) {
        vscode.window.showErrorMessage(`OpenCobol explain failed: ${(err as Error).message}`)
      }
    },
  )
}
