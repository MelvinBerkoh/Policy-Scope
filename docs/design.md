# Design Notes

This document describes the design goals, user experience decisions, and architectural reasoning behind PolicyScope.

## Product Goal

PolicyScope was designed to help users make better sense of long online agreements before agreeing to them. Most terms of service and policy pages are difficult to read because they are long, dense, and written in legal or corporate language. The purpose of PolicyScope is to reduce that friction by surfacing important clauses, organizing them into understandable groups, and explaining them in plain English.

The design goal was not to replace the source document, but to create a better path through it.

---

## Core UX Principles

Several user experience principles guided the design of the extension.

### 1. Show, then explain

The user should first see that something important exists on the page, and then be able to understand it. That is why the extension highlights clauses directly in the original document and also gives summaries in the popup.

### 2. Reduce clutter

The extension should not overwhelm the user with too many categories or too much technical language at once. That is why the popup shows the Big 8 categories first instead of exposing every internal clause type immediately.

### 3. Keep the page recognizable

The webpage itself should still feel like the original site. Highlights should point attention toward important language without turning the page into a fully re-styled interface.

### 4. Let users verify the source

AI summaries are useful, but users should always be able to go back to the source text. That is why the popup includes a Locate workflow and shows the original clause text next to the summary.

### 5. Keep customization separate from the main reading flow

The popup is for reading and navigating. The options page is for customization. This keeps the popup focused and easier to use.

---

## Main User Flow

The intended user journey looks like this:

1. User opens a policy or terms page
2. PolicyScope scans the visible text
3. Important clauses are highlighted directly on the page
4. The popup groups flagged content into the Big 8 categories
5. The user opens a category and sees the related subcategories
6. The user opens a subcategory and sees individual clauses
7. The user reads a plain-English AI summary
8. The user can jump back to the original clause on the page

This layered flow was chosen because it balances simplicity and detail. Users who want a quick overview can stop at the top-level categories. Users who want more precision can drill down further.

---

## Big 8 Design Choice

One of the most important design decisions was moving from many detailed internal categories to 8 broader user-facing categories.

This was done because:

- too many raw categories made the popup feel overly technical
- many internal categories are related and can be grouped naturally
- a smaller number of broad categories is easier to scan quickly
- judges, PMs, and non-technical users can understand the extension more easily this way

The detailed categories still exist internally for detection accuracy, but the interface was simplified into a more accessible structure.

---

## Highlight Design

Highlighting originally leaned toward larger paragraph-level emphasis, but that approach created visual noise and made the extension feel more invasive.

The design shifted to sentence-level highlighting because it:

- focuses attention more precisely
- keeps the page cleaner
- makes clause-to-summary alignment clearer
- improves locate-on-page behavior

The extension also allows users to customize highlight appearance through the settings page, including:

- highlight colors
- highlight style
- category visibility
- default highlight visibility

That flexibility supports different reading preferences and different page styles.

---

## Popup Design

The popup is the main control surface of the extension.

It was designed to support:

- fast scanning
- drilldown navigation
- minimal cognitive load

### Popup Design Decisions

- show the Big 8 first
- move View Details into the card layout for faster interaction
- use compact card-based grouping
- separate main view, subcategory view, and clause view
- keep summaries short
- allow users to expand the original clause if needed

The popup was intentionally kept lighter than a dashboard-style interface. The goal was to make it easy to open, read, and act on quickly.

---

## Options Page Design

The options page was created to separate customization from the main reading workflow.

It currently supports:

- Big 8 category color changes
- highlight style selection
- showing or hiding the floating badge
- enabling or disabling categories
- choosing whether highlights are visible by default

This design helps the extension feel more complete and user-centered without overloading the popup with configuration controls.

---

## Badge Design

The floating badge exists as a lightweight discovery and re-entry point on supported pages.

Its purpose is:

- to indicate that PolicyScope detected content on the page
- to give users a visible entry point without requiring them to use the toolbar icon
- to make the extension feel more active and responsive

At the same time, the badge can be disabled because not every user wants a floating element on the page.

---

## Technical Design Philosophy

The project follows a modular design philosophy. Parsing, detection, highlighting, popup logic, settings management, and backend summarization are all handled in separate files and layers.

This was done for several reasons:

- easier debugging
- easier extension over time
- easier explanation during demos and documentation
- lower risk when updating one part of the project
- clearer boundaries between frontend, content, and backend logic

The architecture reflects the idea that good extension design is not just about what the user sees, but also about how clearly the codebase is organized.

---

## Security and Trust Design Considerations

Because the extension deals with legal text and AI summaries, trust was an important design concern.

The project therefore tries to make the experience more trustworthy by:

- always showing the original clause text
- allowing the user to return to the clause on the page
- keeping AI summaries short and focused
- avoiding raw HTML injection for summaries
- keeping the OpenAI API key on the backend only

The product is not meant to replace legal review, but to give the user a clearer first-pass understanding.

---

## Current Design Strengths

Some of the strongest parts of the current design are:

- clear Big 8 grouping
- sentence-level highlighting
- layered popup drilldown
- settings-based customization
- strong separation of concerns in the architecture
- a workflow that is understandable in demos and documentation

---

## Current Design Limitations

There are still some limitations in the current design:

- not every site uses policy language in the same way
- some highlights may be harder to apply depending on DOM structure
- visual design could still be refined further
- some categories overlap conceptually
- the backend summary flow currently depends on a local development server

These are acceptable limitations for the current stage of the project.

---

## Future Design Directions

Potential future design improvements include:

- improved visual polish and branding consistency
- more refined severity or risk signaling
- stronger fallback behavior for unusual page structures
- a cleaner deployed backend workflow
- more polished onboarding or first-use guidance
- deeper accessibility improvements

---

## Summary

The design of PolicyScope is centered on clarity, layered understanding, and controlled complexity. Internally, the system is detailed and modular. Externally, the user experience is simplified into a smaller set of understandable categories and actions. The result is an extension designed to make dense online agreements easier to scan, easier to navigate, and easier to understand.
