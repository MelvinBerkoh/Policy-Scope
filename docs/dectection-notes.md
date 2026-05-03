# Detection Notes

This document summarizes how clause detection works in PolicyScope, how categories are structured, and what design decisions were made while building the current detection pipeline.

## Detection Strategy

PolicyScope currently uses a rule-based detection system. Instead of relying on AI to identify every important clause from scratch, the extension first scans the visible text of a policy page, breaks that text into sentence-level units, and then checks each sentence against a set of category-specific detection patterns.

This approach was chosen for a few reasons:

- it is easier to debug than a fully opaque classification system
- it gives more predictable behavior during development
- it reduces unnecessary AI usage
- it allows the team to explain exactly why a clause was flagged

In the current system, AI is used after detection, not before it. The detector identifies likely important clauses first, and the backend only generates plain-English summaries for clauses that have already been matched.

---

## Parsing Before Detection

Detection begins only after text is extracted from the DOM.

The parser layer is responsible for:

- walking the visible DOM
- extracting text blocks from readable page elements
- filtering out hidden or irrelevant nodes
- ignoring common non-content tags such as:
  - script
  - style
  - noscript
  - nav
  - footer
  - header
  - button
- splitting large text blocks into sentence-like units

This separation is important because parsing and detection solve different problems. The parser finds usable text. The detector decides whether that text belongs to one of the supported policy categories.

---

## Internal Clause Types

The detector currently works with more detailed internal subcategories rather than only broad labels. This allows the extension to be more precise behind the scenes.

### Data Collection

- `data_collection`
- `tracking_cookies`
- `data_retention`
- `sensitive_data`

### Data Sharing

- `data_sharing`
- `third_party_services`

### Billing & Subscriptions

- `subscription_billing`
- `cancellation_refunds`
- `price_changes`

### Legal & Disputes

- `liability_limits`
- `arbitration_disputes`

### Account & Access

- `account_termination`

### Content & User Rights

- `user_content_license`

### Policy Changes & Communication

- `terms_changes`
- `marketing_communications`

### Age Restrictions

- `age_restrictions`

---

## Big 8 User-Facing Categories

Although the system detects more specific internal types, the popup is designed around 8 broader user-facing categories.

This was done to reduce clutter and make the extension easier to understand for a normal user.

The Big 8 are:

1. Data Collection
2. Data Sharing
3. Billing & Subscriptions
4. Legal & Disputes
5. Account & Access
6. Content & User Rights
7. Policy Changes & Communication
8. Age Restrictions

The popup first shows these broader categories, then drills into the more detailed subcategories only when the user asks for more detail.

This gives the project a better balance between:

- internal precision
- external simplicity

---

## Rule-Based Matching

Each internal type is associated with a set of regular expression patterns. These patterns were designed to catch common policy language, such as:

- auto-renewal or recurring billing language
- refund and cancellation language
- data collection and personal information language
- sharing with third parties or service providers
- arbitration, liability, and dispute terms
- age restrictions
- marketing communications
- user content licensing language

The detector checks a sentence against the known categories and assigns the first matching type.

This method is intentionally lightweight and explainable, but it also means the quality of detection depends heavily on:

- the completeness of the regex patterns
- the structure of the source webpage
- the specific legal wording used on that site

---

## Why Sentence-Level Detection Was Chosen

During development, it became clear that flagging entire paragraphs made pages harder to read and made the extension feel noisy.

The project therefore moved toward sentence-level highlighting and sentence-level detection.

Benefits of that approach:

- cleaner on-page presentation
- more focused summaries
- more precise locate behavior
- better user trust because the flagged area is smaller and clearer

This is one of the more important usability decisions in the project.

---

## Dedupe Logic

The detector includes a deduplication step so repeated or normalized versions of the same clause are not shown multiple times in the popup.

This matters because:

- some policy pages repeat the same language
- DOM extraction can sometimes produce similar text more than once
- the popup would become noisy if duplicates were not removed

Dedupe is based on normalized text plus category type.

---

## Current Strengths

The current detection pipeline is strong in the following areas:

- easy to explain and document
- modular architecture
- predictable behavior
- category-based organization
- straightforward debugging
- low dependency on AI for the detection stage

---

## Current Limitations

The current detection model still has some limitations:

- it depends on manually designed regex coverage
- some sites use unusual wording that may not match the current patterns
- some clauses may be summarized in the popup without being highlighted if DOM structure makes wrapping difficult
- the system is not yet a full semantic classifier
- some complex legal clauses may fit more than one category

These limitations are expected at this stage and are part of the tradeoff of using an explainable rule-based system.

---

## Future Detection Improvements

Likely future improvements include:

- expanding regex coverage across more websites
- improving overlap handling between categories
- refining sentence splitting for harder page structures
- improving clause ranking or severity scoring
- reducing false positives
- adding more shared utilities so the detection layer is easier to test automatically

---

## Summary

The PolicyScope detection system is designed around a rule-based, sentence-level, modular pipeline. It prioritizes transparency, explainability, and usability over black-box automation. Internally, the detector works with detailed subcategories, while the popup presents a simplified Big 8 structure to keep the user experience clear and manageable.
