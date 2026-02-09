// utils/ciciai.js
import axios from 'axios'
import crypto from 'crypto'
import { buildPrompt, parseStreamResponse } from '../../lib/myfunc.js'

function uuid() {
  return crypto.randomUUID()
}

export const ciciai = {
  async chat(messages) {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return 'Error: Input query kosong'
    }

    try {
      const prompt = buildPrompt(messages)
      const timestamp = Math.floor(Date.now() / 1000)
      const ms = Date.now().toString()

      const headers = {
        host: 'api-normal-i18n.ciciai.com',
        'content-type': 'application/json; encoding=utf-8',
        'accept-encoding': 'gzip',
        'x-ss-req-ticket': ms,
        'sdk-version': '2',
        'x-tt-token': '03be5c3df4d23840ab6e0136d982cf5d700532418a6364a7a21d00b020455076f256d20a76fd3db389968b0a1e0ab6d2999bcda07949b678f35f51707f1abaf0b8bd97eef9a537cb162f03025e8282c0658c1-1.0.0',
        'passport-sdk-version': '505176',
        'x-vc-bdturing-sdk-version': '2.2.1.i18n',
        'user-agent': 'com.larus.wolf/11080005 (Android 14)',
        'x-ladon': 'EWpoCnQJ6Un41IwItacPSVAZoZq0wjzhuhM1yW8W5w08cpPp',
        'x-khronos': String(timestamp),
        'x-argus': 'VQJBkbGT6w5ALshpUgbVcDrL/E7y5yV5yVlfny4pnJvWPeP09n3rypfO8nBq3PV0TiMcqdEnB+ijNqL/riTW8TPP7ck05zQS06QslAqjLzG8dY6K7ipIoM08hftCSprWJoSiBzpzi7+5iyoNJfcQMMXCDCYhk/vcpW4nDDvPOLNIFLnfSHNR73inE2EuKurmTtznz1KLM7VV2oNNtR94NN9S1OAPWM691wKy16mAuhmK0f5HgCSi3YoV+6SK+sDyuUremc0/Ngom46IyXqclQ9dFAB/cgjrdhtTNut1MoZEzyw==',
        'x-gorgon': '840460b3000037b68cfb57c454f4406da140bff79c0cb9ce5449'
      }

      const body = {
        channel: 3,
        cmd: 100,
        sequence_id: uuid(),
        uplink_body: {
          send_message_body: {
            ack_only: false,
            bot_id: '7241547611541340167',
            bot_type: 3,
            content: JSON.stringify({ im_cmd: -1, text: prompt }),
            content_type: 1,
            conversation_type: 3,
            create_time: timestamp,
            ext: { create_time_ms: ms, system_language: 'en' },
            local_conversation_id: `${uuid()}-local`,
            local_message_id: uuid(),
            sender_id: '7593703764255753269',
            unique_key: uuid()
          }
        },
        version: '1'
      }

      const res = await axios.post(
        'https://api-normal-i18n.ciciai.com/im/sse/send/message?aid=489823&app_name=nova_ai&os=android',
        body,
        { headers, responseType: 'text' }
      )

      const parts = []
      const regex = /"origin_content"\s*:\s*"([^"]*)"/g
      let match
      while ((match = regex.exec(res.data))) {
        parts.push(match[1])
      }

      if (!parts.length) return 'Error: No content found'
      const text = parts.join('')
        .replace(/\\n/g, '\n')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{2,}/g, ' ')
        .trim()

      return text

    } catch (e) {
      return `Error: ${e.message}`
    }
  }
}