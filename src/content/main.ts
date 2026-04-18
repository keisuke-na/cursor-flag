import type { Rule } from '@/types'
import { matchesUrl } from '@/match'
import { resolveColors, toHsl } from '@/color'

let label: HTMLDivElement | null = null
let style: HTMLStyleElement | null = null
let errorCounterEl: HTMLDivElement | null = null
const errorCounts = { js: 0, ne: 0 }

window.addEventListener('message', (e) => {
  if (e.data?.type === 'cursor-flag-error') {
    const kind = e.data.kind as 'js' | 'ne'
    errorCounts[kind]++
    updateErrorCounter()
  }
})

function errorColor(count: number): string {
  if (count === 0) return '#4caf50'
  if (count <= 3) return '#ff9800'
  return '#f44336'
}

function updateErrorCounter() {
  if (!errorCounterEl) return
  const spans = errorCounterEl.querySelectorAll('span')
  const entries = [
    { label: 'JS', count: errorCounts.js },
    { label: 'NE', count: errorCounts.ne },
  ]
  entries.forEach((e, i) => {
    spans[i].textContent = `${e.label}:${e.count}`
    spans[i].style.color = errorColor(e.count)
  })
}

function createErrorCounter(): HTMLDivElement {
  const counter = document.createElement('div')
  Object.assign(counter.style, {
    fontSize: '10px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '2px',
  })
  for (const label of ['JS:0', 'NE:0']) {
    const s = document.createElement('span')
    s.textContent = label
    s.style.color = '#4caf50'
    counter.appendChild(s)
  }
  return counter
}

function createLabel(rule: Rule) {
  const { text, blink, heartbeat, errorCounter } = rule
  const { bg, fg } = resolveColors(rule)
  if (!style) {
    style = document.createElement('style')
    style.textContent = `@keyframes cursor-flag-blink { 0%,100%{visibility:visible} 50%{visibility:hidden} } @keyframes cursor-flag-heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.15)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 56%{transform:scale(1)} }`
    document.documentElement.appendChild(style)
  }

  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    display: 'none',
  })

  if (errorCounter) {
    errorCounterEl = createErrorCounter()
    wrapper.appendChild(errorCounterEl)
    updateErrorCounter()
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
    background: toHsl(bg, 0.9),
    color: toHsl(fg),
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    fontFamily: 'sans-serif',
  })
  wrapper.appendChild(el)
  document.documentElement.appendChild(wrapper)
  return wrapper
}

function onMouseMove(e: MouseEvent) {
  if (!label) return
  label.style.display = 'block'
  label.style.transform = `translate(${e.clientX + 28}px, ${e.clientY + 28}px)`
  label.style.left = '0'
  label.style.top = '0'
}

function init() {
  chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
    const rules = result.rules ?? []
    const matched = rules.find((r) => matchesUrl(r.pattern, location.href))
    if (!matched) return

    label = createLabel(matched)
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
