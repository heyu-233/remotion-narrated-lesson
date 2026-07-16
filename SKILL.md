---
name: remotion-narrated-lesson
description: Create deterministic, narrated technical teaching videos with Remotion. Use when producing animated computer-science, programming, systems, AI, or embedded lessons from a narration script and voiceover; aligning Whisper transcripts; planning storyboard/animatic/scene/shot structure; rendering MP4; or validating timeline, subtitles, and video quality.
---

# Remotion Narrated Lesson V2

Build a semantic-timeline production system, not a chapter slideshow. Keep timing stable across re-recordings by deriving scenes and shots from narration anchors rather than Whisper segment IDs.

## Choose the workflow

1. Select `narrated` for system/concept animation, `code-walkthrough` for code-led explanation, or a hybrid only when both are necessary.
2. Confirm the narration and audio before visual production. Use the user's recording by default; test TTS is only for reproducible validation.
3. Read [workflows.md](references/workflows.md), then copy a template with `scripts/scaffold_project.py`.
4. Transcribe audio, create the project's only authored timing file, `timeline.json`, then run `scripts/validate_timeline.py`. Never time business shots with `segmentRangeStart(id)`.
5. Create short HTML/SVG motion prototypes for concept-heavy shots before implementing high-fidelity Remotion scenes. Use HTML to test visual language; recreate approved motion with frame-driven Remotion state.
6. Write the beat sheet and shot list before implementation. Render and review an animatic before high-fidelity animation.
7. Render MP4, run `scripts/validate_timeline.py`, generate a contact sheet, and visually inspect the full video.

## Required model

Use this hierarchy:

`Whisper segment -> resolved narration anchor -> semantic beat -> scene / shot`

Use `anchorStart("context.save")` and `anchorEnd("context.restore")` in Remotion. A missing or reversed anchor is an error; correct the corresponding record in `timeline.json`, never by silently falling back to a time or the final subtitle.

## Single Timeline Contract (non-negotiable)

- A video project has exactly one authored timing file: `<project>/timeline.json`. Do not keep `timeline.generated.json`, caption JSON/SRT timing files, or a second timeline after migration. The raw ASR transcript is evidence, not a competing timeline.
- `timeline.json` owns every numeric time. It contains narration anchors, caption references, and shot references. Captions use `{ "anchor": "narration.001" }`; shots use `startAnchor` and `endAnchor`. Neither captions nor scene data may carry their own seconds.
- Each narration anchor must reference its raw ASR segment IDs, have reviewed visible text, and cover every spoken source segment exactly once. A deliberate silent gap must be represented as a named visual anchor in the same file.
- Remotion reads `timeline.json` through `anchorStart()` / `anchorEnd()` only. A literal scene time such as `from: 127.02`, `until: 156.92`, `visible(seconds, 127.02, ...)`, or `seconds < 127.02` is a build-blocking error.
- Generate derived subtitle exports from `timeline.json`; never hand-edit their timecodes. Correct wording inside the corresponding narration anchor, then regenerate.
- Before preview or render, run `python <skill>/scripts/validate_timeline.py <project> --source-root <project>/src`. Fix every error. Do not waive duplicate timelines, unknown anchors, raw scene seconds, or uncovered narration.

## Failure-Proof Production Rules

- Migrate timing before deleting it: first search every `anchorStart()` / `anchorEnd()` use, move each scene to the new anchor IDs, then remove the legacy timing file and run the validator immediately. Never delete or rename a timeline based on one scene compiling.
- Correct subtitles conservatively. Keep words inside their matching ASR segment; technical-name fixes are allowed, but do not move wording from a neighbouring spoken segment. Listen to every low-similarity correction before accepting it.
- Treat evidence as a declared asset contract. An image shot must declare `image` and `annotated`; `annotated: true` resolves to `public/evidence-annotated/<image>`, otherwise `public/evidence/<image>`. The validator checks the file, but a human must still open it and confirm the target command or result is actually visible and correctly framed.
- Prefer one annotated keyframe per narration anchor for terminal/UI teaching. Keep video only where movement itself teaches something. Do not stretch a long recording across unrelated narration, and never use a screenshot merely because its filename matches the topic.
- A conceptual transition longer than three seconds must establish a relation, not behave as a title card: use at least two of status nodes, a moving packet, a flow connection, a scan, or a diagram state change. Structure it as enter -> establish relation -> hand off to evidence.
- Make source edits with small `apply_patch` changes. Do not paste a full TSX file through a shell or rely on shell output encoding; run lint after each structural edit.
- Render in a background process when foreground limits are shorter than the render. Monitor completion, then use `ffprobe` to verify H.264, AAC, 1920x1080, and the expected duration before delivery.

## Mandatory quality gates

- Keep components pure functions of frame/time and model state. Do not use CSS transitions, timers, `useEffect`, unseeded randomness, or command-driven Monaco scrolling.
- Use one state model for scientific/system diagrams. CPU, process, register, queue, arrows, and subtitle emphasis must read the same state.
- Make scenes stable stages and shots 1.5-5 seconds of continuous composition. Preserve continuity unless a cut is intentional.
- Reserve the bottom subtitle safe area. Return blank subtitles outside a matching interval; never repeat the last line.
- Generate one caption per spoken phrase from the source audio. Treat ASR only as timing evidence; manually correct the visible text, especially technical names, and never replace a spoken passage with a coarse summary caption.
- Before any preview, validate the canonical timeline, its raw transcript duration, caption coverage, and declared evidence assets. Treat a missing or stale image as a build failure, not a visual warning.
- Use the motion tokens in [visual-system.md](references/visual-system.md); do not invent routine easing or decorative motion per shot.
- Place every screen recording inside a `Sequence` that begins at its shot frame. For a result reveal, freeze a frame from the same video source before applying a camera push; never fake an empty terminal with a blackout overlay or swap to an unrelated poster.
- Run automated QC and inspect the contact sheet and full render. Address errors; record explicit waivers for warnings.

## Reference routing

- Read [workflows.md](references/workflows.md) for the production sequence and project files.
- Read [scene-shot-architecture.md](references/scene-shot-architecture.md) when designing beats, anchors, or diagram state.
- Read [code-walkthrough.md](references/code-walkthrough.md) for the code template.
- Read [visual-system.md](references/visual-system.md) for stage, motion, and layout rules.
- Read [recording-and-motion.md](references/recording-and-motion.md) before building subtitles, screen recordings, camera pushes, or HTML-derived animation.
- Read [quality-gates.md](references/quality-gates.md) before rendering or accepting an output.
