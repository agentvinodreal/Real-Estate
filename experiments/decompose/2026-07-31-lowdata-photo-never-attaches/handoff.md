# Fix Brief — low-network records sync without their photo, permanently

**Investigation**: `experiments/decompose/2026-07-31-lowdata-photo-never-attaches/`
(`tree.md` / `runs.jsonl` / `learnings.md` — all 5 variables CONFIRMED)
**Severity**: High — silent, permanent, unrecoverable loss of field photos on
exactly the networks the app exists to serve. Related to
[[carry-data-loss-incident]].
**Targets**: `apps/api/src/routes/{labour,properties,shops}.ts`,
`apps/agent-native/lib/sync.ts`
**Status**: investigation only, no production code written (per decompose rules).

## Confirmed root cause

A slow link makes the client abort a POST at 15s that the server has already
committed. The record is queued locally and re-POSTed on reconnect *with* the
resolved photo — but the server's P2002 duplicate branch returns the stored row
untouched, so the photo is discarded. The client reads 200 as success and deletes
both the pending record and the queued upload rows, leaving the photo orphaned in
Cloudinary with nothing left to retry from. Full trace with file:line citations in
`learnings.md`.

## Proposed fix (preferred): make the duplicate branch reconcile

The server already owns the idempotency contract — extend it from "don't
duplicate" to "converge". In each of the three routes' P2002 branch, instead of
returning `existing` unchanged, fill in fields the stored row is missing:

```ts
if (err.code === 'P2002' && clientId) {
  const existing = await prisma.labour.findUnique({ where: { id: clientId } })
  if (existing) {
    // A timed-out first POST can commit a photo-less row; the retry carries the
    // resolved photo. Backfill anything the stored row is missing, but never
    // overwrite a value that is already set (the retry must not clobber an edit).
    const backfill: any = {}
    if (!existing.profilePhotoUrl && data.profilePhotoUrl) {
      backfill.profilePhotoUrl = data.profilePhotoUrl
    }
    const row = Object.keys(backfill).length
      ? await prisma.labour.update({ where: { id: clientId }, data: backfill, include: {...} })
      : existing
    return reply.code(200).send(serializeLabour(row))
  }
}
```

For `properties` and `shops` the equivalent field is `images` (backfill when the
stored array is empty) plus `floorPlanUrl` for properties.

**Why this is the right layer**: it needs no client state, fixes records already
stuck in this condition on the next retry, and preserves the anti-duplication
guarantee that `2026-07-11-duplicate-records-and-missing-images` established.

## Client-side hardening (do both, they are cheap)

1. **`sync.ts` — don't delete uploads on a duplicate response.** `api.post` throws
   away the status code, so the client cannot currently tell 201 from 200. Return
   the status (or have the route send `{ duplicate: true }`) and, when the
   response is a duplicate whose photo is still absent, leave the upload row in
   place and let `flushPendingUploads` PATCH it via `/uploads/patch-queued` — the
   path that already exists for exactly this job.

2. **Raise the timeout for writes.** 15s is aggressive for a multipart-free JSON
   POST over 2G. A longer ceiling for POST/PATCH (60s+) would prevent most
   occurrences of the timeout that starts this whole chain. Note this reduces the
   frequency but does **not** fix the bug — a dropped connection produces the
   same state.

## Do NOT

- Do not remove the placeholder-stripping in `new.tsx`. Sending `__queued__:...`
  as a real value would write junk into the DB.
- Do not make the client re-POST with a fresh id on duplicate. That resurrects
  the duplicate-rows bug the July 11 investigation fixed.

## Recovery for already-lost photos

The orphaned Cloudinary objects cannot be matched back to their rows from the
device (the queue rows are gone). "Test name low network" and any similarly
affected record must be re-photographed in the field. Confirm scope first:
`SELECT id, full_name, created_at FROM labour WHERE profile_photo_url IS NULL`
and cross-check against the agent's submissions.

## Separate, still-open risk (VAR-5)

Queued photos live in the OS-purgeable cache dir — zero `documentDirectory`
usages repo-wide. Copy to `FileSystem.documentDirectory` at enqueue and delete on
`markUploadComplete`. Independent of the above; flagged in July and never done.

## Verification after fix

1. Throttle to 2G, submit a labour record with a photo → expect the record to
   appear once, with its photo, after reconnect.
2. Confirm no duplicate row is created by the retry.
3. Submit normally on wifi → unchanged behaviour.
4. Edit an existing record's photo, then force a retry → the retry must not
   revert the edit (guards the "never overwrite a set value" rule).
