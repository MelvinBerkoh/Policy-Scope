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

const labelMap = {
  data_collection: "Data Collection",
  data_sharing: "Data Sharing",
  tracking_cookies: "Tracking & Cookies",
  data_retention: "Data Retention",
  sensitive_data: "Sensitive Data",

  subscription_billing: "Subscription & Billing",
  cancellation_refunds: "Cancellation & Refunds",
  price_changes: "Price Changes",

  liability_limits: "Liability Limits",
  arbitration_disputes: "Dispute Resolution",
  terms_changes: "Terms Changes",

  account_termination: "Account Termination",
  third_party_services: "Third-Party Services",
  user_content_license: "User Content Rights",
  marketing_communications: "Marketing Communications",

  age_restrictions: "Age Restrictions"
};
function formatLabel(type) {
  if (labelMap[type]) return labelMap[type];

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function renderMain(grouped) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  const colors = {
  data_collection: "#22c55e",
  data_sharing: "#22c55e",
  tracking_cookies: "#22c55e",
  data_retention: "#22c55e",
  sensitive_data: "#22c55e",

  subscription_billing: "#f59e0b",
  cancellation_refunds: "#f59e0b",
  price_changes: "#f59e0b",

  liability_limits: "#ef4444",
  arbitration_disputes: "#ef4444",
  terms_changes: "#ef4444",

  account_termination: "#6366f1",
  third_party_services: "#6366f1",
  user_content_license: "#6366f1",
  marketing_communications: "#6366f1",

  age_restrictions: "#eab308"
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