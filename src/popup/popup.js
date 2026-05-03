let globalDetections = [];
let lastView = "main";
let currentBigCategory = null;

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
  account_termination: "Account & Access",
  third_party_services: "Third-Party Services",
  user_content_license: "User Content Rights",
  marketing_communications: "Marketing Communications",
  age_restrictions: "Age Restrictions"
};

const bigCategoryMap = {
  "Data Collection": [
    "data_collection",
    "tracking_cookies",
    "data_retention",
    "sensitive_data"
  ],
  "Data Sharing": [
    "data_sharing",
    "third_party_services"
  ],
  "Billing & Subscriptions": [
    "subscription_billing",
    "cancellation_refunds",
    "price_changes"
  ],
  "Legal & Disputes": [
    "liability_limits",
    "arbitration_disputes"
  ],
  "Account & Access": [
    "account_termination"
  ],
  "Content & User Rights": [
    "user_content_license"
  ],
  "Policy Changes & Communication": [
    "terms_changes",
    "marketing_communications"
  ],
  "Age Restrictions": [
    "age_restrictions"
  ]
};

const bigCategoryColors = {
  "Data Collection": "#22c55e",
  "Data Sharing": "#22c55e",
  "Billing & Subscriptions": "#f59e0b",
  "Legal & Disputes": "#ef4444",
  "Account & Access": "#6366f1",
  "Content & User Rights": "#6366f1",
  "Policy Changes & Communication": "#6366f1",
  "Age Restrictions": "#eab308"
};

function truncateText(text, maxLength = 140) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

function formatLabel(type) {
  if (labelMap[type]) return labelMap[type];

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function groupDetectionsByBigCategory(detections) {
  const grouped = {};

  Object.keys(bigCategoryMap).forEach(category => {
    grouped[category] = [];
  });

  detections.forEach(detection => {
    const bigCategory = detection.bigCategory;
    if (!grouped[bigCategory]) grouped[bigCategory] = [];
    grouped[bigCategory].push(detection);
  });

  return grouped;
}

function groupDetectionsByType(detections) {
  const grouped = {};

  detections.forEach(detection => {
    if (!grouped[detection.type]) grouped[detection.type] = [];
    grouped[detection.type].push(detection);
  });

  return grouped;
}

function getBigCategoryDescription(bigCategory, items) {
  const uniqueTypes = new Set(items.map(item => item.type));
  const typeCount = uniqueTypes.size;
  const typeWord = typeCount === 1 ? "type" : "types";

  return `${typeCount} ${typeWord} found in this category.`;
}

function getSubcategoryDescription(type, count) {
  const clauseWord = count === 1 ? "clause" : "clauses";

  const descriptions = {
    data_collection: `${count} flagged ${clauseWord} about what information may be collected.`,
    data_sharing: `${count} flagged ${clauseWord} about sharing data with others.`,
    tracking_cookies: `${count} flagged ${clauseWord} about cookies, tracking, or analytics.`,
    data_retention: `${count} flagged ${clauseWord} about how long data may be kept.`,
    sensitive_data: `${count} flagged ${clauseWord} about sensitive or device-related data.`,
    subscription_billing: `${count} flagged ${clauseWord} about charges, billing, or renewals.`,
    cancellation_refunds: `${count} flagged ${clauseWord} about cancellations or refunds.`,
    price_changes: `${count} flagged ${clauseWord} about prices or fee changes.`,
    liability_limits: `${count} flagged ${clauseWord} limiting responsibility or warranties.`,
    arbitration_disputes: `${count} flagged ${clauseWord} about disputes, arbitration, or legal rights.`,
    terms_changes: `${count} flagged ${clauseWord} about changing terms later.`,
    account_termination: `${count} flagged ${clauseWord} about suspending or ending access.`,
    third_party_services: `${count} flagged ${clauseWord} involving outside services or providers.`,
    user_content_license: `${count} flagged ${clauseWord} about rights to content you upload.`,
    marketing_communications: `${count} flagged ${clauseWord} about promotional messages or outreach.`,
    age_restrictions: `${count} flagged ${clauseWord} about age limits or parental requirements.`
  };

  return descriptions[type] || `${count} flagged ${clauseWord} in this category.`;
}

function renderEmptyState(container, title, text) {
  container.innerHTML = `
    <div class="emptyState">
      <div class="emptyStateTitle">${title}</div>
      <div class="emptyStateText">${text}</div>
    </div>
  `;
}

function showView(viewName) {
  const mainView = document.getElementById("mainView");
  const subcategoriesView = document.getElementById("subcategoriesView");
  const detailsView = document.getElementById("detailsView");

  if (mainView) mainView.style.display = "none";
  if (subcategoriesView) subcategoriesView.style.display = "none";
  if (detailsView) detailsView.style.display = "none";

  if (viewName === "main" && mainView) mainView.style.display = "block";
  if (viewName === "subcategories" && subcategoriesView) subcategoriesView.style.display = "block";
  if (viewName === "details" && detailsView) detailsView.style.display = "block";
}

function renderMain() {
  const results = document.getElementById("results");
  if (!results) return;

  const grouped = groupDetectionsByBigCategory(globalDetections);
  results.innerHTML = "";

  const visibleGroups = Object.entries(grouped).filter(([, items]) => items.length > 0);

  if (!visibleGroups.length) {
    renderEmptyState(
      results,
      "No flagged categories",
      "No enabled Big 8 categories were detected on this page."
    );
    return;
  }

  visibleGroups.forEach(([bigCategory, items]) => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.borderLeft = `4px solid ${bigCategoryColors[bigCategory] || "#d1d5db"}`;

    div.innerHTML = `
      <div class="row">
        <div class="cardHeaderText">
          <span class="type">${bigCategory}</span>
          <div class="cardMeta">${getBigCategoryDescription(bigCategory, items)}</div>
        </div>
        <button class="detailsBtn">View Details</button>
      </div>
    `;

    div.querySelector(".detailsBtn").onclick = () => {
      currentBigCategory = bigCategory;
      showSubcategories(bigCategory, items);
    };

    results.appendChild(div);
  });
}

