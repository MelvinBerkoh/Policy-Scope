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
          "SCRIPT", "STYLE", "NOSCRIPT",
          "NAV", "FOOTER", "HEADER", "BUTTON"
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

function splitIntoSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]?/g);
  return matches ? matches.map(s => s.trim()).filter(Boolean) : [text];
}

function detectClauses(blocks) {
  const patterns = {
    billing_auto_renewal: [/auto[- ]?renew/i, /recurring/i],
    subscription_refund: [/refund/i, /cancel/i],
    data_collection: [/collect/i],
    data_sharing: [/third[- ]?party/i, /share/i],
    arbitration_legal: [/arbitration/i, /liability/i]
  };

  const results = [];

  blocks.forEach(block => {
    const sentences = splitIntoSentences(block.text);

    sentences.forEach(sentence => {
      for (const [type, list] of Object.entries(patterns)) {
        if (list.some(p => p.test(sentence))) {
          results.push({
            type,
            text: sentence,
            node: block.node,
            highlightElement: null
          });
          break;
        }
      }
    });
  });

  return results;
}

const blocks = getTextBlocks();
const detectedClauses = detectClauses(blocks);

console.log("Detected Clauses:", detectedClauses);

function toggleHighlights() {
  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    console.log("No highlights to toggle");
    return;
  }

  window.highlightsVisible = !window.highlightsVisible;

  window.highlightedSpans.forEach(span => {
    span.style.borderBottomColor = window.highlightsVisible
      ? span.dataset.originalBorderColor
      : "transparent";
    span.style.backgroundColor = "transparent";
  });
}

highlightClauses(detectedClauses);
createPolicyScopeBadge(detectedClauses.length);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDetections") {
    sendResponse({
      data: detectedClauses.map(({ type, text }) => ({ type, text }))
    });
    return;
  }

  if (request.action === "scrollToClause") {
    const match = detectedClauses.find(c => c.text === request.text);

    if (match?.highlightElement) {
      match.highlightElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else if (match?.node?.parentElement) {
      match.node.parentElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    return;
  }

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
    toggleHighlights();
    return;
  }
});