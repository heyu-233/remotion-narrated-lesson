# Release quality checks

Use release checks only when the user requests or approves final export. Draft and preview work use the phase rules in `phase-validation.md`.

## Automated checks

From the engine root:

```powershell
npm run doctor
npm run episode:validate -- <id> --phase release
npm run lint
npm run bundle
```

After rendering, verify the intended duration, dimensions, frame rate, video codec, and audio codec with media metadata. Use the series configuration instead of assuming every series is permanently 1920x1080 at 30 fps.

Generate representative frames or a contact sheet and inspect the complete video. Preserve a short QC record with any explicit warning acceptance.

## Visual inspection

- The primary teaching target is readable at normal viewing scale.
- Subtitles stay inside their safe area and disappear during speech gaps.
- Every shot has a meaningful state, relationship, evidence, or information change.
- Object identity and spatial continuity survive adjacent shots unless a deliberate cut is documented.
- Camera moves have named targets, settle before the next idea, and do not crop evidence or subtitles.
- Screenshots and recordings display the declared command, code, UI state, or result.
- No unexplained decorative rail, nested wrapper, generic card field, black flash, overlap, clipping, or stale frame is visible.
- Custom and 3D scenes use Remotion's frame clock and deterministic state.

## Semantic and audio checks

Check the boundaries most likely to mislead: introduced vs active, selected vs executing, transient vs stable pointer topology, hardware vs software context saves, and before/after recovery. Inspect a complete causal sequence in a stable view, not only polished stills.

When foley exists, verify fresh event resolution, stem/master integrity and clipping using sound-design.md. Check encoded delivery alignment. With narration, also check voice intelligibility and relative sound level. Objective audio checks do not establish subjective listening quality.

## Review record

Record the actual preproduction route, applicable mode, user feedback and check results. Preserve exact failure statuses for incompatible legacy validators; do not fake approvals, captions or images. Complete-project and publication approval are distinct from an authorized exploratory preview. No automated check supplies human approval.

Keep a concise current-output summary; place historical revisions below it or in revision files so the delivery record does not point readers at a superseded version.