function showSubcategories(bigCategory, items) {
  const title = document.getElementById("subcategoryTitle");
  const container = document.getElementById("subcategoryContent");

  if (!title || !container) return;

  title.innerText = bigCategory.toUpperCase();
  container.innerHTML = "";

  const groupedByType = groupDetectionsByType(items);
  const entries = Object.entries(groupedByType);

  if (!entries.length) {
    renderEmptyState(
      container,
      "No subcategories found",
      "This Big 8 category currently has no matching subcategories on this page."
    );
    lastView = "main";
    showView("subcategories");
    return;
  }

  entries.forEach(([type, clauses]) => {
    const card = document.createElement("div");
    card.className = "subcategoryCard";
    card.style.borderLeft = `4px solid ${bigCategoryColors[bigCategory] || "#d1d5db"}`;

    card.innerHTML = `
      <div class="subcategoryRow">
        <div class="subcategoryHeaderText">
          <span class="subcategoryType">${formatLabel(type)}</span>
          <div class="subcategoryMeta">${getSubcategoryDescription(type, clauses.length)}</div>
        </div>
        <button class="detailsBtn">View Details</button>
      </div>
    `;

    card.querySelector(".detailsBtn").onclick = () => {
      lastView = "subcategories";
      showClauseDetails(type, clauses);
    };

    container.appendChild(card);
  });

  lastView = "main";
  showView("subcategories");
}

function showClauseDetails(type, items) {
  const detailTitle = document.getElementById("detailTitle");
  const container = document.getElementById("detailContent");

  if (!detailTitle || !container) return;

  detailTitle.innerText = formatLabel(type).toUpperCase();
  container.innerHTML = "";

  if (!items.length) {
    renderEmptyState(
      container,
      "No clauses found",
      "There are no flagged clauses available for this subcategory."
    );
    showView("details");
    return;
  }

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

      <div class="locateStatus" style="display: none;"></div>
    `;

    const summaryEl = div.querySelector(".summary");
    const shortEl = div.querySelector(".shortText");
    const fullEl = div.querySelector(".fullText");
    const expandBtn = div.querySelector(".expandBtn");
    const locateBtn = div.querySelector(".locateBtn");
    const summaryToggleBtn = div.querySelector(".summaryToggleBtn");
    const locateStatus = div.querySelector(".locateStatus");

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

        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "scrollToClause",
            text: item.text
          },
          response => {
            if (chrome.runtime.lastError) {
              locateStatus.innerText = "Unable to locate clause on the page.";
              locateStatus.style.display = "block";
              return;
            }

            if (response && response.found) {
              locateStatus.style.display = "none";
            } else {
              locateStatus.innerText = "Clause could not be located on the current page view.";
              locateStatus.style.display = "block";
            }
          }
        );
      });
    };

    container.appendChild(div);
  });

  showView("details");
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
        renderMain();
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

document.getElementById("subcategoriesBackBtn").onclick = () => {
  showView("main");
};

document.getElementById("backBtn").onclick = () => {
  if (lastView === "subcategories") {
    showView("subcategories");
    return;
  }

  showView("main");
};

document.getElementById("optionsBtn").onclick = () => {
  chrome.runtime.openOptionsPage();
};