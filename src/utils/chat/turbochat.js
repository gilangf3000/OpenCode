import axios from "axios";
import { buildPrompt } from "../../lib/myfunc.js";

const BASE_URL = "https://theturbochat.com";

export const turbochat = {
    async chat(messages, options = {}) {
        try {
            const { model = "gpt-3.5-turbo", language = "en" } = options;

            const prompt = buildPrompt(messages);

            const response = await axios.post(
                `${BASE_URL}/chat`,
                { message: prompt, model, language },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Origin": BASE_URL
                    }
                }
            );

            const data = response.data;
            return data.choices[0].message.content;

        } catch (e) {
            return `Error: ${e.message}`;
        }
    }
};
