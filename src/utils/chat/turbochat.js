import axios from "axios"
import { buildPrompt } from "../../lib/myfunc.js"

const BASE_URL = "https://theturbochat.com"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
]

const FIXED_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildHeaders() {
  return {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
    "Content-Type": "application/json",
    "Origin": BASE_URL,
    "Referer": `${BASE_URL}/`,
    "User-Agent": FIXED_UA,
    "Connection": "keep-alive"
  }
}

async function postWithRetry(url, payload, retries = 3) {
  try {
    return await axios.post(url, payload, {
      headers: buildHeaders(),
      timeout: 30000
    })
  } catch (err) {
    if (err.response && err.response.status === 429 && retries > 0) {
      const delay = 2000 + Math.random() * 3000
      await sleep(delay)
      return postWithRetry(url, payload, retries - 1)
    }
    throw err
  }
}

export const turbochat = {
  async chat(messages, options = {}) {
    const { model = "gpt-3.5-turbo", language = "en" } = options
    const prompt = buildPrompt(messages)

    await sleep(1500 + Math.random() * 1500)

    try {
      const response = await postWithRetry(
        `${BASE_URL}/chat`,
        {
          message: prompt,
          model,
          language
        }
      )

      return response.data.choices[0].message.content
    } catch (e) {
      return `Error: ${e.message}`
    }
  }
}