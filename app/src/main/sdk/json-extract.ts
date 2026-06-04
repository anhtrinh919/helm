/**
 * JSON extraction shared by the wizard (scoping questions / plan) and the
 * build-session transformer (genuine-decision markers) so both parse agent JSON
 * the same battle-tested way without a circular import.
 */

/**
 * Given a '{' at `start`, return the index just past its matching '}', tracking
 * string literals and escapes so braces inside strings don't count. Returns -1
 * if the object never closes (unbalanced).
 */
export function matchBalanced(text: string, start: number): number {
  if (text[start] !== '{') return -1
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

/** Strip code fences so a fenced ```json { ... } ``` block parses cleanly. */
function stripFences(text: string): string {
  return text.replace(/```[a-z]*/gi, '').replace(/```/g, '')
}

/** Pull the first balanced {...} object out of a model turn, tolerating fences/prose. */
export function extractJson(text: string): unknown | null {
  const cleaned = stripFences(text)
  const start = cleaned.indexOf('{')
  if (start < 0) return null
  const end = matchBalanced(cleaned, start)
  if (end < 0) return null
  try {
    return JSON.parse(cleaned.slice(start, end))
  } catch {
    return null
  }
}

/**
 * Split a model turn into (a) the prose with every JSON object removed and (b)
 * the parsed JSON objects, in order. Fail-closed: an unbalanced '{' truncates
 * the prose there so a half-written JSON fragment can never reach the renderer.
 * Used by the build-session transformer to keep raw JSON out of narration.
 */
export function splitJson(text: string): { prose: string; objects: unknown[] } {
  const cleaned = stripFences(text)
  const objects: unknown[] = []
  let prose = ''
  let i = 0
  while (i < cleaned.length) {
    const brace = cleaned.indexOf('{', i)
    if (brace < 0) {
      prose += cleaned.slice(i)
      break
    }
    prose += cleaned.slice(i, brace)
    const end = matchBalanced(cleaned, brace)
    if (end < 0) break // unbalanced — drop the rest (fail closed)
    try {
      objects.push(JSON.parse(cleaned.slice(brace, end)))
    } catch {
      /* malformed JSON object — drop it, never narrate raw braces */
    }
    i = end
  }
  return { prose: prose.trim(), objects }
}
