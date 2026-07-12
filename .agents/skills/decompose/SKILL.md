---
name: decompose
description: Breaks down complex objectives into testable variables, orders them by dependencies, runs isolated tests bottom-up, and yields a findings report. Triggers on: /decompose, decompose, variable tree, verify objective.
---

# Objective Decomposition Skill

## Purpose
This skill recursively decomposes complex objectives into testable variables, executes bottom-up leaf checks in isolation, and compiles verified facts into a specialist handoff brief.

---

## Core Instructions

You are the Decompose Agent. When this skill is active, follow this lifecycle:

### Phase A — Frame the Objective
1. **Define Claim:** Restate the objective in the form: *"[Subject] [does X] when [condition]"*.
2. **Procedure:** Write a 3-5 sentence validation plan (cause → effect, no final code).
3. **Investigation Path:** Initialize a folder under `logs/decompose/<date>-<slug>/` containing:
   *   `tree.md` — the variable dependency tree.
   *   `runs.jsonl` — append-only execution log.
   *   `learnings.md` — findings log.

### Phase B — Knowledge-Base Check
Consult existing codebase metadata:
1. Check past investigation folders in `logs/decompose/` for identical or related failures.
2. Review file structures in `apps/api`, `apps/web`, `apps/admin`, or `packages/shared`.
3. Classify assumptions as:
   *   **KNOWN**: Cite file:line, documentation, or past run logs.
   *   **UNKNOWN**: Becomes a variable in the tree.

### Phase C — Build the Variable Tree
For each unknown, add to `tree.md`:
```
VAR-N: <one-line claim to verify>
  type: leaf | composite | blocked
  depends_on: [VAR-X, VAR-Y]
  sandbox: <build | test | check-file | custom>
  expected: <what counts as PASS>
  status: pending | running | pass | fail | blocked
```
*   **leaf**: Testable in <10 min using compile/lint/run tools.
*   **composite**: Compound variable containing nested sub-claims.
*   **blocked**: Needs human input. Stop and ask.

### Phase D — Order Leaves & Execute
1. Build a dependency DAG. Execute leaves with no unresolved dependencies first.
2. **Write pass/fail criteria into `tree.md` BEFORE running** to prevent confirmation bias.
3. **Execution Safety**:
   *   Read-only checks (compiling, linting, files checks) can auto-execute.
   *   Destructive actions (modifying code, running migrations, DB pushes) require user approval.
4. Record every test outcome in `runs.jsonl` with timestamp, variable code, command, exit code, result, and learnings.

### Phase E — Report & Handoff
Write the final results to `learnings.md` and a specialist handoff brief `handoff.md` containing:
*   Verified facts (citing run IDs).
*   Proposed changes (file paths, method names, logic diffs).
*   Verification tests the developer must include.
*   Open questions for the user.
