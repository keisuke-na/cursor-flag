import type { Rule } from '@/types'
import { matchPatternToRegex } from '@/match'

const rulesContainer = document.querySelector('#rules')!
const addButton = document.querySelector('#add')!
const exportButton = document.querySelector('#export')!
const importButton = document.querySelector('#import')!

function suggestPatternFromUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}/*`
  } catch {
    return ''
  }
}

function validatePatternInput(input: HTMLInputElement) {
  const ok = input.value.trim() === '' || matchPatternToRegex(input.value.trim()) !== null
  input.style.borderColor = ok ? '' : '#f44336'
}

function createCheckbox(labelText: string, checked: boolean): { input: HTMLInputElement; label: HTMLLabelElement } {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = checked
  input.addEventListener('change', save)

  const label = document.createElement('label')
  label.textContent = ` ${labelText}`
  label.prepend(input)
  return { input, label }
}

function createRuleRow(rule: Rule) {
  const div = document.createElement('div')
  div.className = 'rule'

  const patternInput = document.createElement('input')
  patternInput.placeholder = 'Match pattern (e.g. https://*.example.com/*)'
  patternInput.value = rule.pattern
  validatePatternInput(patternInput)

  const textInput = document.createElement('input')
  textInput.placeholder = 'Label text'
  textInput.value = rule.text

  const blink = createCheckbox('Blink', rule.blink)
  const heartbeat = createCheckbox('Heartbeat', rule.heartbeat)
  const errorCounter = createCheckbox('ERR', rule.errorCounter)

  const deleteBtn = document.createElement('button')
  deleteBtn.textContent = '✕'
  deleteBtn.addEventListener('click', () => {
    div.remove()
    save()
  })

  patternInput.addEventListener('input', () => {
    validatePatternInput(patternInput)
    save()
  })
  textInput.addEventListener('input', save)

  div.append(patternInput, textInput, blink.label, heartbeat.label, errorCounter.label, deleteBtn)
  return div
}

function save() {
  const rows = rulesContainer.querySelectorAll('.rule')
  const rules: Rule[] = Array.from(rows).map((row) => {
    const inputs = row.querySelectorAll('input')
    return { pattern: inputs[0].value.trim(), text: inputs[1].value.trim(), blink: inputs[2].checked, heartbeat: inputs[3].checked, errorCounter: inputs[4].checked }
  }).filter((r) => r.pattern && r.text && matchPatternToRegex(r.pattern) !== null)

  chrome.storage.sync.set({ rules })
}

function render(rules: Rule[]) {
  rulesContainer.innerHTML = ''
  for (const rule of rules) {
    rulesContainer.appendChild(createRuleRow(rule))
  }
}

addButton.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const pattern = suggestPatternFromUrl(tab?.url)
  rulesContainer.appendChild(createRuleRow({ pattern, text: '', blink: false, heartbeat: false, errorCounter: false }))
})

exportButton.addEventListener('click', () => {
  chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
    const blob = new Blob([JSON.stringify(result.rules ?? [], null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cursor-flag-rules.json'
    a.click()
    URL.revokeObjectURL(a.href)
  })
})

importButton.addEventListener('click', () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const imported: Rule[] = JSON.parse(reader.result as string)
      chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
        const merged = [...(result.rules ?? []), ...imported]
        chrome.storage.sync.set({ rules: merged }, () => render(merged))
      })
    }
    reader.readAsText(file)
  })
  input.click()
})

chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
  const rules = result.rules ?? []
  render(rules)
})