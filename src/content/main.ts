import type { Rule } from '@/types'

let label: HTMLDivElement | null = null
let style: HTMLStyleElement | null = null

function textToHue(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ((hash % 360) + 360) % 360
}

function createLabel(text: string, blink: boolean, heartbeat: boolean) {
  if (!style) {
    style = document.createElement('style')
    style.textContent = `@keyframes cursor-flag-blink { 0%,100%{visibility:visible} 50%{visibility:hidden} } @keyframes cursor-flag-heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.15)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 56%{transform:scale(1)} }`
    document.documentElement.appendChild(style)
  }

  const el = document.createElement('div')
  const span = document.createElement('span')
  span.style.display = 'inline-block'
  span.textContent = text
  const animations: string[] = []
  if (blink) animations.push('cursor-flag-blink 0.6s step-end infinite')
  if (heartbeat) animations.push('cursor-flag-heartbeat 1.7s ease-in-out infinite')
  if (animations.length) span.style.animation = animations.join(', ')
  el.appendChild(span)
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    background: `hsla(${textToHue(text)}, 70%, 45%, 0.9)`,
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    fontFamily: 'sans-serif',
    display: 'none',
  })
  document.documentElement.appendChild(el)
  return el
}

function onMouseMove(e: MouseEvent) {
  if (!label) return
  label.style.display = 'block'
  label.style.transform = `translate(${e.clientX + 28}px, ${e.clientY + 28}px)`
  label.style.left = '0'
  label.style.top = '0'
}

function init() {
  const hostname = location.hostname

  chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
    const rules = result.rules ?? []
    const matched = rules.find((r) => hostname === r.domain)
    if (!matched) return

    label = createLabel(matched.text, matched.blink, matched.heartbeat)
    document.addEventListener('mousemove', onMouseMove)
  })
}

chrome.storage.onChanged.addListener(() => {
  if (label) {
    label.remove()
    label = null
    document.removeEventListener('mousemove', onMouseMove)
  }
  if (style) {
    style.remove()
    style = null
  }
  init()
})

init()
