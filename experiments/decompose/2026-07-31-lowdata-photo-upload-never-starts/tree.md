# Variable Tree — photo upload never starts on a low-bandwidth link

**Objective**: The photo itself is never uploaded when a record is created on a
low-bandwidth connection, after the 2026-07-31 attach fix shipped.

**Distinct from the previous bug**: `2026-07-31-lowdata-photo-never-attaches`
covered a photo that *was* uploaded to Cloudinary but never attached to the row.
This one is upstream of that — the binary never reaches Cloudinary at all.

**Slug**: `2026-07-31-lowdata-photo-upload-never-starts`
**Date**: 2026-07-31
**Prior art**: `experiments/decompose/2026-07-31-lowdata-photo-never-attaches`
(fix shipped as `e621159` + parity `250cb8f`, OTA `bae49508` on channel preview),
`2026-07-14-offline-patch-queued-race`, `2026-07-15-photo-missing-offline-record-lost`.
No knowledge graph in this repo (re-checked).

---

## KNOWN (cited, not re-tested)

| Fact | Citation |
|---|---|
| The upload begins with a signing GET, then the binary POST | `apps/agent-native/lib/cloudinaryUpload.ts:15-36` |
| The Cloudinary binary POST uses raw `fetch` with no timeout | `apps/agent-native/lib/cloudinaryUpload.ts:33-36` |
| Writes were raised to 60s; **reads were left at 15s** | `packages/shared/src/api.ts:1-6` (this session) |
| `api.get` uses `DEFAULT_TIMEOUT_MS`, not the write ceiling | `packages/shared/src/api.ts:67-68` |
| Failed uploads increment `attempts`; `>= MAX_ATTEMPTS` is skipped forever by automatic syncs | `apps/agent-native/lib/sync.ts:17,36,57,64` |
| Only Profile → Retry Failed Records resets the counter | `apps/agent-native/lib/uploadQueue.ts:80-82` |
| Queued photos live in the OS-purgeable cache dir (0 `documentDirectory` usages) | `apps/agent-native/lib/compress.ts:11-19` |

---

## VAR-1 — the signing GET dies at 15s, so the binary upload is never attempted
- **claim**: `uploadFileToCloudinary` calls `api.get('/uploads/sign')` first. That
  path still uses the 15s read timeout, so on a slow link it aborts before the
  binary POST is ever reached — the photo never leaves the phone, and the
  no-timeout Cloudinary POST that was supposed to tolerate slow links is dead code.
- type: leaf | depends_on: [] | sandbox: node + deliberately slow local server
- **expected (PASS)**: the sign request throws at ~15s **and** the binary upload
  is never invoked (call count 0).
- **FAIL**: the binary upload is reached, or the sign call tolerates the delay.
- status: **PASS** (confirmed)

## VAR-2 — retries are exhausted faster than a weak link can recover
- **claim**: Each failed cycle increments `attempts`; after 5 the upload is
  skipped by every automatic sync (reconnect listener, background fetch,
  submit-time flush), leaving the photo permanently stuck with no visible error.
- type: leaf | depends_on: [VAR-1] | sandbox: node simulation of the retry loop
- **expected (PASS)**: upload is permanently skipped from cycle 6 onward, and
  `resetStuckUploads()` is the only thing that revives it.
- **FAIL**: retries continue indefinitely, or automatic sync recovers it.
- status: **PASS** (confirmed)

## VAR-3 — with the upload blocked, the record still reaches the server photo-less
- **claim**: The first online POST strips the queued photo. Even at the new 60s
  ceiling that POST can commit server-side. The record then shows in admin with
  no photo while the queue still holds the upload — matching what the user sees.
- type: composite | depends_on: [VAR-1, VAR-2] | sandbox: static trace
- **expected (PASS)**: `flushPendingRecords` Step 2 `continue`s while the photo is
  unresolved, so the row is whatever the first POST committed.
- **FAIL**: the record cannot reach the server while its photo is unresolved.
- status: **PASS** (confirmed)

## VAR-4 — did the device actually take OTA update `bae49508`?
- **claim**: The report may predate the update being applied, which would mean the
  shipped fix was never exercised.
- type: blocked | depends_on: [] | sandbox: none available
- **expected**: cannot be determined from here — EAS exposes no per-device
  adoption telemetry via CLI. Must be confirmed on the handset.
- status: blocked

---

## DAG

```
VAR-1 ──> VAR-2 ──┐
                  ├──> VAR-3 (observed symptom)
VAR-4 (blocked, confounder)
```

Depth 2, 3 testable leaves + 1 blocked — within limits.
