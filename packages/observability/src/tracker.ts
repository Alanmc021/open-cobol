export interface RunMetrics {
  command: string
  model: string
  durationMs: number
  success: boolean
  error?: string
  tokensUsed?: number
}

const runs: RunMetrics[] = []

export async function trackRun<T>(
  command: string,
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    runs.push({ command, model, durationMs: Date.now() - start, success: true })
    return result
  } catch (err) {
    runs.push({
      command,
      model,
      durationMs: Date.now() - start,
      success: false,
      error: (err as Error).message,
    })
    throw err
  }
}

export function getRunHistory(): RunMetrics[] {
  return [...runs]
}
