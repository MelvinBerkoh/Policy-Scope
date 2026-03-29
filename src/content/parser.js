// We are going to be DOM walking, text block extraction and visibility filtering in this file. This is where we will be parsing the page and extracting the relevant information. 
// We will then pass this information to the detection module which will be responsible for running the detection algorithms on the parsed data.
// Just know that Its set up this way because Parsing != detecting. We want to be able to parse the page and then run detection on the parsed data. 
// This allows us to have a more modular and flexible architecture.

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
          "SCRIPT",
          "STYLE",
          "NOSCRIPT",
          "NAV",
          "FOOTER",
          "HEADER",
          "BUTTON"
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