import * as vscode from 'vscode'
import { indexDirectory } from '@opencobol/rag-engine'
import { getConfig } from '../utils/config.js'

export async function embedWorkspaceCommand() {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('OpenCobol: Open a workspace folder first.')
    return
  }

  const rootPath = folders[0]!.uri.fsPath
  const { apiKey, qdrantUrl, qdrantCollection } = getConfig()

  if (!apiKey) {
    vscode.window.showErrorMessage('OpenCobol: Set your OpenAI API key in settings or run opencobol init.')
    return
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'OpenCobol: Indexing workspace…',
      cancellable: false,
    },
    async (progress) => {
      try {
        let indexed = 0
        let skipped = 0

        for await (const event of indexDirectory(rootPath, {
          qdrantUrl,
          collection: qdrantCollection,
        })) {
          if (event.type === 'file') {
            indexed++
            progress.report({ message: `${event.file} (${indexed} indexed)` })
          } else if (event.type === 'skipped') {
            skipped++
          } else if (event.type === 'done') {
            vscode.window.showInformationMessage(
              `OpenCobol: ${event.total} files · ${event.indexed} chunks indexed · ${skipped} unchanged`,
            )
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`OpenCobol embed failed: ${(err as Error).message}`)
      }
    },
  )
}
