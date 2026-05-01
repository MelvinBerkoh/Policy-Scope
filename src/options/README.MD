# Options Page

This folder contains the settings interface for PolicyScope. The options page allows users to customize how the extension behaves across supported policy pages without changing the core detection logic.

## Files

- **options.html**  
  Defines the structure of the settings page and organizes the available configuration sections.

- **options.css**  
  Provides the styling for the options page, including layout, controls, toggles, buttons, and overall presentation.

- **options.js**  
  Handles the logic for loading, rendering, saving, and resetting user settings through Chrome extension storage.

## Current Settings

The options page is used to manage several user-facing preferences, including:

- highlight colors for the Big 8 policy categories
- highlight style selection
- floating badge visibility
- default highlight visibility on page load
- category-level enable or disable controls
- reset to default settings behavior

## Responsibilities

The purpose of this folder is to give users control over how PolicyScope appears and behaves while keeping those preferences separate from the detection and popup logic. This helps make the extension more flexible and more maintainable.

## Design Notes

- Settings are stored using Chrome storage so they persist across extension use.
- The options page is intentionally separated from the popup so the popup can remain focused on summarization and clause navigation.
- The files in this folder are part of the user customization layer and are not responsible for detection, highlighting, or backend summarization directly.
