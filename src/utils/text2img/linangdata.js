import axios from "axios"
import FormData from "form-data"
import { uploader } from "../../lib/uploader.js"

export const presets = [
    "none", "3d-model", "abstract", "advertising", "alien", "analog-film", "anime", "architectural", "artnouveau", "baroque",
    "black-white-film-portrait", "cinematic", "collage", "comic-book", "craft-clay", "cubist", "dark-portrait-realism",
    "dark-realism", "digital-art", "disco", "dreamscape", "dystopian", "enhance", "fairy-tale", "fantasy-art", "fighting-game",
    "filmnoir", "flat-papercut", "food-photography", "gothic", "graffiti", "grunge", "gta", "hdr", "horror", "hyperrealism",
    "impressionist", "industrialfashion", "isometric-style", "light-portrait-realism", "light-realism", "line-art",
    "long-exposure", "minecraft", "minimalist", "monochrome", "nautical", "neon-noir", "neon-punk", "origami", "paper-mache",
    "papercut-collage", "papercut-shadow-box", "photographic", "pixel-art", "pointillism", "pokémon", "pop-art",
    "psychedelic", "real-estate", "renaissance", "retro-arcade", "retro-game", "romanticism", "rpg-fantasy-game",
    "silhouette", "space", "stacked-papercut", "stained-glass", "steampunk", "strategy-game", "street-fighter",
    "super-mario", "surrealist", "techwear-fashion", "texture", "thick-layered-papercut", "tilt-shift", "tribal",
    "typography", "vintagetravel", "watercolor"
]

export const sizes = {
    square: "1024x1024",
    portrait: "768x1024",
    landscape: "1024x768",
    widescreen: "1280x720",
    ultra: "1536x1536"
}

async function scrapeLinangData({
    prompt,
    negativePrompt = "",
    preset = "none",
    orientation = "portrait",
    seed = ""
}) {
    if (!prompt) throw new Error("Prompt!")
    if (!presets.includes(preset)) throw new Error("Preset!")
    if (!sizes[orientation]) throw new Error("Size!")

    const form = new FormData()
    form.append("prompt", prompt)
    form.append("negativePrompt", negativePrompt)
    form.append("preset", preset)
    form.append("orientation", orientation)
    form.append("seed", seed)

    const res = await axios.post(
        "https://linangdata.com/text-to-image-ai/stablefusion-v2.php",
        form,
        {
            headers: {
                ...form.getHeaders(),
                accept: "application/json, text/plain, */*",
                "x-requested-with": "XMLHttpRequest",
                referer: "https://linangdata.com/text-to-image-ai/"
            }
        }
    )

    const { filename, image } = res.data || {}
    if (!image) throw new Error("image")

    const buffer = Buffer.from(image, "base64")
    const result = await uploader(buffer)

    if (!result.success) throw new Error(result.error)

    return result.url
}

export const linangdata = {
    text2img: async (prompt) => {
        return await scrapeLinangData({ prompt })
    }
}

