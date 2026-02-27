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

/**
 * Summary of Current Architecture Layer:
 *
 * Chrome Runtime
 *     |
 * Content Script (this file)
 *     |
 * getTextBlocks()  -> returns structured data
 *
 * Next step (future):
 * blocks -> Detection Engine ->Highlighter
 */


