import axios from "axios";
import qs from "qs";
import FormData from "form-data";
import fs from "fs";
import { buildPrompt, parseStreamResponse } from "../../lib/myfunc.js";

const CONFIG = {
    BASE_URL: "https://api.elin.ai",

    CREDENTIALS: {
        username: "ahsahsah@gma.co",
        password: "asuk123#GG"
    },

    API: {
        TOKEN: "/api/v1/auth/token",
        SESSION: "/api/v3/chats/sessions/id",
        UPLOAD: "/api/v3/content/upload",
        CHAT: id => `/api/v3/chats/${id}/stream`
    },

    HEADERS: {
        "User-Agent": "Elin AI/2.8.0",
        Accept: "application/json",
        "accept-language": "en",
        "x-timezone": "Asia/Jakarta"
    }
};

export const elin = {
    async chat(messages, options = {}) {
        try {
            const { imagePath } = options;

            const prompt = buildPrompt(messages);

            const loginRes = await axios.post(
                CONFIG.BASE_URL + CONFIG.API.TOKEN,
                qs.stringify(CONFIG.CREDENTIALS),
                {
                    headers: {
                        ...CONFIG.HEADERS,
                        "content-type": "application/x-www-form-urlencoded"
                    }
                }
            );

            const token = loginRes?.data?.access_token;
            if (!token) throw new Error("Login gagal");

            const headers = {
                ...CONFIG.HEADERS,
                authorization: `Bearer ${token}`
            };

            const sessionRes = await axios.get(
                CONFIG.BASE_URL + CONFIG.API.SESSION,
                { headers }
            );

            const chatId = sessionRes?.data?.id;
            if (!chatId) throw new Error("Session gagal dibuat");

            let messageContent;

            if (imagePath) {
                if (!fs.existsSync(imagePath))
                    throw new Error("Image tidak ditemukan");

                const form = new FormData();
                form.append("file", fs.createReadStream(imagePath));

                const upload = await axios.post(
                    CONFIG.BASE_URL + CONFIG.API.UPLOAD,
                    form,
                    { headers: { ...headers, ...form.getHeaders() } }
                );

                messageContent = {
                    type: "path",
                    content: upload.data.filename,
                    context: prompt,
                    resource_type: "image"
                };
            } else {
                messageContent = {
                    type: "text",
                    content: prompt
                };
            }

            const payload = {
                id: chatId,
                messages: [{
                    type: "user",
                    order: 1,
                    timestamp: new Date().toISOString(),
                    context: {},
                    content: messageContent
                }]
            };

            const chatRes = await axios.post(
                CONFIG.BASE_URL + CONFIG.API.CHAT(chatId),
                payload,
                {
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    responseType: "stream"
                }
            );

            return await new Promise((resolve, reject) => {
                let raw = "";

                chatRes.data.on("data", c => raw += c.toString());
                chatRes.data.on("end", () => resolve(parseStreamResponse(raw)));
                chatRes.data.on("error", reject);
            });

        } catch (e) {
            return `Error: ${e.message}`;
        }
    }
};
