const escapeRegex = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
const wildcardToRegex = (s: string) => s.split('*').map(escapeRegex).join('.*')

export function matchPatternToRegex(pattern: string): RegExp | null {
  if (pattern === '<all_urls>') return /^(https?|ftp|file):\/\/.*/

  const m = pattern.match(/^([^:]+):\/\/([^/]*)(\/.*)$/)
  if (!m) return null
  const [, scheme, host, path] = m
  if (!host && scheme !== 'file') return null

  const schemeRe = scheme === '*' ? '(https?|ftp|file)' : escapeRegex(scheme)
  try {
    return new RegExp(`^${schemeRe}:\\/\\/${wildcardToRegex(host)}${wildcardToRegex(path)}$`)
  } catch {
    return null
  }
}

export function matchesUrl(pattern: string, url: string): boolean {
  const re = matchPatternToRegex(pattern)
  return re ? re.test(url) : false
}
