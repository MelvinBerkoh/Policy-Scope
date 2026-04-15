console.log("PolicyScope content script loaded");

const blocks = getTextBlocks();
const detectedClauses = detectClauses(blocks);

console.log("Detected Clauses:", detectedClauses);

function toggleHighlights() {
  updateHighlightVisibility(!window.highlightsVisible);
}

highlightClauses(detectedClauses);
createPolicyScopeBadge(detectedClauses.length);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDetections") {
    sendResponse({
      data: detectedClauses.map(({ type, bigCategory, text }) => ({
        type,
        bigCategory,
        text
      }))
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

  if (request.action === "refreshHighlightColors") {
    refreshHighlightColors().then(() => sendResponse({ ok: true }));
    return true;
  }
});