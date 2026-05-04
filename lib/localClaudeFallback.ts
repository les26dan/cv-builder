/**
 * Local Claude CLI fallback.
 *
 * Spawns the `claude -p` subprocess to run prompts using the developer's
 * local Claude Code session. DEV-ONLY — used as a fallback when OpenAI
 * billing is unavailable. Not suitable for production: requires the
 * `claude` CLI to be installed AND logged in on the host running this code.
 *
 * Gated by env var LOCAL_CLAUDE_FALLBACK=1.
 */
import { spawn } from 'child_process'

export function isLocalClaudeFallbackEnabled(): boolean {
  return process.env.LOCAL_CLAUDE_FALLBACK === '1'
}

interface ClaudeJsonResult {
  type: string
  subtype: string
  is_error: boolean
  result: string
}

/**
 * Run a single prompt through `claude -p` and return its raw text result.
 * Uses --output-format json so we can reliably extract the assistant's reply.
 */
export async function runLocalClaude(
  prompt: string,
  opts: { model?: string; timeoutMs?: number } = {},
): Promise<string> {
  const model = opts.model || 'haiku'
  const timeoutMs = opts.timeoutMs ?? 30_000

  return new Promise((resolve, reject) => {
    const args = ['-p', '--model', model, '--output-format', 'json', prompt]
    const child = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`local claude timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })
    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', code => {
      clearTimeout(timer)
      if (code !== 0) {
        return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500)}`))
      }
      try {
        const parsed = JSON.parse(stdout) as ClaudeJsonResult
        if (parsed.is_error) {
          return reject(new Error(`claude returned error: ${parsed.result}`))
        }
        resolve(parsed.result || '')
      } catch (err: any) {
        reject(new Error(`failed to parse claude json: ${err.message}; raw: ${stdout.slice(0, 300)}`))
      }
    })
  })
}

/**
 * Strip markdown code fences and parse JSON. Tolerates {"alternatives": [...]}
 * or a bare array. Falls back to newline-split if JSON fails.
 */
export function parseAlternativesFromClaude(raw: string): string[] {
  const trimmed = raw.trim()

  // Try several extraction strategies in order of strictness.
  const candidates: string[] = []

  // 1. JSON inside ```json ... ``` fence
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedJson) candidates.push(fencedJson[1].trim())

  // 2. First {...} object found anywhere in the text
  const objMatch = trimmed.match(/\{[\s\S]*?"alternatives"[\s\S]*?\]\s*\}/i)
  if (objMatch) candidates.push(objMatch[0])

  // 3. Whole string with fences stripped
  candidates.push(trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim())

  for (const cand of candidates) {
    try {
      const parsed = JSON.parse(cand)
      if (Array.isArray(parsed?.alternatives)) {
        const alts = parsed.alternatives
          .filter((s: any) => typeof s === 'string' && s.trim())
          .map((s: string) => s.trim())
        if (alts.length > 0) return alts
      }
      if (Array.isArray(parsed)) {
        const alts = parsed
          .filter((s: any) => typeof s === 'string' && s.trim())
          .map((s: string) => s.trim())
        if (alts.length > 0) return alts
      }
    } catch {
      // try next candidate
    }
  }

  // Last-ditch fallback: newline-split, strip bullet/number prefixes
  const lines = trimmed
    .split('\n')
    .map(l => l.replace(/^\s*[-•*]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(l => l.length > 0)
  return lines.length > 0 ? lines : [trimmed]
}

/**
 * Convenience wrapper: run a prompt and parse 4-alternatives JSON output.
 */
export async function runLocalClaudeAlternatives(
  prompt: string,
  opts?: { model?: string; timeoutMs?: number },
): Promise<string[]> {
  const raw = await runLocalClaude(prompt, opts)
  return parseAlternativesFromClaude(raw)
}
