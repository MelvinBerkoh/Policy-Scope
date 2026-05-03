const DEFAULT_SETTINGS = {
  highlightColors: {
    "Data Collection": "#22c55e",
    "Data Sharing": "#22c55e",
    "Billing & Subscriptions": "#f59e0b",
    "Legal & Disputes": "#ef4444",
    "Account & Access": "#6366f1",
    "Content & User Rights": "#6366f1",
    "Policy Changes & Communication": "#6366f1",
    "Age Restrictions": "#eab308"
  },
  highlightStyle: "underline",
  showFloatingBadge: true,
  highlightsEnabledByDefault: true,
  enabledBigCategories: {
    "Data Collection": true,
    "Data Sharing": true,
    "Billing & Subscriptions": true,
    "Legal & Disputes": true,
    "Account & Access": true,
    "Content & User Rights": true,
    "Policy Changes & Communication": true,
    "Age Restrictions": true
  }
};

const COLOR_DESCRIPTIONS = {
  "Data Collection": "Includes data collection, tracking, retention, and sensitive data.",
  "Data Sharing": "Includes data sharing and third-party services.",
  "Billing & Subscriptions": "Includes billing, refunds, and price changes.",
  "Legal & Disputes": "Includes liability limits and arbitration/dispute terms.",
  "Account & Access": "Includes account suspension and termination language.",
  "Content & User Rights": "Includes licensing and rights related to user content.",
  "Policy Changes & Communication": "Includes terms changes and marketing communications.",
  "Age Restrictions": "Includes age gates and parental requirements."
};

const CATEGORY_DESCRIPTIONS = {
  "Data Collection": "Show or hide all data collection related detections.",
  "Data Sharing": "Show or hide all data sharing related detections.",
  "Billing & Subscriptions": "Show or hide billing and subscription detections.",
  "Legal & Disputes": "Show or hide legal and dispute related detections.",
  "Account & Access": "Show or hide account and access related detections.",
  "Content & User Rights": "Show or hide content and user rights detections.",
  "Policy Changes & Communication": "Show or hide policy change and communication detections.",
  "Age Restrictions": "Show or hide age restriction detections."
};

let statusTimer = null;

function deepCloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function mergeSettings(savedSettings = {}) {
  const defaults = deepCloneDefaults();

  return {
    ...defaults,
    ...savedSettings,
    highlightColors: {
      ...defaults.highlightColors,
      ...(savedSettings.highlightColors || {})
    },
    enabledBigCategories: {
      ...defaults.enabledBigCategories,
      ...(savedSettings.enabledBigCategories || {})
    }
  };
}

function setStatus(text) {
  const status = document.getElementById("statusText");
  if (!status) return;

  status.innerText = text;

  if (statusTimer) clearTimeout(statusTimer);

  if (text) {
    statusTimer = setTimeout(() => {
      status.innerText = "";
    }, 2500);
  }
}

function renderColorSettings(colors) {
  const list = document.getElementById("colorSettingsList");
  if (!list) return;

  list.innerHTML = "";

  Object.entries(colors).forEach(([category, color]) => {
    const card = document.createElement("div");
    card.className = "settingCard";

    card.innerHTML = `
      <div class="settingRow">
        <div class="settingInfo">
          <div class="settingTitle">${category}</div>
          <div class="settingMeta">${COLOR_DESCRIPTIONS[category] || ""}</div>
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

function renderCategorySettings(enabledBigCategories) {
  const list = document.getElementById("categorySettingsList");
  if (!list) return;

  list.innerHTML = "";

  Object.entries(enabledBigCategories).forEach(([category, isEnabled]) => {
    const card = document.createElement("div");
    card.className = "settingCard";

    card.innerHTML = `
      <div class="checkboxRow">
        <div class="settingInfo">
          <div class="settingTitle">${category}</div>
          <div class="settingMeta">${CATEGORY_DESCRIPTIONS[category] || ""}</div>
        </div>
        <input
          class="checkboxInput"
          type="checkbox"
          ${isEnabled ? "checked" : ""}
          data-category="${category}"
          aria-label="${category} enabled"
        />
      </div>
    `;

    list.appendChild(card);
  });
}

function applySettingsToForm(settings) {
  const highlightStyle = document.getElementById("highlightStyle");
  const showFloatingBadge = document.getElementById("showFloatingBadge");
  const highlightsEnabledByDefault = document.getElementById("highlightsEnabledByDefault");

  if (highlightStyle) highlightStyle.value = settings.highlightStyle;
  if (showFloatingBadge) showFloatingBadge.checked = settings.showFloatingBadge;
  if (highlightsEnabledByDefault) {
    highlightsEnabledByDefault.checked = settings.highlightsEnabledByDefault;
  }

  renderColorSettings(settings.highlightColors);
  renderCategorySettings(settings.enabledBigCategories);
}

function getSettingsFromForm() {
  const highlightColors = {};
  const enabledBigCategories = {};

  document.querySelectorAll(".colorInput").forEach(input => {
    highlightColors[input.dataset.category] = input.value;
  });

  document.querySelectorAll(".checkboxInput").forEach(input => {
    enabledBigCategories[input.dataset.category] = input.checked;
  });

  return {
    highlightColors,
    highlightStyle: document.getElementById("highlightStyle").value,
    showFloatingBadge: document.getElementById("showFloatingBadge").checked,
    highlightsEnabledByDefault: document.getElementById("highlightsEnabledByDefault").checked,
    enabledBigCategories
  };
}

function loadSettings() {
  chrome.storage.sync.get(["policyScopeSettings"], result => {
    const settings = mergeSettings(result.policyScopeSettings);
    applySettingsToForm(settings);
  });
}

document.getElementById("saveBtn").onclick = () => {
  const saveBtn = document.getElementById("saveBtn");
  const settings = getSettingsFromForm();

  saveBtn.disabled = true;
  saveBtn.innerText = "Saving...";

  chrome.storage.sync.set({ policyScopeSettings: settings }, () => {
    chrome.runtime.sendMessage(
      { action: "refreshAllTabsPolicyScopeSettings" },
      () => {
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
        setStatus("Saved. Settings applied across open tabs.");
      }
    );
  });
};

document.getElementById("resetBtn").onclick = () => {
  applySettingsToForm(deepCloneDefaults());
  setStatus("Defaults restored. Save to apply them.");
};

loadSettings();