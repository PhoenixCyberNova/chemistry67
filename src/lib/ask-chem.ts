import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are ChemVault AI, a precise Class 10 CBSE Chemistry tutor.
Use NCERT Class 10 language. Prefer balanced equations with state symbols.
Cover chemical reactions, acids bases salts, metals and non-metals, carbon compounds.
If a question is outside Class 10 chemistry, say so briefly then give a short helpful pointer.
Keep answers under 220 words. Use plain text, not markdown tables.`;

export const askChem = createServerFn({ method: "POST" })
  .validator((input: { message: string; history?: { role: "user" | "assistant"; content: string }[] }) => {
    const message = (input?.message ?? "").trim().slice(0, 800);
    const history = (input?.history ?? []).slice(-6);
    return { message, history };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available in this environment." };
    if (!data.message) return { ok: false as const, error: "Type a chemistry question first." };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 420,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM },
          ...data.history,
          { role: "user", content: data.message },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: "The tutor is busy. Try again in a moment." };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Empty reply. Try rephrasing." };
    return { ok: true as const, text };
  });
