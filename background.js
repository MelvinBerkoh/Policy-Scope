const cache = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  console.log("BACKGROUND RECEIVED:", request); 

  if (request.action === "analyzeClause") {

    analyzeWithBackend(request.text)
      .then(result => {
        console.log("SENDING BACK TO POPUP:", result);
        sendResponse({ summary: result });
      })
      .catch(err => {
        console.error("AI error:", err);
        sendResponse({ summary: "AI unavailable" });
      });

    return true; 
  }
});

async function analyzeWithBackend(text) {

  if (cache[text]) {
    console.log("CACHE HIT");
    return cache[text];
  }

  try {
    const res = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    console.log("BACKEND RESPONSE:", data); 

    cache[text] = data.summary;

    return data.summary;

  } catch (err) {
    console.error("Backend error:", err);
    return "AI unavailable";
  }
}