const origConsoleError = console.error
console.error = function (...args: unknown[]) {
  window.postMessage({ type: 'cursor-flag-error', kind: 'js' }, '*')
  origConsoleError.apply(console, args)
}

window.addEventListener('error', () => {
  window.postMessage({ type: 'cursor-flag-error', kind: 'js' }, '*')
})
window.addEventListener('unhandledrejection', () => {
  window.postMessage({ type: 'cursor-flag-error', kind: 'js' }, '*')
})

const origFetch = window.fetch
window.fetch = function (...args: Parameters<typeof fetch>) {
  return origFetch.apply(this, args).then((res) => {
    if (res.status >= 400) window.postMessage({ type: 'cursor-flag-error', kind: 'ne' }, '*')
    return res
  }, (err) => {
    window.postMessage({ type: 'cursor-flag-error', kind: 'ne' }, '*')
    throw err
  })
}

const origXhr = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
  this.addEventListener('load', function (this: XMLHttpRequest) {
    if (this.status >= 400) window.postMessage({ type: 'cursor-flag-error', kind: 'ne' }, '*')
  })
  ;(origXhr as Function).apply(this, args)
}
