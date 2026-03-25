// This will wrap text in a span and add a class to it. This is going to be used for highlighting the text that we want to highlight.
//  We will be using this in the detector module to highlight the text that we want to highlight based on the detections that we make. 
// This is going to be a simple function that takes in the text and the class name and then wraps the text in a span and adds the class name to it. 
// This will allow us to easily highlight the text that we want to highlight based on our detections.
// UI manipulation should be isolated and it reduces the risk of breaking the page
window.highlightsVisible = true;
window.highlightedSpans = [];

function highlightClauses(detectedClauses) {

  detectedClauses.forEach(clause => {

    const node = clause.node;
    if (!node || !node.parentNode) return;

    const span = document.createElement("span");

    const colors = {
      billing_auto_renewal: "#fff3a0",
      subscription_refund: "#ffd6a5",
      data_collection: "#caffbf",
      data_sharing: "#bdb2ff",
      arbitration_legal: "#ffadad"
    };

    span.style.backgroundColor = colors[clause.type] || "#ffff99";
    span.style.padding = "2px";
    span.style.borderRadius = "3px";

    span.title = clause.type;

    node.parentNode.replaceChild(span, node);
    span.appendChild(node);

    window.highlightedSpans.push(span);
  });

}

function toggleHighlights() {

  if (!window.highlightedSpans || window.highlightedSpans.length === 0) {
    console.log("No highlights to toggle");
    return;
  }

  // Use a global toggle state instead
  window.highlightsVisible = !window.highlightsVisible;

  window.highlightedSpans.forEach(span => {
    span.style.backgroundColor = window.highlightsVisible
      ? span.dataset.originalColor
      : "transparent";
  });
}

function createPolicyScopeBadge(count, detectedClauses) {

  const existing = document.getElementById("policyScopeBadge");
  if (existing) existing.remove();

  const badge = document.createElement("div");
  badge.id = "policyScopeBadge";

  badge.innerText = `PolicyScope • ${count}`;

  badge.style.position = "fixed";
  badge.style.bottom = "20px";
  badge.style.right = "20px";
  badge.style.background = "#111";
  badge.style.color = "white";
  badge.style.padding = "10px 14px";
  badge.style.borderRadius = "8px";
  badge.style.fontSize = "12px";
  badge.style.cursor = "pointer";
  badge.style.zIndex = "999999";
  badge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  badge.style.transition = "transform 0.1s ease";

  // hover effect
  badge.onmouseenter = () => {
    badge.style.transform = "scale(1.05)";
  };

  badge.onmouseleave = () => {
    badge.style.transform = "scale(1)";
  };

  /**
   * CLICK BEHAVIOR
   * scroll to FIRST detected clause
   */
  badge.onclick = () => {

  if (!detectedClauses || detectedClauses.length === 0) return;

  const first = detectedClauses[0];

  if (first?.node?.parentElement) {
    first.node.parentElement.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    // Optional: brief visual emphasis
    first.node.parentElement.style.outline = "2px solid red";

    setTimeout(() => {
      first.node.parentElement.style.outline = "none";
    }, 1500);
  }

};

  document.body.appendChild(badge);
}