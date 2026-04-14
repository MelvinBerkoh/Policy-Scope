const cache = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("BACKGROUND RECEIVED:", request);

  if (request.action === "openPolicyScopePopup") {
    chrome.windows.create({
      url: chrome.runtime.getURL("src/popup/popup.html"),
      type: "popup",
      width: 460,
      height: 720
    });
    return;
  }

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

    console.log("BACKEND STATUS:", res.status);
    console.log("BACKEND RESPONSE:", data);

    if (!res.ok) {
      return data?.summary || "Backend request failed";
    }

    cache[text] = data.summary;
    return data.summary || "No summary returned";
  } catch (err) {
    console.error("Backend error:", err);
    return "AI unavailable";
  }
}