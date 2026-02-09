// utils/dolphin-ai.js
import fetch from 'node-fetch'
import { buildPrompt } from '../../lib/myfunc.js'

const TEMPLATES = ['logical', 'creative', 'summarize', 'code-beginner', 'code-advanced']
const DEFAULT_MODEL = 'dolphinserver:24B'
const DEFAULT_TEMPLATE = 'logical'

async function _dolphinAI(messages, opts = {}) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return 'Error: Input kosong'
  }

  try {
    const prompt = buildPrompt(messages) 
    const model = opts.model || DEFAULT_MODEL
    const template = TEMPLATES.includes(opts.template)
      ? opts.template
      : DEFAULT_TEMPLATE

    const res = await fetch('https://chat.dphn.ai/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model,
        template
      })
    })

    if (!res.ok) throw new Error(`Server Error ${res.status}`)

    const raw = await res.text()

    const result = raw
      .split('\n')
      .filter(line => line.startsWith('data: '))
      .map(line => {
        try {
          return JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''
        } catch {
          return ''
        }
      })
      .join('')
      .trim()

    if (!result) return 'Error: Empty Response'
    return result
  } catch (e) {
    return `Error: ${e.message}`
  }
}

export const dolphinai = {
  chat: _dolphinAI
}
