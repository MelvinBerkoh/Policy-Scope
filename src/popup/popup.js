let globalDetections = [];

/**
 * Group detections by type
 */
function groupByType(detections) {
  const grouped = {};

  detections.forEach(d => {
    if (!grouped[d.type]) grouped[d.type] = [];
    grouped[d.type].push(d);
  });

  return grouped;
}

/**
 * Render main category view
 */
function renderMain(grouped) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  const colors = {
    billing_auto_renewal: "#fff3a0",
    subscription_refund: "#ffd6a5",
    data_collection: "#caffbf",
    data_sharing: "#bdb2ff",
    arbitration_legal: "#ffadad"
  };

  Object.entries(grouped).forEach(([type, items]) => {

    const div = document.createElement("div");
    div.className = "card";

    div.style.borderLeft = `6px solid ${colors[type] || "#ccc"}`;

    const label = type
      .replaceAll("_", " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    div.innerHTML = `
      <div class="row">
        <span class="type">${label}</span>
        <span class="count">${items.length}</span>
      </div>
      <button class="detailsBtn">Details</button>
    `;

    div.querySelector(".detailsBtn").onclick = () => {
      showDetails(type, items);
    };

    results.appendChild(div);
  });
}

/**
 * Show details view (AI + original text)
 */
function showDetails(type, items) {

  document.getElementById("mainView").style.display = "none";
  document.getElementById("detailsView").style.display = "block";

  document.getElementById("detailTitle").innerText =
    type.replaceAll("_", " ").toUpperCase();

  const container = document.getElementById("detailContent");
  container.innerHTML = "";

  items.forEach(item => {

    const div = document.createElement("div");
    div.className = "detailCard";

    div.innerHTML = `
      <div class="original">${item.text}</div>
      <div class="summary">Loading AI summary...</div>
      <button class="locateBtn">🔍 Find</button>
    `;

    // 🔥 AI CALL (background.js handles this)
    chrome.runtime.sendMessage(
      {
        action: "analyzeClause",
        text: item.text
      },
      res => {
        const summaryEl = div.querySelector(".summary");

        if (res && res.summary) {
          summaryEl.innerText = res.summary;
        } else {
          summaryEl.innerText = "NO response from AI";
        }
      }
    );

    // 🔍 Scroll to clause
    div.querySelector(".locateBtn").onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "scrollToClause",
          text: item.text
        });
      });
    };

    container.appendChild(div);
  });
}

/**
 * Fetch detections from content script
 */
function fetchDetections(retries = 8) {

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {

    if (!tabs[0]?.id) {
      console.log("No active tab");
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getDetections" },
      res => {

        if (chrome.runtime.lastError) {
          if (retries > 0) {
            return setTimeout(() => fetchDetections(retries - 1), 400);
          }
          console.log("Content script not ready");
          return;
        }

        if (!res || !res.data) {
          if (retries > 0) {
            return setTimeout(() => fetchDetections(retries - 1), 400);
          }
          console.log("No data received");
          return;
        }

        console.log("Detections received:", res.data);

        globalDetections = res.data;

        const grouped = groupByType(globalDetections);
        renderMain(grouped);
      }
    );
  });
}

fetchDetections();

/**
 * Toggle highlight button
 */
document.getElementById("toggleHighlight").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "toggleHighlight"
    });
  });
};

/**
 * Back button (details → main)
 */
document.getElementById("backBtn").onclick = () => {
  document.getElementById("mainView").style.display = "block";
  document.getElementById("detailsView").style.display = "none";
};

/**
 * Options button (placeholder)
 */
document.getElementById("optionsBtn").onclick = () => {
  alert("Settings coming soon");
};