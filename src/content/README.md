# Content Scripts

This folder contains the core content-side logic for PolicyScope. These files are responsible for reading policy pages, detecting important clauses, highlighting them directly in the DOM, and responding to popup interactions such as locating clauses on the page.

## Files

- **parser.js**  
  Handles DOM walking, text extraction, and sentence splitting. Its job is to gather readable text blocks from the page while ignoring hidden or irrelevant elements such as scripts, navigation, and buttons.

- **detector.js**  
  Contains the rule-based detection logic for identifying policy-related clauses. It maps sentence-level matches into internal subcategories and then into the Big 8 user-facing categories used by the extension.

- **highlighter.js**  
  Applies visual highlighting to detected clauses in the webpage. It also controls highlight style, color updates, visibility toggling, and the floating PolicyScope badge shown on supported pages.

- **content.js**  
  Serves as the main controller for the content script layer. It initializes parsing and detection, applies highlights, manages active detections based on settings, and handles messaging between the webpage and the extension popup.

## Responsibilities

Together, the files in this folder support the main on-page workflow of PolicyScope:

1. Extract visible policy text from the page
2. Split the text into smaller sentence-level units
3. Detect important clauses using rule-based matching
4. Map clauses into Big 8 categories and subcategories
5. Highlight supported clauses directly on the page
6. Respond to popup actions such as toggling highlights or locating a clause

## Design Notes

- The content layer is intentionally modular so parsing, detection, highlighting, and orchestration remain separate concerns.
- This separation makes the system easier to debug, easier to explain, and safer to extend as new clause types are added.
- The content scripts operate on third-party webpages, so the code is written carefully to minimize unnecessary DOM mutation and reduce the chance of breaking page behavior.
