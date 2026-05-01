<!-- Extension Icons and makes it look complete.  -->

# Assets

This folder contains the visual assets used by PolicyScope for branding and extension display.

## Contents

- **icons/**  
  Contains the extension icon files used by Chrome, including the different required icon sizes.

- **policyscope-logo.png**  
  Main branded logo asset for PolicyScope.

- **policyscope-eye-source.png**  
  Source eye image used for creating the extension icon set and related branding assets.

## Purpose

These assets support the visual identity of the extension across:

- the Chrome extension toolbar icon
- extension metadata in `manifest.json`
- popup and branding-related UI work

## Notes

- The files in this folder are static assets and are not part of the application logic.
- Extension icons should remain in the `icons/` folder so they can be referenced cleanly from `manifest.json`.
- If branding is updated later, this folder should remain the single source of truth for logo and icon assets.
