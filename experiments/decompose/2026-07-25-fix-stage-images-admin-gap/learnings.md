# Learnings — stage-images admin gap

## Root cause, confirmed

The backend (Prisma model, both construction API routes, shared TS type) has
**always** fully supported `stageImages` as a first-class array field, sibling
to `beforeImages`/`afterImages`. The only missing piece is the admin frontend:
`apps/admin/src/features/construction/pages/Projects.tsx` was built with
upload wiring for exactly 3 targets — `'before' | 'after' | 'hero'` — and
`stageImages` was simply never added as a 4th. This is a pure frontend
omission, not a half-migrated feature and not a data problem on any one
project.

## Why the admin looked like it had photos when the public site didn't

`Projects.tsx` renders a merged "Showcase Photos" block (in both the card list
and the view modal) that is literally `[...beforeImages, ...afterImages]`
mashed together under one label. It isn't a real field — it's a convenience
preview. A project with 2 photos both filed under `beforeImages` (and none in
`afterImages`/`stageImages`) shows "2 Showcase Photos" in admin while the
public site's Before/After slider (needs both arrays non-empty) and On-site
Progress gallery (needs `stageImages` non-empty) both render placeholders.
This merged label is a legitimate UX trap worth fixing alongside the main gap,
even though it wasn't the literal ask.

## Why before/after should NOT gain remove buttons as part of this fix

Checked: neither `beforeImages` nor `afterImages` thumbnails have a per-image
remove affordance today (only the single hero image does, via a small clear
button). Giving `stageImages` a remove button while its siblings don't have
one would be inconsistent and is out of scope — mirror what exists, don't
upgrade it silently as a side effect.

## The "null" string description

Confirmed not a bug. `form.description || null` in `save()` already converts
an empty string to a real `null` correctly. The `"null"` stored on the test
project is literal user-typed text from testing, round-tripped as-is by
`startEdit()`'s `p.description ?? ''`. No code changes indicated.

## Confidence

Every variable was resolved by reading the current, live file content this
session — none of it was taken on faith from the prior conversation summary.
No experiment required a destructive action or sandboxed execution; this was
a pure code-reading investigation. Confidence in the fix brief is high.
