window.highlightsVisible = true;
window.highlightedSpans = [];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBorderColor(type) {
  const borderColors = {
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

  return borderColors[type] || "#94a3b8";
}

function applyHighlightStyles(span, borderColor, type) {
  span.style.backgroundColor = "transparent";
  span.style.borderBottom = `2px solid ${borderColor}`;
  span.style.borderRadius = "2px";
  span.style.padding = "0 1px";
  span.style.boxDecorationBreak = "clone";
  span.style.webkitBoxDecorationBreak = "clone";
  span.dataset.originalBorderColor = borderColor;
  span.title = type.replaceAll("_", " ");
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
  const borderColor = getBorderColor(clause.type);
  applyHighlightStyles(span, borderColor, clause.type);
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

function highlightClauses(detectedClauses) {
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
        clause.node = clause.highlightElement.nextSibling || clause.highlightElement.previousSibling || clause.node;
      }
    });
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