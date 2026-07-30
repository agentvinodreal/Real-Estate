# Learnings — the photo upload never starts on a weak link

**Verdict**: Confirmed. Three of four variables PASS; the fourth is blocked on
device access. This is a *different* defect from the one fixed earlier today —
that one lost a photo that had already reached Cloudinary. This one stops the
photo leaving the handset at all.

## The single line that causes it

`uploadFileToCloudinary` does two network calls in sequence
(`apps/agent-native/lib/cloudinaryUpload.ts:15-36`):

1. `api.get('/uploads/sign?folder=…')` — fetch a signature from our API
2. `fetch(cloudinary…)` — the binary upload, raw `fetch`, deliberately **no timeout**
   so it can tolerate a slow link

Step 2 was built for exactly this scenario. Step 1 kills it first.

When writes were raised to 60s earlier today (`packages/shared/src/api.ts:1-6`),
**reads were left at 15s**, and `api.get` uses the read ceiling
(`api.ts:67-68`). So on a congested link the signing GET aborts at 15s and
`uploadFileToCloudinary` throws before the binary upload is ever invoked. Run 1
measured it: sign request received at t=0.0s, client threw at t=15.0s, **binary
uploads attempted: 0**. The no-timeout upload path is unreachable dead code on
precisely the networks it exists for.

This is my own regression from this session — I raised the write ceiling because
a half-observed write is unrecoverable, and reasoned that "a read can be retried
for free". That reasoning was wrong here: this particular read is the gate to a
write, so its failure is not free at all.

## Why a good connection later doesn't rescue it

Each failed cycle calls `incrementUploadAttempts` (`sync.ts:36,64`), and
`attempts >= MAX_ATTEMPTS` (5) is skipped by every automatic sync
(`sync.ts:17,57`). Run 2 walked the real trigger sequence — submit-time flush,
reconnect listener, background fetch every 15 min — and the budget was gone
within roughly 45 minutes of weak signal. From then on:

- every reconnect sync: **SKIPPED**
- every background fetch: **SKIPPED**
- arriving at strong wifi: **still SKIPPED**
- Profile → Retry Failed Records: uploads immediately ✅

So the photo is not slow, it is *retired*. The app is silently finished trying
while the agent believes it is still syncing. Five attempts is a budget sized for
transient failures being spent on a persistent one.

## What the user actually sees

`flushPendingRecords` Step 2 does `if (!resolved) continue` — the record stays
queued while its photo is unresolved, which is correct. But the first online POST
still strips the queued placeholder (`labour/new.tsx:72-74`), and at the new 60s
ceiling that POST can still commit server-side. Net effect: the row appears in
admin without a photo, the queue still holds the upload, and every automatic
retry is a no-op once the budget is spent. Identical symptom to the bug fixed
this morning, entirely different cause — which is why the earlier fix did not
change what the user observes.

## Not the cause, still unresolved

- **VAR-4 (blocked)**: I cannot confirm from here whether the handset applied OTA
  `bae49508`. If it did not, none of today's fixes were exercised at all. This
  must be checked on the device before drawing conclusions from any further test.
- **Cache-dir purge**: still zero `documentDirectory` usages. Not implicated in
  this failure, but an independent permanent-loss path that remains open.
