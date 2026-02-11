import axios from "axios"
import { uploader } from "../../lib/uploader.js"

const URL = "https://firebasevertexai.googleapis.com/v1beta/projects/gemmy-ai-bdc03/models/imagen-4.0-fast-generate-001:predict"

const HEADERS = {
    "User-Agent": "ktor-client",
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-goog-api-key": "AIzaSyAxof8_SbpDcww38NEQRhNh0Pzvbphh-IQ",
    "x-goog-api-client": "gl-kotlin/2.2.21-ai fire/17.7.0",
    "x-firebase-appid": "1:652803432695:android:c4341db6033e62814f33f2",
    "x-firebase-appversion": "91",
    "x-firebase-appcheck": "eyJlcnJvciI6IlVOS05PV05fRVJST1IifQ=="
}

async function text2img(prompt, options = {}) {
    if (!prompt) throw new Error("Prompt required")

    const payload = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: options.aspectRatio || "1:1",
            personGeneration: "allow_adult",
            imageOutputOptions: {
                mimeType: "image/jpeg",
                compressionQuality: 100
            }
        }
    }

    const res = await axios.post(URL, payload, { headers: HEADERS })

    const base64 = res.data?.predictions?.[0]?.bytesBase64Encoded

    if (!base64) throw new Error("Image generation failed")

    const buffer = Buffer.from(base64, "base64")

    const result = await uploader(buffer)

    if (!result.success) throw new Error(result.error)

    return result.url
}

export const gemmy = { text2img }
