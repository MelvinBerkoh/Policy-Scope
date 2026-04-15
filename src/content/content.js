console.log("PolicyScope content script loaded");

const blocks = getTextBlocks();
const allDetectedClauses = detectClauses(blocks);
let activeDetectedClauses = [];

console.log("Detected Clauses:", allDetectedClauses);

async function applyPolicyScopeSettings() {
  const settings = await getPolicyScopeSettings();

  activeDetectedClauses = allDetectedClauses.filter(
    clause => settings.enabledBigCategories[clause.bigCategory] !== false
  );

  window.highlightsVisible = settings.highlightsEnabledByDefault;

  await refreshPolicyScopeSettingsOnPage();

  if (settings.showFloatingBadge) {
    createPolicyScopeBadge(activeDetectedClauses.length);
  } else {
    removePolicyScopeBadge();
  }

  updateHighlightVisibility(window.highlightsVisible);
}

function toggleHighlights() {
  updateHighlightVisibility(!window.highlightsVisible);
}

async function initializePolicyScope() {
  await highlightClauses(allDetectedClauses);
  await applyPolicyScopeSettings();
}

initializePolicyScope();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDetections") {
    sendResponse({
      data: activeDetectedClauses.map(({ type, bigCategory, text }) => ({
        type,
        bigCategory,
        text
      }))
    });
    return;
  }

  if (request.action === "scrollToClause") {
    const match = activeDetectedClauses.find(c => c.text === request.text);

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

  if (request.action === "refreshPolicyScopeSettings") {
    applyPolicyScopeSettings().then(() => sendResponse({ ok: true }));
    return true;
  }
});