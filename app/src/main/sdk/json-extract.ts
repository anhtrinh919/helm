/**
 * Pull the first balanced {...} object out of a model turn, tolerating code
 * fences and surrounding prose. Shared by the wizard (scoping questions / plan)
 * and the build-session transformer (genuine-decision markers) so both parse
 * agent JSON the same battle-tested way without a circular import.
 */
export function extractJson(text: string): unknown | null {
  const cleaned = text.replace(/```[a-z]*/gi, '').replace(/```/g, '')
  const start = cleaned.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
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
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}
