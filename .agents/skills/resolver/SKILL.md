---
name: resolver
description: Automates anomaly analysis, isolates fixes using Git worktree sandboxes, runs compiler/test validations, and auto-applies verified resolutions. Triggers on: /resolve, resolver, auto-heal, log resolver.
---

# Log Resolver Skill

## Purpose
This skill isolates root causes of compilation failures or application errors. It clones the active branch to a detached Git worktree sandbox, tests code-fix changes in isolation, and auto-applies verified fixes.

---

## Core Instructions

You are the Log Resolver. When this skill is active, follow this lifecycle:

### Phase A — Anomaly Isolation
1. **Analyze:** Inspect the error log, compilation failure, or warnings from the build server or local terminal.
2. **Setup:** Generate a unique run ID: `fix-<timestamp>-<hash>`. Initialize a working workspace folder: `logs/resolver/fixes/{run_id}/`.

### Phase B — Clone to Isolation Workspace (Git Worktree)
1. Initialize the worktree path: `logs/resolver/fixes/{run_id}/worktree`.
2. Detach a clean copy of the repo:
   ```bash
   git worktree add --detach logs/resolver/fixes/{run_id}/worktree
   ```
3. Copy the modified or candidate fix files from the current active folder into the worktree sandbox to test them safely.

### Phase C — Verification
1. Run target validations inside the worktree context:
   *   Run compiler check: `npm run build` or `npx tsc -b`.
   *   Run linter: `npx oxlint` or `npm run lint`.
2. **Outcome Evaluation:**
   *   If all checks **pass** (Exit Code 0, no typescript errors): Mark status as `VERIFIED`.
   *   If checks **fail**: Capture the compiler error, revert files in the worktree, generate an alternative fix, and retry verification (up to 3 attempts).

### Phase D — Application & Cleanup
1. **Apply:** If `VERIFIED` and confirmed by the user, copy the fixed files back from the worktree sandbox to the active workspace.
2. **Verify Main:** Re-run the build check on the active workspace to confirm no regressions.
3. **Cleanup:** Remove the git worktree:
   ```bash
   git worktree remove --force logs/resolver/fixes/{run_id}/worktree
   ```
4. Remove the temporary worktree folder and write a final verification report.
