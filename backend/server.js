require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
console.log("API key loaded:", !!process.env.OPENAI_API_KEY);

app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ summary: "Missing text" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    return res.status(500).json({ summary: "Server missing API key" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Explain this clause in plain English.

- 2–3 sentences max
- Highlight risks
- No legal jargon`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        summary: data?.error?.message || "OpenAI request failed"
      });
    }

    const result = data?.choices?.[0]?.message?.content?.trim();

    if (!result) {
      console.error("Unexpected OpenAI response shape:", data);
      return res.status(500).json({ summary: "Empty AI response" });
    }

    return res.json({ summary: result });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ summary: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});