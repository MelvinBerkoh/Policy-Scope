console.log("PolicyScope content script loaded");

function getTextBlocks() {
  const blocks = [];

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const text = node.textContent.trim();
        if (!text || text.length < 40) return NodeFilter.FILTER_REJECT;

        const ignoredTags = [
          "SCRIPT","STYLE","NOSCRIPT",
          "NAV","FOOTER","HEADER","BUTTON"
        ];

        if (ignoredTags.includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    blocks.push({
      text: walker.currentNode.textContent.trim(),
      node: walker.currentNode
    });
  }

  return blocks;
}

function detectClauses(blocks) {
  const patterns = {
    billing_auto_renewal: [/auto[- ]?renew/i, /recurring/i],
    subscription_refund: [/refund/i, /cancel/i],
    data_collection: [/collect/i],
    data_sharing: [/third[- ]party/i, /share/i],
    arbitration_legal: [/arbitration/i, /liability/i]
  };

  const results = [];

  blocks.forEach(block => {
    for (const [type, list] of Object.entries(patterns)) {
      if (list.some(p => p.test(block.text))) {
        results.push({ type, text: block.text, node: block.node });
        break;
      }
    }
  });

  return results;
}

const blocks = getTextBlocks();
const detectedClauses = detectClauses(blocks);

console.log("Detected Clauses:", detectedClauses);

/**
 * Toggle highlight ON/OFF properly
 */
function toggleHighlights() {

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    console.log("No highlights to toggle");
    return;
  }

  const isCurrentlyHidden =
    window.highlightedSpans[0].style.backgroundColor === "transparent";

  window.highlightedSpans.forEach(span => {
    span.style.backgroundColor = isCurrentlyHidden
      ? span.dataset.originalColor
      : "transparent";
  });
}

/**
 * INITIAL RENDER
 */
highlightClauses(detectedClauses);
createPolicyScopeBadge(detectedClauses.length, detectedClauses);

/**
 * SINGLE CLEAN MESSAGE LISTENER
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "getDetections") {
    sendResponse({ data: detectedClauses });
    return;
  }

  if (request.action === "scrollToClause") {
    const match = detectedClauses.find(c => c.text === request.text);
    match?.node?.parentElement?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    return;
  }

  /**
   * ✅ IMPORTANT: AI now goes through background.js
   */
  if (request.action === "analyzeClause") {
    chrome.runtime.sendMessage(
      {
        action: "analyzeClause",
        text: request.text
      },
      response => {
        sendResponse(response);
      }
    );
    return true;
  }

  if (request.action === "toggleHighlight") {
    console.log("Toggling highlights");
    toggleHighlights();
    return;
  }
});