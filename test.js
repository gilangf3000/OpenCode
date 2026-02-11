import axios from 'axios'

async function text2img(prompt, width = 1024, height = 1024) {
  if (!prompt) throw new Error('Prompt kosong')

  const seed = Date.now()

  const url =
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(prompt) +
    `?width=${width}&height=${height}&nologo=true&seed=${seed}`

  const { data } = await axios.get(url, { responseType: 'arraybuffer' })

  return Buffer.from(data)
}

export const pollinations = { text2img }
