import * as vscode from 'vscode'
import { runModernizationAgent } from '@opencobol/ai-runtime'
import { showMarkdownPanel } from '../utils/panel.js'
import { getConfig } from '../utils/config.js'

const LANG_OPTIONS = ['typescript', 'java', 'python', 'go']

export async function modernizeCommand(uri: vscode.Uri | undefined, context: vscode.ExtensionContext) {
  const filePath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath

  if (!filePath) {
    vscode.window.showWarningMessage('OpenCobol: Open a COBOL file first.')
    return
  }

  const lang = await vscode.window.showQuickPick(LANG_OPTIONS, {
    placeHolder: 'Target language for modernization plan',
  })
  if (!lang) return

  const { apiKey, model } = getConfig()
  if (!apiKey) {
    vscode.window.showErrorMessage('OpenCobol: Set your OpenAI API key in settings or run opencobol init.')
    return
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `OpenCobol: Generating ${lang} plan for ${filePath.split('/').pop()}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await runModernizationAgent(filePath, lang, { model })
        if (result.error) throw new Error(result.error)
        showMarkdownPanel(
          `Modernize → ${lang}: ${filePath.split('/').pop()}`,
          result.result ?? '',
          context,
        )
      } catch (err) {
        vscode.window.showErrorMessage(`OpenCobol modernize failed: ${(err as Error).message}`)
      }
    },
  )
}
