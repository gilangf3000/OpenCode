// routes/api.js
import express from "express";
import { turbochat } from "../utils/chat/turbochat.js";
import { ciciai } from "../utils/chat/ciciai.js";
import { dolphinai } from "../utils/chat/dolphinai.js";
import { elin } from "../utils/chat/elin.js";

const router = express.Router();

const providers = [
  { name: "dolphinai", handler: dolphinai },
  { name: "ciciai", handler: ciciai },
  { name: "turbochat", handler: turbochat },
  { name: "elin", handler: elin }
];

function timeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function callProviders(messages, model) {
  let lastError;

  for (const p of providers) {
    try {
      const reply = await timeout(
        p.handler.chat(messages, { model }),
        15000
      );
      return { reply, provider: p.name };
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError;
}

router.post("/chat", async (req, res) => {
  try {
    const { model = "opencode-1.0", messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be array" });
    }

    const { reply, provider } = await callProviders(messages, model);

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
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;