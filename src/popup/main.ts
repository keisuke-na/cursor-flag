import type { Rule } from '@/types'

const rulesContainer = document.querySelector('#rules')!
const addButton = document.querySelector('#add')!
const exportButton = document.querySelector('#export')!
const importButton = document.querySelector('#import')!

function createRuleRow(rule: Rule) {
  const div = document.createElement('div')
  div.className = 'rule'

  const domainInput = document.createElement('input')
  domainInput.placeholder = 'Domain (e.g. example.com)'
  domainInput.value = rule.domain

  const textInput = document.createElement('input')
  textInput.placeholder = 'Label text'
  textInput.value = rule.text

  const blinkInput = document.createElement('input')
  blinkInput.type = 'checkbox'
  blinkInput.checked = rule.blink
  blinkInput.addEventListener('change', save)

  const blinkLabel = document.createElement('label')
  blinkLabel.textContent = ' Blink'
  blinkLabel.prepend(blinkInput)

  const heartbeatInput = document.createElement('input')
  heartbeatInput.type = 'checkbox'
  heartbeatInput.checked = rule.heartbeat
  heartbeatInput.addEventListener('change', save)

  const heartbeatLabel = document.createElement('label')
  heartbeatLabel.textContent = ' Heartbeat'
  heartbeatLabel.prepend(heartbeatInput)

  const errorCounterInput = document.createElement('input')
  errorCounterInput.type = 'checkbox'
  errorCounterInput.checked = rule.errorCounter
  errorCounterInput.addEventListener('change', save)

  const errorCounterLabel = document.createElement('label')
  errorCounterLabel.textContent = ' ERR'
  errorCounterLabel.prepend(errorCounterInput)

  const deleteBtn = document.createElement('button')
  deleteBtn.textContent = '✕'
  deleteBtn.addEventListener('click', () => {
    div.remove()
    save()
  })

  domainInput.addEventListener('input', save)
  textInput.addEventListener('input', save)

  div.append(domainInput, textInput, blinkLabel, heartbeatLabel, errorCounterLabel, deleteBtn)
  return div
}

function save() {
  const rows = rulesContainer.querySelectorAll('.rule')
  const rules: Rule[] = Array.from(rows).map((row) => {
    const inputs = row.querySelectorAll('input')
    return { domain: inputs[0].value.trim(), text: inputs[1].value.trim(), blink: inputs[2].checked, heartbeat: inputs[3].checked, errorCounter: inputs[4].checked }
  }).filter((r) => r.domain && r.text)

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
  const domain = tab?.url ? new URL(tab.url).hostname : ''
  rulesContainer.appendChild(createRuleRow({ domain, text: '', blink: false, heartbeat: false, errorCounter: false }))
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
