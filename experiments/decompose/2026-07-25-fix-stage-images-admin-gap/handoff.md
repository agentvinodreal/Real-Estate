# Hand-off: add stageImages upload to admin Projects.tsx

**STATUS: IMPLEMENTED same session (2026-07-25).** All 7 mandatory edits and
discretionary item #9 (extending the merged "Showcase Photos" previews with
explicit missing-photo warnings) were applied directly to
`apps/admin/src/features/construction/pages/Projects.tsx`. `tsc -b && vite
build` for apps/admin passes clean. Discretionary item #8 (folding
stageImages into the hero-picker pool) was deliberately skipped as unrelated
scope creep. **Not yet visually verified in a browser** — no browser
automation tool was available this session; the user has the admin dev
server open locally and was asked to confirm visually.

Target file: `apps/admin/src/features/construction/pages/Projects.tsx`
(everything else — Prisma schema, both API routes, shared TS type, adminApi
client — already fully supports `stageImages`; verified, no changes needed
there. See `learnings.md` / `tree.md` for the verification trail.)

Mirror the existing `beforeImages`/`afterImages` pattern exactly (add-only,
no per-image remove — matching what before/after already do today).

## Mandatory edits (9)

1. **State** (~line 27-28): add
   ```ts
   const [stageImages, setStageImages] = useState<string[]>([])
   ```

2. **Uploading union** (line 30): extend to
   ```ts
   const [uploading, setUploading] = useState<'before' | 'after' | 'hero' | 'stage' | null>(null)
   ```

3. **startEdit()** (~line 57-59): add
   ```ts
   setStageImages(p.stageImages ?? [])
   ```

4. **closeForm()** (~line 68-70): add
   ```ts
   setStageImages([])
   ```

5. **handleFileUpload()**:
   - signature (line 73): extend target union to
     `target: 'before' | 'after' | 'hero' | 'stage'`
   - branch (~line 103-109): add a case
     ```ts
     } else if (target === 'stage') {
       setStageImages((prev) => [...prev, data.secure_url])
     }
     ```
     (restructure the existing if/else-if/else chain so `'stage'` is its own
     branch and `hero` remains the final `else`, or make hero an explicit
     `else if (target === 'hero')` — either is fine, just don't let `'stage'`
     silently fall into the hero branch)

6. **Upload UI block** (~line 244-278): currently a 2-column grid with "Before
   Construction Photos" and "Completed Construction Photos". Add a third
   panel, "On-site Progress Photos", following the identical markup pattern
   (label, upload button keyed to `handleFileUpload(e, 'stage')`, thumbnail
   strip mapping `stageImages`). Decide layout: either widen to a 3-column
   grid, or add it as a full-width row below — either is acceptable, just
   keep the same visual language (border, font-mono uppercase label, thumb
   sizing `h-10 w-12 border border-ink/10 object-cover`).

7. **save() payload** (~line 124-136): add `stageImages,` alongside
   `beforeImages, afterImages,`.

## Discretionary polish (do only if it doesn't blow up scope)

8. Hero "choose from uploaded photos" pool (line 229) currently reads
   `[...beforeImages, ...afterImages]`. Could extend to include
   `...stageImages` so stage photos are also hero-pickable. Not required.

9. The merged "Showcase Photos" preview in the card list (~line 316-328) and
   view modal (~line 364-376) is presentational only, built from
   `[...beforeImages, ...afterImages]`. This label is what caused the actual
   confusion this investigation started from (admin showed "photos exist"
   while the public site showed empty placeholders). Two reasonable options:
   - Leave as-is (out of strict scope), or
   - Also fold `stageImages` into these previews and/or relabel more
     precisely (e.g. split into "Before/After" + "Progress" sub-groups)
     so admin's own view can never again look "full" while the public site
     is empty.
   Recommend doing this since it directly prevents a repeat of the bug that
   triggered this whole investigation, but it's not required to close the
   literal gap.

## Explicitly NOT needed (verified, don't waste time re-checking)

- Prisma schema — already has `stageImages String[] @default([])`.
- API routes (POST + PATCH `/construction-projects`) — already accept and
  persist `stageImages` fully; PATCH spreads the whole body through, POST
  explicitly writes `stageImages ?? []`.
- Shared `ConstructionProject` TS type — already declares
  `stageImages: string[]`.
- `adminApi.createProject`/`updateProject` — already take a generic
  `Record<string, unknown>`, no type narrowing to fix.
- The `description: "null"` string on the test project — confirmed
  user-typed test data, not a save()/startEdit() serialization bug. No
  change needed.

## To fix the existing "test project" record itself (separate from the code fix)

Once the admin UI has the new "On-site Progress Photos" uploader, edit the
test project and upload photos into both the "Completed Construction Photos"
(after) slot and the new stage slot — or just re-upload one of the two
existing "before" photos into "after" if a quick visual fix is wanted before
the stage uploader ships. This is data clean-up, not a code change.
