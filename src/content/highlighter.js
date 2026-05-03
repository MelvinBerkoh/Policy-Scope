window.highlightsVisible = true;
window.highlightedSpans = [];
window.currentPolicyScopeSettings = null;

const DEFAULT_POLICY_SCOPE_SETTINGS = {
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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergePolicyScopeSettings(savedSettings = {}) {
  return {
    ...DEFAULT_POLICY_SCOPE_SETTINGS,
    ...savedSettings,
    highlightColors: {
      ...DEFAULT_POLICY_SCOPE_SETTINGS.highlightColors,
      ...(savedSettings.highlightColors || {})
    },
    enabledBigCategories: {
      ...DEFAULT_POLICY_SCOPE_SETTINGS.enabledBigCategories,
      ...(savedSettings.enabledBigCategories || {})
    }
  };
}

function getPolicyScopeSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["policyScopeSettings"], result => {
      resolve(mergePolicyScopeSettings(result.policyScopeSettings));
    });
  });
}

function hexToRgba(hex, alpha = 0.16) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map(char => char + char).join("")
    : clean;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBorderColorForClause(clause) {
  const settings = window.currentPolicyScopeSettings || DEFAULT_POLICY_SCOPE_SETTINGS;
  return settings.highlightColors[clause.bigCategory] || "#94a3b8";
}

function applyHighlightStyles(span, borderColor, clause) {
  const settings = window.currentPolicyScopeSettings || DEFAULT_POLICY_SCOPE_SETTINGS;
  const style = settings.highlightStyle || "underline";

  span.style.borderRadius = "2px";
  span.style.padding = "0 1px";
  span.style.boxDecorationBreak = "clone";
  span.style.webkitBoxDecorationBreak = "clone";

  if (style === "background") {
    span.style.borderBottom = "2px solid transparent";
    span.style.backgroundColor = hexToRgba(borderColor, 0.18);
  } else if (style === "both") {
    span.style.borderBottom = `2px solid ${borderColor}`;
    span.style.backgroundColor = hexToRgba(borderColor, 0.14);
  } else {
    span.style.borderBottom = `2px solid ${borderColor}`;
    span.style.backgroundColor = "transparent";
  }

  span.dataset.originalBorderColor = borderColor;
  span.dataset.originalBackgroundColor =
    style === "background" || style === "both"
      ? hexToRgba(borderColor, style === "background" ? 0.18 : 0.14)
      : "transparent";
  span.dataset.bigCategory = clause.bigCategory || "";
  span.dataset.subcategory = clause.type || "";
  span.title = `${clause.bigCategory || "PolicyScope"}${clause.type ? ` • ${clause.type.replaceAll("_", " ")}` : ""}`;
}

function setSpanVisualState(span, isVisible) {
  const settings = window.currentPolicyScopeSettings || DEFAULT_POLICY_SCOPE_SETTINGS;
  const style = settings.highlightStyle || "underline";
  const categoryEnabled = settings.enabledBigCategories[span.dataset.bigCategory] !== false;

  if (!isVisible || !categoryEnabled) {
    span.style.borderBottomColor = "transparent";
    span.style.backgroundColor = "transparent";
    return;
  }

  if (style === "background") {
    span.style.borderBottomColor = "transparent";
    span.style.backgroundColor = span.dataset.originalBackgroundColor || "transparent";
  } else if (style === "both") {
    span.style.borderBottomColor = span.dataset.originalBorderColor || "transparent";
    span.style.backgroundColor = span.dataset.originalBackgroundColor || "transparent";
  } else {
    span.style.borderBottomColor = span.dataset.originalBorderColor || "transparent";
    span.style.backgroundColor = "transparent";
  }
}

function buildNonOverlappingMatches(fullText, clauses) {
  const rawMatches = [];

  clauses.forEach(clause => {
    const sentence = clause.text?.trim();
    if (!sentence) return;

    const regex = new RegExp(escapeRegExp(sentence), "g");
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      rawMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        clause
      });
    }
  });

  rawMatches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const accepted = [];
  let lastEnd = -1;

  rawMatches.forEach(match => {
    if (match.start >= lastEnd) {
      accepted.push(match);
      lastEnd = match.end;
    }
  });

  return accepted;
}

