# Objective

Admin panel cannot upload/manage `stageImages` for construction projects, so the
public site's "On-site progress" section always falls back to placeholders,
regardless of the actual data in that project — because the admin UI has no
control, state, or payload wiring for that field.

Slug: `2026-07-25-fix-stage-images-admin-gap`
Archive root: `/Users/binova/Documents/Projects/Suru/Real-Estate/experiments/decompose`

# Knowledge-base check (Phase B)

- No `experiments/decompose/.graph/graph.json` in this repo.
- No `graphify-out/graph.json` in this repo.
- No prior decompose runs in this repo.
- All assumptions below were UNKNOWN at start and verified this run by reading
  the live files directly (not trusting the carried-over session summary).

# Variable tree — all resolved

VAR-1: Prisma schema has a `stageImages` column on `ConstructionProject`.
  status: PASS — schema.prisma:95 `stageImages String[] @default([])`, identical
          shape to beforeImages/afterImages.

VAR-2: The construction API routes already accept and persist `stageImages`
       end-to-end (create + update).
  status: PASS — construction.ts: POST handler destructures `stageImages` and
          writes `stageImages ?? []` into `prisma.constructionProject.create`
          (line ~100); PATCH handler spreads the full body into
          `prisma.constructionProject.update({ data: body })` (line ~158), so
          `stageImages` passes through automatically once sent. JSON schema on
          both routes already lists `stageImages`. **No API changes needed.**

VAR-3: Shared `ConstructionProject` TS type already declares `stageImages`.
  status: PASS — types.ts:49 `stageImages: string[]`, same required-array shape
          as beforeImages/afterImages. **No shared-package changes needed.**

VAR-4: Admin's API client doesn't block a `stageImages` payload addition.
  status: PASS — `adminApi.createProject`/`updateProject` both take
          `data: Record<string, unknown>` (adminApi.ts:96,101) — generic, no
          narrow type. **No adminApi changes needed.**

VAR-5 (composite): Projects.tsx has one mirrorable before/after pattern that a
       stageImages control can be added to by direct analogy.
  status: PASS (bubbles up from 5a–5d, all PASS)

VAR-5a: `handleFileUpload`'s target union/branch is the one place needing a
        `'stage'` arm.
  status: PASS — `uploading` state union `'before'|'after'|'hero'|null`
          (line 30); `handleFileUpload(e, target: 'before'|'after'|'hero')`
          (line 73) with if/else at 103–109 setting the matching state array.
          Both need a `'stage'` case.

VAR-5b: Before/after images support per-image removal today (sets the bar for
        stageImages).
  status: PASS (disproved) — before/after thumbnails (lines 253–259, 270–276)
          are read-only `<img>` tags with **no remove button and no onClick**;
          only the single hero image has a clear ("X") button. Conclusion:
          stageImages should mirror the existing **add-only** pattern — adding
          per-image removal would be scope creep beyond what before/after
          already have.

VAR-5c: Exhaustive list of every touch point that needs a stageImages mirror.
  status: PASS — enumerated 9 mandatory + 2 discretionary points (full list in
          handoff.md).

VAR-5d: The card-list/view-modal "Showcase Photos" blocks are purely
        presentational and independent of the model fix.
  status: PASS — both blocks (lines 316–328, 364–376) render directly from
          `p.beforeImages`/`p.afterImages` with no write path; not a real
          field. This merged, mislabeled display is what caused the original
          confusion (2 photos looked "there" while the public page showed
          empty placeholders). Fixing the upload gap doesn't require touching
          these; including stageImages in them is optional polish only.

VAR-6 (aside): description="null" string is user-typed test data, not a
       serialization bug.
  status: PASS (no bug found) — `save()` does
          `description: form.description || null` (empty string → real null,
          correct); `startEdit()` does `p.description ?? ''` (round-trips
          whatever string is stored). The stored literal `"null"` can only
          have arrived by someone typing the 4 characters "null" into the
          textarea on this test record. No code change needed.

# Outcome

All variables PASS. No blockers, no destructive actions were needed to reach
this point (every check was a Read). Ready for hand-off — see `learnings.md`
and `handoff.md`.
