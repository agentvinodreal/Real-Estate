# Fix Brief — the photo upload never starts on a weak link

**Investigation**: `experiments/decompose/2026-07-31-lowdata-photo-upload-never-starts/`
(`tree.md` / `runs.jsonl` / `learnings.md` — VAR-1/2/3 CONFIRMED, VAR-4 blocked)
**Severity**: High — on 2G/congested links the photo never leaves the handset, and
after ~45 min of weak signal no automatic sync will ever try again.
**Targets**: `packages/shared/src/api.ts`, `apps/agent-native/lib/sync.ts`,
`apps/agent-native/lib/cloudinaryUpload.ts`
**Status**: investigation only, no production code written (per decompose rules).

## Confirmed root cause

`uploadFileToCloudinary` fetches a Cloudinary signature via `api.get` before
uploading the binary. `api.get` uses the 15s **read** ceiling — writes were raised
to 60s earlier today but reads were not — so on a slow link the signing call
aborts and the deliberately-untimed binary upload is never reached (run 1: 0
binary attempts). Each failure burns one of 5 attempts; once spent, every
automatic sync skips the upload permanently, including after the agent reaches
strong wifi (run 2). Only Profile → Retry Failed Records revives it.

## Fix 1 — give the signing call the write ceiling (root cause)

The sign request is not a free-to-retry read; it is the gate to an upload. Either:

```ts
// cloudinaryUpload.ts — opt this specific call into the long ceiling
const sig = await api.get<CloudinarySignature>(
  `/uploads/sign?folder=${encodeURIComponent(folder)}`, token, { timeout: WRITE_TIMEOUT_MS }
)
```

(requires threading an options arg through `api.get`), or simply raise
`DEFAULT_TIMEOUT_MS` for this path. **Do not** raise the global read timeout to
60s — list GETs feeding the UI should still fail fast so the app stays responsive.

## Fix 2 — stop burning the retry budget on a persistent condition

Five attempts is sized for transient failures. On a weak link it is spent in
under an hour and never replenished. Recommended, in order of value:

1. **Don't count a timeout/offline failure as an attempt.** Distinguish "the
   server rejected this" (a real attempt) from "we never got through" (not the
   photo's fault). Only the former should increment.
2. **Reset the counter on a connectivity upgrade.** When the reconnect listener
   fires a genuine offline→online transition, call `resetStuckUploads()` before
   `runFullSync` — arriving at wifi is exactly when a stuck upload deserves a
   fresh budget. Today only a manual tap does this.
3. **Back off instead of retiring.** Exponential delay keyed on `attempts` rather
   than a hard stop, so an upload is never permanently abandoned.

## Fix 3 — surface it (currently invisible)

The agent has no way to know the app has stopped trying. `FailedRecordBanner`
exists — make sure an exhausted upload actually raises it, with the one-tap retry.
Silence is what turned this into a multi-day mystery.

## Do NOT

- Do not remove the 60s write ceiling from Fix e621159 — it addresses a separate,
  confirmed failure and is unrelated to this one.
- Do not put a timeout on the Cloudinary binary POST. It is correctly untimed; a
  large photo on 2G legitimately takes minutes.

## Verify first, before any of the above

**VAR-4 is unresolved**: it is not established that the handset ever applied OTA
`bae49508`. Check Profile (or force-close and reopen and watch for the update
prompt) and confirm the build is running today's bundle. If it is not, this
investigation still stands on its own code reading, but the earlier fix has not
actually been exercised and its status is unknown.

## Verification after fix

1. Throttle to 2G, submit a record with a photo → the signing call must survive,
   and the binary upload must start (watch for a Cloudinary request at all).
2. Leave it on a weak link for an hour, then move to wifi → the photo must upload
   without anyone tapping Retry.
3. Confirm a genuinely rejected upload (bad signature) still stops after a bounded
   number of real attempts — the budget must not become infinite.
