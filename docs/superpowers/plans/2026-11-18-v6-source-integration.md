# v6 Source Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the copied v6 game a clear standalone source tree at `D:\01_Works\onepiece_life`.

**Architecture:** Put the active game modules in `src/app`, `src/core`, `src/data`, and `src/ui`. Keep the reused older rules and tables in `src/shared/core` and `src/shared/data`; preserve their import relationships.

**Tech Stack:** TypeScript, Preact, Vite, Vitest, Git.

**Spec:** `docs/superpowers/specs/2026-11-18-v6-source-integration-design.md`

## Global Constraints

- Do not edit or remove files in the original Korean named workspace.
- Keep the committed `bf53ba5` content plus the three selected uncommitted source and test changes.
- Remove historical top-level versions only in the new copy.
- Preserve build and test behavior and Git history.

## Review Focus

- Relative imports to reused combat and data modules resolve after moving both trees.
- `import.meta.glob` still finds portraits from its new location.
- Tests and tools import the flattened source path.
- The Git history remains available and the new destination is independent.
- The production build still uses the intended home weights.

---

### Task 1: Snapshot and isolate

**Files:** New copy at `D:\01_Works\onepiece_life`.

- [x] Clone the source repository at `bf53ba5` with independent Git objects and a new local branch.
- [x] Copy and hash-check the selected three uncommitted files.

### Task 2: Consolidate source modules

**Files:** `src/{app,core,data,ui,shared}`, `tests/game`, `tools/*.ts`.

- [x] Move the active and shared modules according to the spec after validating absolute paths.
- [x] Rewrite relative module imports from their resolved old targets to resolved new targets.
- [x] Fix the portrait glob path and check that no executable import targets are missing.
- [x] Run `npm run build` and `npm test`.

### Task 3: Clean the new working tree

**Files:** Top-level old version folders, root reference files, README files, `.gitignore`.

- [x] Remove selected historical copies only from the new working tree.
- [x] Update the architecture and development entry documentation.
- [x] Review `git diff --check`, directory tree, and file inventory.
- [x] Commit the integrated tree on `codex/v6-flat` and verify status.
