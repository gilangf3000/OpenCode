import express from "express"
import { turbochat } from "../utils/chat/turbochat.js"
import { dolphinai } from "../utils/chat/dolphinai.js"
import { gemini } from "../utils/chat/gemini.js"
import { ciciai } from "../utils/chat/ciciai.js"
import { elin } from "../utils/chat/elin.js"
import { pollinations } from "../utils/text2img/pollinations.js"


const router = express.Router()

const providerChats = [
  { name: "gemini", handler: gemini },  
  { name: "elin", handler: elin },
  { name: "ciciai", handler: ciciai },
  { name: "dolphinai", handler: dolphinai },
  { name: "turbochat", handler: turbochat },
]

const providerText2Img = [
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