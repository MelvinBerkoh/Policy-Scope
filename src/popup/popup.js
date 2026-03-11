// This file should just receive the detections group by clauses type and school-to highlight behavior. The UI should stay separate from page logic.
// This is going to be the main entry point for the popup script and it will be responsible for rendering the results of the detections and allowing the user to interact with the extension.

function groupByType(detections) {
  const grouped = {};

  detections.forEach(item => {
    if (!grouped[item.type]) {
      grouped[item.type] = 0;
    }
    grouped[item.type]++;
  });

  return grouped;
}

function renderResults(grouped) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  Object.entries(grouped).forEach(([type, count]) => {
    const item = document.createElement("div");
    item.className = "result-item";

    item.innerHTML = `
      <div class="result-title">${type.replace("_", " ")}</div>
      <div class="result-count">${count} clauses detected</div>
    `;

    resultsDiv.appendChild(item);
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, { action: "getDetections" }, response => {

    if (!response || !response.data) {
      document.getElementById("results").innerHTML =
        "<p>No clauses detected.</p>";
      return;
    }

    const grouped = groupByType(response.data);
    renderResults(grouped);
  });
});