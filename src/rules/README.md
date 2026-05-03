# Rules

This folder is reserved for shared rule definitions and reusable detection rule helpers for PolicyScope.

## Current Status

At the current stage of the project, most detection behavior is handled directly inside the content detection layer. This folder exists to support future refactoring where rule definitions can be centralized and reused more cleanly across the project.

## Files

- **rules.js**  
  Intended to store reusable rule-related logic, shared detection helpers, or future structured rule definitions outside the main detector.

## Purpose

The long-term purpose of this folder is to improve maintainability by separating raw detection rules from the rest of the detection pipeline. As the project grows, moving more rule configuration into this folder would make the system easier to scale, test, and update.
