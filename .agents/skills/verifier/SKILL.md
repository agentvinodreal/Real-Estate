---
name: verifier
description: Verification agent run after code completion. Detaches git worktree sandboxes, checks compilation, runs linters, audits security patterns, and presents resolution options to the user. Triggers on: /verify, verify, /audit, audit, codecheck, test-isolation.
---

# Code Verification & Audit Skill

## Purpose
This skill verifies that recent modifications compile correctly, meet strict code-quality guidelines (no unused imports, no commented-out code blocks), are free of common security flaws, and pass all regression checks in a clean isolated sandbox environment.

---

## Core Instructions

You are the Verifier Agent. When this skill is active, execute the following workflow systematically:

### 1. Frame Verification Scope
1.  **Analyze Active Folder:** Identify which workspace app or package has been modified (`apps/api`, `apps/web`, `apps/admin`, or `packages/shared`).
2.  **Generate Run ID:** Generate a unique run ID: `verify-<timestamp>-<hash>`.
3.  **Read Config:** Read config parameters from [.agents/skills/verifier/verify.config.yaml](file:///Users/binova/Documents/Projects/Suru/Real-Estate/.agents/skills/verifier/verify.config.yaml) to load scripts and paths.

### 2. Setup Isolation Sandbox
Create an isolated git worktree environment to prevent half-written changes from polluting the workspace:
1.  Initialize the sandbox path: `logs/verification/{run_id}/worktree`.
2.  Run the command:
    ```bash
    git worktree add --detach logs/verification/{run_id}/worktree
    ```
3.  Copy all modified, untracked, and newly written files from the current active folder into their respective places inside the sandbox.

### 3. Execution Audits (Bottom-Up Leaves)
Execute the verification targets sequentially inside the sandbox worktree folder:

#### A. Compilation & Build (Bugs/Typos)
*   Run typescript compilation: `npm run build` or `npx tsc -b`.
*   Verify that it compiles successfully without any syntax errors, module resolution failures, or type mismatches.

#### B. Code Quality & Dead Code
*   Run the workspace linter: `npx oxlint` or `npm run lint`.
*   Search files for:
    *   Unused imports or variables.
    *   Commented-out dead code blocks.
    *   Console statements left behind.

#### C. Security Audits
Scan modified code for common security vulnerabilities:
*   **Credentials Check:** Look for hardcoded credentials, access tokens, API keys, or secret keys (e.g., `sk_test_...`, `CLOUDINARY_API_SECRET=...`).
*   **Database Queries:** Verify database transactions use Prisma parameterized queries rather than string concatenation.
*   **CORS Config:** Check CORS settings to ensure they are restricted (not `origin: "*"` or similar configurations in production files).
*   **Clerk Authentication:** Ensure any admin-only endpoints have a `verifyAdmin` preHandler or equivalent Clerk role verification logic.

#### D. Unit & Integration Tests (Regressions)
*   Run local test scripts (e.g., `npm test` or vitest checks) to verify regression status.

### 4. Verification Report & Feedback Loop
Clean up the git worktree:
```bash
git worktree remove --force logs/verification/{run_id}/worktree
```

Write a structured audit report back to the user:
1.  **Header**: ✅ **PASS** | ❌ **FAIL**
2.  **Summary Table**:
    *   *Build Status* (tsc compilation success/warnings)
    *   *Code Quality Status* (linter results, unused imports count, dead code instances)
    *   *Security Status* (secrets scanner, query verification)
    *   *Tests Status* (pass/fail count)
3.  **Error Details**: If any check failed, print the exact compiler or linter trace.
4.  **Fix Recommendations**: Suggest 2-3 specific options to fix the warnings/errors (e.g. Option 1: Strip unused imports automatically; Option 2: Define missing type parameters; Option 3: Move secret to `.env`).
5.  **Git Commit & Push**:
    *   If verification **passes** (✅ **PASS**):
        *   Prompt the user to commit the changes, or check if `git.auto_commit_on_pass` is enabled in `verify.config.yaml`.
        *   If confirmed or enabled, execute:
            ```bash
            git add .
            git commit -m "verify: automated check passed (build, lint, and security OK)"
            ```
        *   Check if `git.auto_push_on_pass` is enabled or ask the user, then push the commit to the active remote branch:
            ```bash
            git push origin <active-branch-name>
            ```
6.  **Interactive Handoff**: Ask the user: *"Should I proceed with Option X to resolve these warnings?"* or confirm the commit status.

