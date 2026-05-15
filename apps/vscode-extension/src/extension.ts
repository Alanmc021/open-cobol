import * as vscode from 'vscode'
import { applyConfig } from './utils/config.js'
import { registerChatParticipant } from './chat/participant.js'
import { registerHoverProvider } from './providers/hover.js'
import { registerCodeLensProvider } from './providers/codelens.js'
import { explainCommand } from './commands/explain.js'
import { docsCommand } from './commands/docs.js'
import { flowCommand } from './commands/flow.js'
import { modernizeCommand } from './commands/modernize.js'
import { embedWorkspaceCommand } from './commands/embedWorkspace.js'

export function activate(context: vscode.ExtensionContext) {
  applyConfig()

  // Chat participant (@opencobol in Copilot Chat)
  registerChatParticipant(context)

  // Hover provider (CALL / COPY tooltips)
  registerHoverProvider(context)

  // CodeLens (paragraph annotations)
  registerCodeLensProvider(context)

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('opencobol.explain', (uri?: vscode.Uri) =>
      explainCommand(uri, context),
    ),
    vscode.commands.registerCommand('opencobol.docs', (uri?: vscode.Uri) =>
      docsCommand(uri, context),
    ),
    vscode.commands.registerCommand('opencobol.flow', (uri?: vscode.Uri) =>
      flowCommand(uri, context),
    ),
    vscode.commands.registerCommand('opencobol.modernize', (uri?: vscode.Uri) =>
      modernizeCommand(uri, context),
    ),
    vscode.commands.registerCommand('opencobol.embedWorkspace', () =>
      embedWorkspaceCommand(),
    ),
  )

  vscode.window.setStatusBarMessage('$(database) OpenCobol AI ready', 3000)
}

export function deactivate() {}
