import * as vscode from 'vscode'

export function showMarkdownPanel(title: string, content: string, context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'opencobolResult',
    title,
    vscode.ViewColumn.Beside,
    { enableScripts: false },
  )

  panel.webview.html = buildHtml(title, content)
  return panel
}

function buildHtml(title: string, markdown: string): string {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px 28px;
      line-height: 1.6;
      max-width: 860px;
    }
    h1 { color: var(--vscode-textLink-foreground); font-size: 1.3em; margin-bottom: 4px; }
    pre {
      background: var(--vscode-textBlockQuote-background);
      border: 1px solid var(--vscode-textBlockQuote-border);
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
      white-space: pre-wrap;
    }
    hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 16px 0; }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.8em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <span class="badge">OpenCobol AI</span>
  </div>
  <pre>${escaped}</pre>
</body>
</html>`
}
