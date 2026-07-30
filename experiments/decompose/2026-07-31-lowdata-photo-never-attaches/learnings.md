# Learnings — low-network labour record uploads, photo never attaches

**Verdict**: Confirmed, deterministic, permanent data loss. Not a race, not a
retry-timing issue — the failure is structural and no amount of retrying fixes it.
All five variables PASS; see `runs.jsonl` for evidence.

## The chain

The two halves of the system each behave "correctly" in isolation and combine
into silent photo loss.

1. **The first POST deliberately omits the photo.**
   `labour/new.tsx:70-75` strips `profilePhotoUrl` when it is still a
   `__queued__:` placeholder. The intent is sound — the photo isn't uploaded yet,
   so `flushPendingUploads` will PATCH it on afterwards.

2. **On a weak link the client gives up before the server does.**
   `packages/shared/src/api.ts:1,16-17,50-52` aborts at 15s. Proven in run 4: the
   server received and committed the write at t=0.0s while the client threw
   "Request timed out" at t=15.0s. The client therefore believes the submission
   failed and queues the record — but **a photo-less row already exists on the
   server** under the client-generated id.

3. **The retry is idempotent in the wrong direction.**
   `labour.ts:46-57` handles the duplicate id (P2002) by returning the *existing*
   row with 200 and **never applying the incoming payload** (run 1: zero
   `update`/`upsert` calls in that branch). That idempotency was added
   deliberately in `2026-07-11-duplicate-records-and-missing-images` (Root Cause
   #2) to stop duplicate rows — and it works. But it also means the reconnect
   POST, which *does* carry the resolved photo, is silently discarded.

4. **The client then deletes its own evidence.**
   `sync.ts:120-137` treats the 200 as success: it deletes the queued upload rows
   and the pending record. Run 5's end state — server row `profilePhotoUrl` NULL,
   client queue empty, one orphaned Cloudinary object. Nothing remains to retry
   from, so "Retry Failed Records" cannot help. The photo exists in Cloudinary,
   paid for and unreferenced.

The reason the photo path never recovers is subtle: while the record sits in
`pending_records`, `flushPendingUploads` deliberately **skips** it
(`sync.ts:20`, `isRecordPending`) and defers to `flushPendingRecords`, which
relies on the POST body to carry the photo. That deferral is correct for a record
that genuinely doesn't exist server-side — the bug is that after a timeout the
record *does* exist, and nothing in the client can tell the difference.

## Why prior investigations missed it

`2026-07-14-offline-patch-queued-race` fixed the `temp-` prefix bug and made the
pending/not-pending distinction real. `2026-07-15-photo-missing-offline-record-lost`
fixed the dropped client id. Both were necessary and neither is wrong. Both
assumed "record queued locally" ⇒ "record absent server-side". A 15s timeout on a
slow link breaks that assumption, and only on a slow link — which is exactly why
this survived every clean-network test.

The base-URL localhost bug (commit `8b4b16b`) was a genuinely separate defect and
its fix is unaffected by this finding.

## Independent compounding risk (VAR-5)

Zero `documentDirectory` usages exist repo-wide (run 3). Every queued photo lives
in the OS-purgeable cache dir via `manipulateAsync`'s default output
(`compress.ts:11-19`). Android can evict a queued photo before it ever uploads.
This is a *second*, unrelated permanent-loss path, flagged in July and still open.

## Scope

`labour`, `properties` and `shops` all share this shape: same strip-placeholder
submit, same P2002-returns-existing handler, same cleanup. The fix must cover all
three, not just labour.
