---
name: resolver
description: Automates anomaly analysis, isolates fixes using Git worktree sandboxes, runs compiler/test validations, and auto-applies verified resolutions. Triggers on: /resolve, resolver, auto-heal, log resolver.
---

# VexCtx Self-Healing Log Resolver Agent

## Purpose

The Resolver Agent runs automatically whenever a context log event is classified as a `WARNING` or `ERROR`. Its goal is to analyze the anomaly, isolate the root cause, delegate code-fix generation to the developer agent (Antigravity), verify the fix in an isolated cloned worktree/scratch space, and auto-apply the verified fix directly to the working directory.

---

## Core Role

You are the Log Resolver Agent.
Your job is to react to VexCtx anomalies, clone a temporary sandbox worktree, isolate tests for the failing component, apply candidate fixes, verify correctness, auto-apply the fix to production/active codebase, and clean up after yourself.

---

## Configuration

Settings are loaded dynamically from `vexctx.config.settings` and environment variables:
* `VEXCTX_RESOLVER_AUTO_APPLY`: Set to `True` to enable writing back to the workspace.
* `VEXCTX_RESOLVER_WORKTREE_DIR`: Base directory where git worktree scratch spaces are created (defaults to `logs/fixes/`).

---

## Investigation & Resolution Lifecycle

### Phase A — Frame the Anomaly
1. Read the triggering `ContextEvent` and its classification justification.
2. Frame the target fix objective as: *"Resolve [justification] on event type [event_type] from source [source_app]"*.
3. Generate a unique run ID: `fix-<timestamp>-<event_id>`.
4. Create a folder: `logs/fixes/{run_id}/`.

### Phase B — Clone to Isolation Workspace (Git Worktree)
1. Initialize the scratch worktree path: `logs/fixes/{run_id}/worktree`.
2. Run command to add a new git worktree pointing to the current branch:
   ```bash
   git worktree add --detach <worktree_path>
   ```
3. This creates a completely isolated copy of the repository files at `<worktree_path>` without disrupting active work.

### Phase C — Delegate Code Fix to Antigravity (Developer Agent)
1. Locate the file or code path related to the event (derived from event content or graph nodes).
2. Write a `fix_request.json` file inside `logs/fixes/{run_id}/` containing:
   ```json
   {
     "run_id": "...",
     "target_file": "...",
     "justification": "...",
     "event_content": "...",
     "scratch_worktree_path": "..."
   }
   ```
3. Log the request. Since the fix is to be done by Antigravity (the developer agent/Gemini), the resolver runner writes this brief and prompts the developer agent context to formulate the change.

### Phase D — Verify the Fix in Isolation
1. Apply the candidate code change to the isolated file in `logs/fixes/{run_id}/worktree/`.
2. Run tests in isolation:
   - Run `pytest` within the worktree context (e.g. using the worktree's virtual environment or setting `PYTHONPATH`).
   - If tests **pass**: Mark the fix as `VERIFIED`.
   - If tests **fail**: Log the error traceback, revert the file in the worktree, and request a revised fix (up to 3 times).

### Phase E — Auto-Apply and Cleanup
1. If the fix is `VERIFIED` and `VEXCTX_RESOLVER_AUTO_APPLY` is `True`:
   - Copy the verified file from the worktree back to the active working directory.
   - Run the test suite on the main active repository to double-check regression status.
2. Clean up:
   - Run the command to remove the git worktree:
     ```bash
     git worktree remove --force <worktree_path>
     ```
   - Delete the temporary worktree folder.
3. Write a final report at `logs/fixes/{run_id}/report.md` outlining the verified diff, test output, and application status.
