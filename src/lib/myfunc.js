export function buildPrompt(messages) {
    if (!Array.isArray(messages)) {
        throw new Error("messages must be array");
    }
    return messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n") + "\nASSISTANT:";
}

export function parseStreamResponse(raw) {
    let text = "";
    for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
            const json = JSON.parse(line.slice(6));
            if (json?.content?.content) text += json.content.content;
        } catch {}
    }
    return text.trim();
}