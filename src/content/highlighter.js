window.highlightsVisible = true;
window.highlightedSpans = [];
window.currentHighlightColors = null;

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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStoredHighlightColors() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["highlightColors"], result => {
      resolve({
        ...DEFAULT_BIG_CATEGORY_COLORS,
        ...(result.highlightColors || {})
      });
    });
  });
}

function getBorderColorForClause(clause) {
  const colors = window.currentHighlightColors || DEFAULT_BIG_CATEGORY_COLORS;
  return colors[clause.bigCategory] || "#94a3b8";
}

function applyHighlightStyles(span, borderColor, clause) {
  span.style.backgroundColor = "transparent";
  span.style.borderBottom = `2px solid ${borderColor}`;
  span.style.borderRadius = "2px";
  span.style.padding = "0 1px";
  span.style.boxDecorationBreak = "clone";
  span.style.webkitBoxDecorationBreak = "clone";
  span.dataset.originalBorderColor = borderColor;
  span.dataset.bigCategory = clause.bigCategory || "";
  span.dataset.subcategory = clause.type || "";
  span.title = `${clause.bigCategory || "PolicyScope"}${clause.type ? ` • ${clause.type.replaceAll("_", " ")}` : ""}`;
}

function highlightSingleClause(clause) {
  const node = clause.node;
  if (!node || !node.parentNode || !clause.text) return false;

  const fullText = node.textContent;
  const sentence = clause.text.trim();
  if (!fullText || !sentence) return false;

  const escapedSentence = escapeRegExp(sentence);
  const match = fullText.match(new RegExp(escapedSentence));
  if (!match || typeof match.index !== "number") return false;

  const start = match.index;
  const end = start + sentence.length;

  const beforeText = fullText.slice(0, start);
  const matchText = fullText.slice(start, end);
  const afterText = fullText.slice(end);

  const fragment = document.createDocumentFragment();

  if (beforeText) {
    fragment.appendChild(document.createTextNode(beforeText));
  }

  const span = document.createElement("span");
  const borderColor = getBorderColorForClause(clause);
  applyHighlightStyles(span, borderColor, clause);
  span.textContent = matchText;
  fragment.appendChild(span);

  if (afterText) {
    fragment.appendChild(document.createTextNode(afterText));
  }

  node.parentNode.replaceChild(fragment, node);

  clause.highlightElement = span;
  window.highlightedSpans.push(span);

  return true;
}

async function highlightClauses(detectedClauses) {
  window.currentHighlightColors = await getStoredHighlightColors();
  window.highlightedSpans = [];

  const groupedByNode = new Map();

  detectedClauses.forEach(clause => {
    if (!clause.node) return;
    if (!groupedByNode.has(clause.node)) {
      groupedByNode.set(clause.node, []);
    }
    groupedByNode.get(clause.node).push(clause);
  });

  groupedByNode.forEach(clauses => {
    clauses.forEach(clause => {
      if (!clause.node || !clause.node.parentNode) return;

      const success = highlightSingleClause(clause);

      if (success && clause.highlightElement) {
        clause.node =
          clause.highlightElement.nextSibling ||
          clause.highlightElement.previousSibling ||
          clause.node;
      }
    });
  });

  if (!window.highlightsVisible) {
    updateHighlightVisibility(false);
  }
}

function updateHighlightVisibility(isVisible) {
  window.highlightsVisible = isVisible;

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    return;
  }

  window.highlightedSpans.forEach(span => {
    span.style.borderBottomColor = isVisible
      ? span.dataset.originalBorderColor
      : "transparent";
    span.style.backgroundColor = "transparent";
  });
}

async function refreshHighlightColors() {
  const colors = await getStoredHighlightColors();
  window.currentHighlightColors = colors;

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    return;
  }

  window.highlightedSpans.forEach(span => {
    const bigCategory = span.dataset.bigCategory;
    const newColor = colors[bigCategory] || "#94a3b8";
    span.dataset.originalBorderColor = newColor;
    span.style.borderBottomColor = window.highlightsVisible ? newColor : "transparent";
  });
}

function createPolicyScopeBadge(count) {
  const existing = document.getElementById("policyScopeBadge");
  if (existing) existing.remove();

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