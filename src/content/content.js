/**
 * PolicyScope - Content Script Entry Point
 * This script is automatically injected into webpages by Chrome
 * We defined this in manifest.json
 * 
 * Its job right now is:
 * 1. Extract meaningful visible text blocks from the page
 * 2. Return structured data that future modules can use (highlighting, summarization, detector, etc.)
 * 
 * NOTE:
 * In this phase we are NOT detecting clauses yet
 * We are NOT modifying the DOM yet 
 * THis is going to just be a data extractor layer.
 * 
 */

console.log("PolicyScope content script loaded");

/**
 * getTextBlocks()
 * Walk the DOM and collect meaningful visible text blocks/nodes
 * 
 * Why we are gong to use TreeWalker:
 * It allows us to iterate through text nodes only 
 * More precise than using document.body.innerText which can be noisy and include hidden text
 * Gives us direct access to the actual text node objects which we can later use for highlighting and other manipulations
 * 
 * Output format:
 * [
 *  {text:"...", node: TextNode}
 * ]
 * 
 * We are storing BOTH:
 * text (detection and summarization will work on this)
 * node (wrap using <span></span>)
 */

function getTextBlocks() {
  const blocks = [];

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT, // Only visit text nodes (not elements)
    {
      acceptNode(node) {
        const parent = node.parentElement;

        // Safety check — reject if no parent
        if (!parent) return NodeFilter.FILTER_REJECT;

        const text = node.textContent.trim();

        // Ignore empty text
        if (!text) return NodeFilter.FILTER_REJECT;

        /**
         * Ignore short strings.
         *
         * Why?
         * Navigation links
         * Button labels
         * Small UI components
         * Legal clauses are usually full sentences or paragraphs.
         */
        if (text.length < 40) return NodeFilter.FILTER_REJECT;

        /**
         * Ignore structural / UI tags.
         *
         * Why?
         * We don’t want nav bars, footers, scripts, buttons.
         * These contain noise and not agreement language.
         */
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

        /**
         * Ignore hidden elements.
         *
         * Why?
         * Some pages preload hidden templates.
         * We only care about what the user can actually see.
         */
        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        // If all checks pass, accept this text node
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  /**
   * Iterate through accepted nodes
   * and build structured output.
   */
  while (walker.nextNode()) {
    blocks.push({
      text: walker.currentNode.textContent.trim(),
      node: walker.currentNode
    });
  }

  return blocks;
}

/**
 * Execute extraction immediately.
 *
 * This is temporary for testing.
 * Later this will be called by the orchestrator layer.
 */
const blocks = getTextBlocks();

console.log(`Extracted ${blocks.length} text blocks`);
console.log(blocks);

// The following should be an example of how  we can start parsing for things

// Billing detection

/**
 * detectClauses()
 *
 * Purpose:
 * Classify extracted text blocks into important policy categories
 * using rule-based pattern matching.
 *
 * Categories we currently support:
 * - Billing and auto-renewal terms
 * - Subscription and refund conditions
 * - Data collection practices
 * - Data sharing with third parties
 *
 * NOTE ABOUT ARBITRATION / LEGAL LIMITATION CLAUSES:
 * Arbitration clauses are much harder to detect with simple keyword
 * patterns because the legal language varies significantly across sites.
 * Phrases like "binding arbitration", "waive your right to a jury trial",
 * or "limitation of liability" may appear in many different forms.
 *
 * For the MVP we may start with a few basic keywords, but this category
 * will likely require more advanced pattern logic or contextual analysis
 * later in the project.
 */

function detectClauses(blocks) {

  const patterns = {
    billing_auto_renewal: [
      /auto[- ]?renew/i,
      /automatic renewal/i,
      /recurring charge/i,
      /billed (monthly|annually)/i,
      /subscription fee/i
    ],

    subscription_refund: [
      /refund/i,
      /cancel(ation)? policy/i,
      /subscription terms/i,
      /trial period/i,
      /money[- ]?back/i
    ],

    data_collection: [
      /collect(ion)? of (your )?data/i,
      /information we collect/i,
      /personal information/i,
      /data we gather/i
    ],

    data_sharing: [
      /third[- ]party/i,
      /share your data/i,
      /partners and affiliates/i,
      /service providers/i
    ],

    // Harder category – only very basic indicators for now (prob going to expand on this later)
    arbitration_legal: [
      /binding arbitration/i,
      /waive your right/i,
      /jury trial/i,
      /limitation of liability/i,
      /dispute resolution/i
    ]
  };

  const results = [];

  blocks.forEach(block => {
    const text = block.text;

    for (const [type, regexList] of Object.entries(patterns)) {

      const match = regexList.some(pattern => pattern.test(text));

      if (match) {
        results.push({
          type: type,
          text: block.text,
          node: block.node
        });

        // stop checking other categories once matched
        break;
      }
    }
  });

  return results;
}

const detectedClauses = detectClauses(blocks);

console.log("Detected Clauses:", detectedClauses);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "getDetections") {
    sendResponse({ data: detectedClauses });
  }

});


