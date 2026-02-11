import axios from 'axios'
import { uploader } from '../../lib/uploader.js'

async function text2img(prompt, width = 1024, height = 1024) {
  if (!prompt) throw new Error('prompt')

  const seed = Date.now()

  const url =
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(prompt) +
    `?width=${width}&height=${height}&nologo=true&seed=${seed}`

  const { data } = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(data)

  const result = await uploader(buffer)
  if (!result.success) throw new Error(result.error)

  return result.url
}

export const pollinations = { text2img }
