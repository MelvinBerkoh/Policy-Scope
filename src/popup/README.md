# Popup Interface

This folder contains the main PolicyScope popup interface. The popup is the primary user-facing layer of the extension and is responsible for presenting detected policy categories, subcategories, clause details, and AI-generated summaries in a structured way.

## Files

- **popup.html**  
  Defines the structure of the extension popup, including the main category view, subcategory drilldown, detail view, and navigation controls.

- **popup.css**  
  Provides the styling for the popup interface, including layout, card design, typography, buttons, empty states, and detail view formatting.

- **popup.js**  
  Handles the popup logic, including detection grouping, Big 8 category rendering, subcategory drilldown, clause detail rendering, AI summary requests, highlight toggling, and navigation between popup views.

## Responsibilities

The popup layer is responsible for turning raw detections into a user-friendly workflow. Its current responsibilities include:

1. Displaying the Big 8 policy categories at the top level
2. Showing the subcategories found within each Big 8 category
3. Rendering flagged clauses and their plain-English AI summaries
4. Allowing users to expand full clause text when needed
5. Letting users locate the original clause back on the page
6. Providing access to settings and highlight controls

## UI Flow

The popup currently follows a drilldown structure:

- **Main View**  
  Shows the Big 8 parent categories and how many subcategory types were found in each one.

- **Subcategory View**  
  Displays the detected subcategories inside a selected Big 8 category.

- **Detail View**  
  Shows the original clause text, AI-generated summary, and navigation tools for each flagged clause.

## Design Notes

- The popup is designed to simplify dense policy language into a layered, easier-to-follow experience.
- Big 8 categories are shown first to reduce clutter and avoid exposing too many technical subcategory labels at the top level.
- Detailed subcategories and clause summaries are still available through drilldown so the system remains transparent and explainable.
- The popup does not perform detection itself; it depends on the content scripts and background/backend messaging pipeline.
