import type { Rule } from '@/types'

const rulesContainer = document.querySelector('#rules')!
const addButton = document.querySelector('#add')!

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

  const deleteBtn = document.createElement('button')
  deleteBtn.textContent = '✕'
  deleteBtn.addEventListener('click', () => {
    div.remove()
    save()
  })

  domainInput.addEventListener('input', save)
  textInput.addEventListener('input', save)

  div.append(domainInput, textInput, blinkLabel, deleteBtn)
  return div
}

function save() {
  const rows = rulesContainer.querySelectorAll('.rule')
  const rules: Rule[] = Array.from(rows).map((row) => {
    const inputs = row.querySelectorAll('input')
    return { domain: inputs[0].value.trim(), text: inputs[1].value.trim(), blink: inputs[2].checked }
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
  rulesContainer.appendChild(createRuleRow({ domain, text: '', blink: false }))
})

chrome.storage.sync.get('rules', (result: { rules?: Rule[] }) => {
  const rules = result.rules ?? []
  render(rules)
})
