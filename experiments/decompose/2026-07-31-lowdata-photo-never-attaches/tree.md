# Variable Tree — low-network labour record syncs, photo never attaches

**Objective**: A labour record's photo never reaches the DB when the record was
created on a low-bandwidth connection, even though the record itself uploads
once wifi returns.

**Observed**: admin shows "Test name low network" (PENDING, placeholder avatar).
Record present, `profilePhotoUrl` empty. Photo never arrives, no retry fixes it.

**Slug**: `2026-07-31-lowdata-photo-never-attaches`
**Date**: 2026-07-31
**Prior art consulted**: `logs/decompose/2026-07-11-duplicate-records-and-missing-images`,
`experiments/decompose/2026-07-14-offline-patch-queued-race`,
`experiments/decompose/2026-07-15-photo-missing-offline-record-lost`.
No graphify/agent knowledge graph exists in this repo (checked
`experiments/decompose/.graph/graph.json`, `graphify-out/graph.json`).

---

## KNOWN (cited, not re-tested)

| Fact | Citation |
|---|---|
| Client generates the record UUID; server persists it as the PK | `apps/api/src/routes/labour.ts:38` |
| Server is idempotent by design: P2002 on duplicate id → return existing row | prior investigation `2026-07-11-duplicate-records-and-missing-images` Root Cause #2 |
| Photo files are compressed to a new URI via `manipulateAsync` default output | `apps/agent-native/lib/compress.ts:11-19` |
| Cloudinary binary PUT uses raw `fetch` (no client timeout) | `apps/agent-native/lib/cloudinaryUpload.ts:33-36` |
| Signing call `/uploads/sign` goes through the shared api client (15s timeout) | `apps/agent-native/lib/cloudinaryUpload.ts:15-18` |
| Base-URL localhost bug fixed and shipped before this report | commit `8b4b16b`, OTA `4d70b97f` |

---

## VAR-1 — server's duplicate path returns the existing row *unchanged*
- **claim**: On P2002 the POST /labour handler responds 200 with the stored row and
  never applies the incoming payload, so a re-POST can never add a photo to a row
  that was created without one.
- type: leaf | depends_on: [] | sandbox: static read
- **expected (PASS)**: duplicate branch = `findUnique` + `send`, with no
  `update`/`upsert` of payload fields.
- **FAIL**: branch updates the row from the retry payload.
- status: **PASS** (confirmed)

## VAR-2 — the online submit strips the queued photo before POSTing
- **claim**: `new.tsx` blanks `profilePhotoUrl` when it is still a `__queued__:`
  placeholder, so the *first* POST necessarily creates a photo-less row.
- type: leaf | depends_on: [] | sandbox: static read
- **expected (PASS)**: `onlinePayload.profilePhotoUrl === undefined` when the value
  starts with `__queued__:`.
- **FAIL**: placeholder is sent or the photo is uploaded before the POST.
- status: **PASS** (confirmed)

## VAR-3 — a 15s client abort can hide a server commit
- **claim**: The shared client aborts at `DEFAULT_TIMEOUT_MS`; on a slow link the
  server can receive, process and commit the write while the client records the
  attempt as a failure and queues the record for retry.
- type: leaf | depends_on: [] | sandbox: node + local http server
- **expected (PASS)**: client throws a timeout at ~15s **and** the server handler
  still runs to completion and records the write.
- **FAIL**: client waits for the response, or the server never completes.
- status: **PASS** (confirmed)

## VAR-4 — reconnect sync destroys the only pointer to the photo
- **claim**: Given VAR-1..3, `flushPendingRecords` re-POSTs, gets 200-duplicate,
  treats it as success, then deletes the pending record *and* its queued upload
  rows — leaving a photo-less DB row with nothing left in the queue to retry.
- type: composite | depends_on: [VAR-1, VAR-2, VAR-3] | sandbox: node simulation
  of `sync.ts` control flow against a mock server with the real route semantics
- **expected (PASS)**: end state = server row `profilePhotoUrl` null **and** client
  queue empty **and** photo uploaded to Cloudinary but referenced by nothing.
- **FAIL**: photo attaches, or something remains queued for a later retry.
- status: **PASS** (confirmed)

## VAR-5 — cache-dir purge is a *separate* permanent failure mode
- **claim**: Queued photo files live in the OS-purgeable cache dir, so Android can
  evict a photo before it syncs — independent of VAR-1..4.
- type: leaf | depends_on: [] | sandbox: static read
- **expected (PASS)**: `compress.ts` returns `manipulateAsync`'s default output
  (cache dir) and nothing copies it to `documentDirectory` before queueing.
- **FAIL**: file is persisted outside the cache dir at enqueue time.
- status: **PASS** (confirmed)

---

## DAG

```
VAR-1 ─┐
VAR-2 ─┼──> VAR-4 (composite: permanent photo loss)
VAR-3 ─┘
VAR-5 (independent, compounding)
```

Depth 2, 4 leaves + 1 composite — within `max_depth=3`, `max_leaves=10`.
