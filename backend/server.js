const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { text } = req.body;

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
            content: `
Explain this clause in plain English.

- 2–3 sentences max
- Highlight risks
- No legal jargon
`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await response.json();

    const result = data.choices?.[0]?.message?.content;

    res.json({
      summary: result || "No response"
    });

  } catch (err) {
    console.error(err);
    res.json({ summary: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});