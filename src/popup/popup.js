let globalDetections = [];

function groupByType(detections) {
  const grouped = {};

  detections.forEach(d => {
    if (!grouped[d.type]) grouped[d.type] = [];
    grouped[d.type].push(d);
  });

  return grouped;
}

function truncateText(text, maxLength = 140) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

function formatLabel(type) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function renderMain(grouped) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  const colors = {
    billing_auto_renewal: "#f59e0b",
    subscription_refund: "#fb923c",
    data_collection: "#22c55e",
    data_sharing: "#6366f1",
    arbitration_legal: "#ef4444"
  };

  Object.entries(grouped).forEach(([type, items]) => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.borderLeft = `6px solid ${colors[type] || "#d1d5db"}`;

    div.innerHTML = `
      <div class="row">
        <span class="type">${formatLabel(type)}</span>
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

function showDetails(type, items) {
  const mainView = document.getElementById("mainView");
  const detailsView = document.getElementById("detailsView");
  const detailTitle = document.getElementById("detailTitle");
  const container = document.getElementById("detailContent");

  if (!mainView || !detailsView || !detailTitle || !container) {
    console.error("Popup view elements are missing");
    return;
  }

  mainView.style.display = "none";
  detailsView.style.display = "block";
  detailTitle.innerText = formatLabel(type).toUpperCase();

  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "detailCard";

  div.innerHTML = `
  <div class="sectionLabel">Original Clause</div>
  <div class="original shortText">${truncateText(item.text, 170)}</div>
  <div class="fullText">${item.text}</div>

  <div class="sectionLabel">AI Summary</div>
  <div class="summary">Loading AI summary...</div>
  <button class="summaryToggleBtn" style="display: none;">Show More</button>

  <div class="detailActions">
    <button class="expandBtn">Show Full Clause</button>
    <button class="locateBtn">Locate</button>
  </div>
`;

    const summaryEl = div.querySelector(".summary");
    const shortEl = div.querySelector(".shortText");
    const fullEl = div.querySelector(".fullText");
    const expandBtn = div.querySelector(".expandBtn");
    const locateBtn = div.querySelector(".locateBtn");
    const summaryToggleBtn = div.querySelector(".summaryToggleBtn");

   chrome.runtime.sendMessage(
  {
    action: "analyzeClause",
    text: item.text
  },
  res => {
    if (chrome.runtime.lastError) {
      summaryEl.innerText = "Unable to load summary";
      summaryToggleBtn.style.display = "none";
      return;
    }

    if (res && res.summary) {
      summaryEl.innerText = res.summary;

      requestAnimationFrame(() => {
        if (summaryEl.scrollHeight > summaryEl.clientHeight + 2) {
          summaryToggleBtn.style.display = "inline-block";
        } else {
          summaryToggleBtn.style.display = "none";
        }
      });
    } else {
      summaryEl.innerText = "No response from AI";
      summaryToggleBtn.style.display = "none";
    }
  }
);

    expandBtn.onclick = () => {
      const showingFull = fullEl.style.display === "block";
      fullEl.style.display = showingFull ? "none" : "block";
      shortEl.style.display = showingFull ? "block" : "none";
      expandBtn.innerText = showingFull ? "Show Full Clause" : "Collapse Clause";
    };
    summaryToggleBtn.onclick = () => {
  const expanded = summaryEl.classList.toggle("expanded");
  summaryToggleBtn.innerText = expanded ? "Show Less" : "Show More";
};

    locateBtn.onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs[0]?.id) return;

        chrome.tabs.sendMessage(tabs[0].id, {
          action: "scrollToClause",
          text: item.text
        });
      });
    };

    container.appendChild(div);
  });
}

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

        globalDetections = res.data;
        const grouped = groupByType(globalDetections);
        renderMain(grouped);
      }
    );
  });
}

fetchDetections();

document.getElementById("toggleHighlight").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]?.id) return;

    chrome.tabs.sendMessage(tabs[0].id, {
      action: "toggleHighlight"
    });
  });
};

document.getElementById("backBtn").onclick = () => {
  const mainView = document.getElementById("mainView");
  const detailsView = document.getElementById("detailsView");

  if (!mainView || !detailsView) return;

  mainView.style.display = "block";
  detailsView.style.display = "none";
};

document.getElementById("optionsBtn").onclick = () => {
  alert("Settings coming soon");
};