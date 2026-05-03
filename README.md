# PolicyScope

PolicyScope is a Chrome extension designed to help users better understand long and often confusing Terms of Service, Conditions of Use, and Privacy Policy pages before agreeing to them. Instead of forcing users to manually scan dense legal text, the extension detects important clauses, highlights them directly on the page, groups them into broader user-friendly categories, and generates plain-English summaries through an AI-assisted backend.

The goal of the project is to reduce the friction between legal language and user understanding. Many websites include important information about data collection, data sharing, billing, dispute resolution, account termination, user-generated content rights, and policy changes, but those details are usually buried in long documents. PolicyScope helps surface that information in a way that is faster to scan, easier to understand, and easier to navigate.

---

## Project Objective

The main objective of PolicyScope is to make online agreements more transparent and accessible. The extension does this by combining rule-based clause detection, sentence-level highlighting, structured categorization, popup-based navigation, and AI-generated plain-English summaries.

At a high level, the user experience is:

1. Open a policy or terms page
2. Let PolicyScope scan the visible text
3. See important clauses highlighted on the page
4. Open the extension popup to view the detected Big 8 categories
5. Drill down into subcategories
6. Read the original clause and a simplified AI summary
7. Jump back to the clause directly on the page if needed

---

## Core Features

### 1. Sentence-Level Highlighting

PolicyScope highlights the relevant sentence instead of the full paragraph. This keeps the page cleaner and makes the flagged clause easier to identify without overwhelming the user.

### 2. Big 8 Category Model

Detected clauses are grouped into eight broader user-facing categories so the extension remains understandable and not overly technical.

The Big 8 categories are:

- **Data Collection**
- **Data Sharing**
- **Billing & Subscriptions**
- **Legal & Disputes**
- **Account & Access**
- **Content & User Rights**
- **Policy Changes & Communication**
- **Age Restrictions**

### 3. Subcategory Drilldown

Each Big 8 category can be expanded into more detailed internal subcategories. This allows the system to stay precise internally while keeping the top-level UI simple.

### 4. AI-Generated Plain-English Summaries

Each flagged clause can be summarized through a backend service using the OpenAI API. The summaries are intentionally short, readable, and designed to explain the risk or meaning of a clause without legal jargon.

### 5. Locate-on-Page Workflow

Users can click a clause in the popup and jump back to where that clause appears on the page.

### 6. Settings / Customization

The extension includes an options page where users can customize:

- highlight colors for the Big 8 categories
- highlight style
- floating badge visibility
- whether highlights are enabled by default
- which Big 8 categories are active

### 7. Floating Badge

A floating PolicyScope badge can appear on supported pages to indicate how many clauses were detected and give the user a quick entry point into the extension.

---

## Internal Category Structure

Although the user sees only the Big 8 at the top level, the detector uses more detailed internal subcategories. These subcategories are mapped into the broader Big 8 groups.

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

This structure allows PolicyScope to stay detailed and accurate behind the scenes while presenting a simpler experience to the user.

---

## Technical Architecture

PolicyScope is split into several layers so responsibilities stay modular and maintainable.

### 1. Content Layer

The content scripts are responsible for working directly on the webpage.

- **`parser.js`** extracts visible text blocks and splits them into sentences
- **`detector.js`** applies rule-based matching to identify clause types and map them into Big 8 categories
- **`highlighter.js`** applies visual highlights and controls highlight state, style, badge behavior, and settings-based updates
- **`content.js`** coordinates parsing, detection, highlighting, settings application, and runtime messaging

### 2. Popup Layer

The popup provides the main user-facing interaction flow.

- top-level Big 8 category view
- subcategory drilldown
- clause detail cards
- AI summary display
- clause locating
- quick access to settings and highlight toggling

### 3. Options Layer

The options page manages user preferences and stores them through Chrome extension storage.

### 4. Background Layer

The background service worker handles:

- popup opening from the on-page badge
- communication with the local backend
- summary request forwarding
- tab-wide settings refresh triggers

### 5. Backend Layer

The backend provides a secure bridge between the extension and the OpenAI API.

The backend:

- keeps the API key out of the extension frontend
- validates incoming text
- trims payload size
- handles API errors safely
- returns plain-English summaries to the extension

---

## Project Structure

```text
PolicyScope/
├── assets/
│   ├── icons/
│   ├── policyscope-eye-source.png
│   ├── policyscope-logo.png
│   └── README.md
├── backend/
│   ├── .env
│   └── server.js
├── docs/
│   ├── detection-notes.md
│   └── design.md
├── src/
│   ├── content/
│   │   ├── content.js
│   │   ├── detector.js
│   │   ├── highlighter.js
│   │   ├── parser.js
│   │   └── README.md
│   ├── options/
│   │   ├── options.css
│   │   ├── options.html
│   │   ├── options.js
│   │   └── README.md
│   ├── popup/
│   │   ├── popup.css
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── README.md
│   ├── rules/
│   │   └── rules.js
│   └── utils/
│       └── normalize.js
├── test/
├── .gitignore
├── background.js
├── manifest.json
├── package-lock.json
├── package.json
└── README.md
```
