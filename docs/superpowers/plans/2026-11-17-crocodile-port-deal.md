# Crocodile Port Deal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Crocodile's arbitrary one-year recruitment with a port blockade encounter that respects the player's combat grade.

**Architecture:** Preserve `tmp_crocodile` solely to resolve old pending saves and keep later companions' indices stable. Register separate postwar turnings for below B, B, and A or higher; the game's displayed `rating5` grade selects exactly one. A shared flag makes the encounter happen once.

**Tech Stack:** TypeScript, Vitest.

**Spec:** Approved 2026-11-17 chat proposal, “봉쇄된 항구의 거래”.

## Global Constraints

- The event appears only in the first New World sea after the war, for a known seafarer with a ship.
- Crocodile keeps his own ship and never joins the player's crew for a year.
- B and A players see the three choices: joint operation, independent departure, and informing the Marines.
- Below B, Crocodile dismisses the player and the deal closes.
- Preserve unrelated uncommitted workspace changes.

## Review Focus

- Prewar players must not see the postwar encounter.
- Players without ships must not see a scene about their ship.
- Rejecting or reporting him must not create an ally or crew member.
- Accepting must not create a timed crew member.
- Existing `tmp_crocodile` pending saves must still resolve.
- B begins at rating 500 and A begins at rating 770, matching the displayed grade.
- Later temporary companions must retain their original index-derived choices.

### Task 1: Dedicated Crocodile event

**Files:** `src/v5/data/recruits.ts`, `src/v5/data/turnings/recruits.ts`, `src/v5/core/types.ts`, `src/v5/core/cond.ts`, `tests/v5/crocodile-event.test.ts`.

**Interfaces:** `TURNING_BY_ID.tmp_crocodile` remains available for old pending saves; `crocodile_port_dismissed`, `crocodile_port_b`, and `crocodile_port_a` are the new events. `checkAll`, `openTurning`, and `answerDoor` are the existing consumers.

- [x] Write tests for eligibility and all three choice outcomes; run them and confirm the current event fails.
- [x] Keep Crocodile's generic row as a dormant legacy event and add the dedicated grade-specific turnings with the approved scene and choices.
- [x] Run the focused tests and project checks; inspect the final diff for unrelated edits.
