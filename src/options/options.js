const DEFAULT_BIG_CATEGORY_COLORS = {
  "Data Collection": "#22c55e",
  "Data Sharing": "#22c55e",
  "Billing & Subscriptions": "#f59e0b",
  "Legal & Disputes": "#ef4444",
  "Account & Access": "#6366f1",
  "Content & User Rights": "#6366f1",
  "Policy Changes & Communication": "#6366f1",
  "Age Restrictions": "#eab308"
};

const descriptions = {
  "Data Collection": "Includes data collection, tracking, retention, and sensitive data.",
  "Data Sharing": "Includes data sharing and third-party services.",
  "Billing & Subscriptions": "Includes billing, refunds, and price changes.",
  "Legal & Disputes": "Includes liability limits and arbitration/dispute terms.",
  "Account & Access": "Includes account suspension and termination language.",
  "Content & User Rights": "Includes licensing and rights related to user content.",
  "Policy Changes & Communication": "Includes terms changes and marketing communications.",
  "Age Restrictions": "Includes age gates and parental requirements."
};

function renderSettings(colors) {
  const list = document.getElementById("settingsList");
  if (!list) return;

  list.innerHTML = "";

  Object.entries(colors).forEach(([category, color]) => {
    const card = document.createElement("div");
    card.className = "settingCard";

    card.innerHTML = `
      <div class="settingRow">
        <div class="settingInfo">
          <div class="settingTitle">${category}</div>
          <div class="settingMeta">${descriptions[category] || ""}</div>
        </div>
        <input
          class="colorInput"
          type="color"
          value="${color}"
          data-category="${category}"
          aria-label="${category} color"
        />
      </div>
    `;

    list.appendChild(card);
  });
}

function getCurrentInputColors() {
  const colors = {};
  document.querySelectorAll(".colorInput").forEach(input => {
    colors[input.dataset.category] = input.value;
  });
  return colors;
}

function setStatus(text) {
  const status = document.getElementById("statusText");
  if (status) status.innerText = text;
}

function loadSettings() {
  chrome.storage.sync.get(["highlightColors"], result => {
    const colors = {
      ...DEFAULT_BIG_CATEGORY_COLORS,
      ...(result.highlightColors || {})
    };
    renderSettings(colors);
  });
}

document.getElementById("saveBtn").onclick = () => {
  const colors = getCurrentInputColors();

  chrome.storage.sync.set({ highlightColors: colors }, () => {
    chrome.runtime.sendMessage({ action: "refreshAllTabsHighlightColors" }, () => {
      setStatus("Saved. Highlight colors updated.");
    });
  });
};

document.getElementById("resetBtn").onclick = () => {
  renderSettings(DEFAULT_BIG_CATEGORY_COLORS);
  setStatus("Defaults restored. Save to apply them.");
};

loadSettings();