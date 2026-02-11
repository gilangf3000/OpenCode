import { fileTypeFromBuffer } from "file-type"
import FormData from "form-data"
import axios from "axios"

const GIMITA_API_KEY = "gimi_4d719234c2e47cb5ac5da6421da63a5e3642426211cf31848467116ac052b458"

async function uploaderGimita(buf, type) {
    const form = new FormData()
    form.append("file", buf, { filename: `file.${type.ext}`, contentType: type.mime })

    const { data } = await axios.post("https://cdn.gimita.id/upload", form, {
        headers: {
            ...form.getHeaders(),
            "Authorization": `Bearer ${GIMITA_API_KEY}`
        },
    })

    if (!data?.success || !data?.downloadUrl) {
        throw new Error(`Gimita failed: ${JSON.stringify(data)}`)
    }

    return data.downloadUrl
}

export async function uploader(buffer) {
    try {
        const type = await fileTypeFromBuffer(buffer)
        if (!type) {
            throw new Error("Unable to detect file type")
        }

        const url = await uploaderGimita(buffer, type)
        return {
            success: true,
            url
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}