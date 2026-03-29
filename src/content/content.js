console.log("PolicyScope content script loaded");

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