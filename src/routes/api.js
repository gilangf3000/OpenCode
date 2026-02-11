import express from "express"
import crypto from "crypto"
import { turbochat } from "../utils/chat/turbochat.js"
import { dolphinai } from "../utils/chat/dolphinai.js"
import { gemini } from "../utils/chat/gemini.js"
import { ciciai } from "../utils/chat/ciciai.js"
import { elin } from "../utils/chat/elin.js"
import { pollinations } from "../utils/text2img/pollinations.js"
import { linangdata } from "../utils/text2img/linangdata.js"
import { gemmy } from "../utils/text2img/gemmy.js"

class LRUCache {
  constructor(maxSize = 50, ttl = 3600000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}

const router = express.Router()
const imageCache = new LRUCache(50, 3600000)

const providerChats = [
  { name: "gemini", handler: gemini },
  { name: "elin", handler: elin },
  { name: "ciciai", handler: ciciai },
  { name: "dolphinai", handler: dolphinai },
  { name: "turbochat", handler: turbochat },
]

const providerText2Img = [
  { name: "gemmy", handler: gemmy },
  { name: "linangdata", handler: linangdata },
  { name: "pollinations", handler: pollinations },
]

function timeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    )
  ])
}

function isBadReply(reply) {
  if (!reply) return true
  if (typeof reply !== "string") return true
  if (reply.startsWith("Error:")) return true
  return false
}

function isBadImage(image) {
  if (!image) return true
  if (typeof image !== "string") return true
  if (!image.startsWith("http")) return true
  return false
}

function generateCacheKey(prompt) {
  return crypto.createHash("md5").update(prompt.toLowerCase().trim()).digest("hex")
}

async function callproviderText2Img(prompt, options = {}) {
  const { useCache = true, maxRetries = 2, parallelProviders = false } = options

  if (useCache) {
    const cacheKey = generateCacheKey(prompt)
    const cached = imageCache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        cached: true
      }
    }
  }

  if (parallelProviders && providerText2Img.length > 1) {
    const promises = providerText2Img.map(async (p) => {
      try {
        const image = await timeout(p.handler.text2img(prompt), 15000)
        if (isBadImage(image)) {
          throw new Error(`${p.name} invalid response`)
        }
        return { image, provider: p.name }
      } catch (err) {
        throw err
      }
    })

    try {
      const result = await Promise.any(promises)

      if (useCache) {
        const cacheKey = generateCacheKey(prompt)
        imageCache.set(cacheKey, result)
      }

      return result
    } catch (err) {
      throw new Error("all providerText2Img failed in parallel mode")
    }
  }

  let lastError = new Error("all providerText2Img failed")

  for (const p of providerText2Img) {
    let retries = 0

    while (retries <= maxRetries) {
      try {
        const image = await timeout(
          p.handler.text2img(prompt),
          11000
        )

        if (isBadImage(image)) {
          throw new Error(`${p.name} invalid response`)
        }

        const result = {
          image,
          provider: p.name
        }

        if (useCache) {
          const cacheKey = generateCacheKey(prompt)
          imageCache.set(cacheKey, result)
        }

        return result

      } catch (err) {
        lastError = err
        retries++

        if (retries <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
        } else {
          break
        }
      }
    }
  }

  throw lastError
}

async function callproviderChats(messages, model) {
  let lastError = new Error("all providerChats failed")

  for (const p of providerChats) {
    try {
      const reply = await timeout(
        p.handler.chat(messages, { model }),
        10000
      )

      if (isBadReply(reply)) {
        throw new Error(`${p.name} invalid response`)
      }

      return {
        reply,
        provider: p.name
      }

    } catch (err) {
      lastError = err
      continue
    }
  }

  throw lastError
}

router.get("/text2img", async (req, res) => {
  try {
    const { prompt, nocache, parallel } = req.query

    if (!prompt) {
      return res.status(400).json({
        error: "prompt is required"
      })
    }

    const options = {
      useCache: nocache !== "true",
      parallelProviders: parallel === "true"
    }

    const { image, provider, cached } = await callproviderText2Img(prompt, options)

    res.json({
      image,
      provider,
      cached: cached || false
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/chat", async (req, res) => {
  try {
    const { model = "opencode-1.0", messages } = req.body

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be array"
      })
    }

    const { reply, provider } = await callproviderChats(messages, model)

    res.json({
      model,
      provider,
      object: "chat.completion",
      choices: [
        {
          message: {
            role: "assistant",
            content: reply
          }
        }
      ]
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

export default router