function highlightNodeClauses(node, clauses) {
  if (!node || !node.parentNode || !clauses.length) return;

  const fullText = node.textContent;
  if (!fullText) return;

  const matches = buildNonOverlappingMatches(fullText, clauses);
  if (!matches.length) return;

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  matches.forEach(match => {
    if (match.start > cursor) {
      fragment.appendChild(document.createTextNode(fullText.slice(cursor, match.start)));
    }

    const span = document.createElement("span");
    const borderColor = getBorderColorForClause(match.clause);
    applyHighlightStyles(span, borderColor, match.clause);
    span.textContent = fullText.slice(match.start, match.end);

    match.clause.highlightElement = span;
    window.highlightedSpans.push(span);
    fragment.appendChild(span);

    cursor = match.end;
  });

  if (cursor < fullText.length) {
    fragment.appendChild(document.createTextNode(fullText.slice(cursor)));
  }

  node.parentNode.replaceChild(fragment, node);
}

async function highlightClauses(detectedClauses) {
  window.currentPolicyScopeSettings = await getPolicyScopeSettings();
  window.highlightedSpans = [];

  const groupedByNode = new Map();

  detectedClauses.forEach(clause => {
    if (!clause.node) return;
    if (!groupedByNode.has(clause.node)) {
      groupedByNode.set(clause.node, []);
    }
    groupedByNode.get(clause.node).push(clause);
  });

  groupedByNode.forEach((clauses, node) => {
    highlightNodeClauses(node, clauses);
  });

  updateHighlightVisibility(window.highlightsVisible);
}

function updateHighlightVisibility(isVisible) {
  window.highlightsVisible = isVisible;

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    return;
  }

  window.highlightedSpans.forEach(span => {
    setSpanVisualState(span, isVisible);
  });
}

async function refreshPolicyScopeSettingsOnPage() {
  window.currentPolicyScopeSettings = await getPolicyScopeSettings();

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    return;
  }

  window.highlightedSpans.forEach(span => {
    const bigCategory = span.dataset.bigCategory;
    const newColor =
      window.currentPolicyScopeSettings.highlightColors[bigCategory] || "#94a3b8";

    span.dataset.originalBorderColor = newColor;

    if (window.currentPolicyScopeSettings.highlightStyle === "background") {
      span.dataset.originalBackgroundColor = hexToRgba(newColor, 0.18);
    } else if (window.currentPolicyScopeSettings.highlightStyle === "both") {
      span.dataset.originalBackgroundColor = hexToRgba(newColor, 0.14);
    } else {
      span.dataset.originalBackgroundColor = "transparent";
    }

    setSpanVisualState(span, window.highlightsVisible);
  });
}

function removePolicyScopeBadge() {
  const existing = document.getElementById("policyScopeBadge");
  if (existing) existing.remove();
}

function createPolicyScopeBadge(count) {
  removePolicyScopeBadge();

  const badge = document.createElement("button");
  badge.id = "policyScopeBadge";
  badge.innerText = `PolicyScope • ${count}`;

  badge.style.position = "fixed";
  badge.style.bottom = "20px";
  badge.style.right = "20px";
  badge.style.background = "linear-gradient(135deg, #4f46e5, #4338ca)";
  badge.style.color = "white";
  badge.style.padding = "11px 16px";
  badge.style.borderRadius = "999px";
  badge.style.fontSize = "12px";
  badge.style.fontFamily = "Arial, sans-serif";
  badge.style.fontWeight = "700";
  badge.style.cursor = "pointer";
  badge.style.zIndex = "999999";
  badge.style.border = "none";
  badge.style.boxShadow = "0 10px 24px rgba(79, 70, 229, 0.32)";
  badge.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";

  badge.addEventListener("mouseenter", () => {
    badge.style.transform = "translateY(-1px)";
    badge.style.boxShadow = "0 14px 28px rgba(79, 70, 229, 0.38)";
  });

  badge.addEventListener("mouseleave", () => {
    badge.style.transform = "translateY(0)";
    badge.style.boxShadow = "0 10px 24px rgba(79, 70, 229, 0.32)";
  });

  badge.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openPolicyScopePopup" });
  });

  document.body.appendChild(badge);
}