import axios from "axios"

function buildPrompt(messages = []) {
  if (!Array.isArray(messages)) {
    throw new Error("messages must be an array")
  }

  let instruction = ""
  let chat = []

  for (const m of messages) {
    if (!m || typeof m.content !== "string") continue

    if (m.role === "system") {
      instruction += m.content.trim() + "\n"
      continue
    }

    if (m.role === "user") {
      chat.push(`User: ${m.content.trim()}`)
      continue
    }

    if (m.role === "assistant") {
      chat.push(`Assistant: ${m.content.trim()}`)
    }
  }

  return {
    instruction: instruction.trim(),
    message: chat.join("\n")
  }
}

async function chat(messages, sessionId = null) {
  try {
    if (!messages) throw new Error("messages is required")

    const { message, instruction } = buildPrompt(messages)

    let resumeArray = null
    let cookie = null
    let savedInstruction = instruction

    if (sessionId) {
      try {
        const sessionData = JSON.parse(
          Buffer.from(sessionId, "base64").toString()
        )
        resumeArray = sessionData.resumeArray
        cookie = sessionData.cookie
        savedInstruction =
          instruction || sessionData.instruction || ""
      } catch {}
    }

    if (!cookie) {
      const { headers } = await axios.post(
        "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c",
        "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
        {
          headers: {
            "content-type":
              "application/x-www-form-urlencoded;charset=UTF-8"
          }
        }
      )

      cookie = headers["set-cookie"]?.[0]?.split("; ")[0] || ""
    }

    const requestBody = [
      [message, 0, null, null, null, null, 0],
      ["en-US"],
      resumeArray || ["", "", "", null, null, null, null, null, null, ""],
      null,
      null,
      null,
      [1],
      1,
      null,
      null,
      1,
      0,
      null,
      null,
      null,
      null,
      null,
      [[0]],
      1,
      null,
      null,
      null,
      null,
      null,
      [
        "",
        "",
        savedInstruction,
        null,
        null,
        null,
        null,
        null,
        0,
        null,
        1,
        null,
        null,
        null,
        []
      ],
      null,
      null,
      1,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [
        1,2,3,4,5,6,7,8,9,10,
        11,12,13,14,15,16,17,18,19,20
      ],
      1,
      null,
      null,
      null,
      null,
      [1]
    ]

    const payload = [null, JSON.stringify(requestBody)]

    const { data } = await axios.post(
      "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c",
      new URLSearchParams({
        "f.req": JSON.stringify(payload)
      }).toString(),
      {
        headers: {
          "content-type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          "x-goog-ext-525001261-jspb":
            '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
          cookie
        }
      }
    )

    const match = Array.from(
      data.matchAll(/^\d+\n(.+?)\n/gm)
    )
    const array = match.reverse()
    const selectedArray = array[3][1]
    const realArray = JSON.parse(selectedArray)
    const parse1 = JSON.parse(realArray[0][2])

    const text = parse1[4][0][1][0]
      .replace(/\*\*(.+?)\*\*/g, "*$1*")

    return text
  } catch (err) {
    throw new Error(err.message)
  }
}

export const gemini = { chat }