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

  if (request.action === "refreshAllTabsHighlightColors") {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (!tab.id || !tab.url) return;
        if (tab.url.startsWith("chrome://")) return;

        chrome.tabs.sendMessage(tab.id, { action: "refreshHighlightColors" }, () => {
          void chrome.runtime.lastError;
        });
      });
    });
    sendResponse({ ok: true });
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
  const safeText = String(text || "").trim().slice(0, 3000);

  if (!safeText) {
    return "No summary returned";
  }

  if (cache[safeText]) {
    console.log("CACHE HIT");
    return cache[safeText];
  }

  try {
    const res = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: safeText })
    });

    const data = await res.json();

    console.log("BACKEND STATUS:", res.status);
    console.log("BACKEND RESPONSE:", data);

    if (!res.ok) {
      return data?.summary || "Backend request failed";
    }

    cache[safeText] = data.summary;
    return data.summary || "No summary returned";
  } catch (err) {
    console.error("Backend error:", err);
    return "AI unavailable";
  }
}