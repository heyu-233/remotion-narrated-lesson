---
name: remotion-narrated-lesson
description: Create deterministic narrated technical and engineering videos with Remotion. Use when producing computer-science, programming, embedded, electronics, control, mechanism, or system lessons from narration and voiceover; designing complex SVG/HTML/3D engineering animation; aligning transcripts; planning storyboards, animatics, scenes, and shots; rendering MP4; or validating timelines, evidence, subtitles, and video quality.
---

# Remotion Narrated Lesson V3

Build a semantic-timeline production system, not a chapter slideshow. Keep timing stable across re-recordings by deriving scenes and shots from narration anchors rather than Whisper segment IDs.

Use Remotion as the only runtime, timeline authority, preview environment, and renderer. Borrow animation-design ideas from other systems only as design vocabulary; do not introduce a second animation runtime unless the user explicitly requests a separately rendered asset workflow.

## Choose the workflow

1. Select `screenshot-led` when the user mentions screenshots, screen captures, keyframes, or wants to reproduce steps and capture evidence personally. This is the default for QEMU/driver lessons. Select `narrated` for system/concept animation, `code-walkthrough` for code-led explanation, or a hybrid only when both are necessary.
2. Confirm the narration and audio before visual production. Use the user's recording by default; test TTS is only for reproducible validation.
3. Read [workflows.md](references/workflows.md) and [official-remotion-practices.md](references/official-remotion-practices.md), then copy a template with `scripts/scaffold_project.py`.
4. Transcribe audio, create the project's only authored timing file, `timeline.json`, then run `scripts/validate_timeline.py`. Never time business shots with `segmentRangeStart(id)`.
5. For concept-heavy shots, optionally create short HTML/SVG motion prototypes when they help resolve uncertain spatial logic. Treat them as an internal design aid, not a user-review gate; continue into frame-driven Remotion implementation unless the user explicitly asks to inspect or approve the prototype.
6. Write the beat sheet and shot list before implementation. Render and review an animatic before high-fidelity animation.
7. Render MP4, run `scripts/validate_timeline.py`, generate a contact sheet, and visually inspect the full video.

## Complex animation workflow

- Read [motion-design-language.md](references/motion-design-language.md) when the lesson needs object choreography, module assembly, geometry, mechanisms, signal flow, synchronized diagrams, or failure/recovery animation.
- Read [three-dimensional-scenes.md](references/three-dimensional-scenes.md) before adding React Three Fiber, GLB/GLTF assets, 3D cameras, lights, or postprocessing.
- Write each complex shot as `setup -> action -> settle -> evidence -> handoff`. Every phase must have a named semantic purpose; omit phases that do not improve comprehension.
- Describe motion with semantic verbs such as `dock`, `trace`, `measure`, `transfer`, `injectFailure`, and `transitionState` before choosing SVG, HTML, Canvas, or 3D implementation.
- When spatial logic is uncertain, an HTML/SVG prototype may be used internally to test the hardest mechanism. Rebuild the selected behavior with `useCurrentFrame()`, `interpolate()`, and explicit frame ranges. Do not pause for prototype approval unless the user explicitly requests it.
- Keep object identity and spatial continuity across adjacent shots. Prefer changing camera focus or system state over replacing the entire scene.
- Read [engineering-animation-patterns.md](references/engineering-animation-patterns.md) for mechanisms, dimension drawings, test benches, state machines, and synchronized failure injection.

## Operation-first outline rule

- Classify every narration anchor in the outline as `operation`, `explanation`, or `concept` before choosing visuals.
- For operation language such as create, open, click, type, run, copy, mount, or replace, default to a real screenshot or an explicitly approved screen recording that shows the named UI state and result. Do not substitute an abstract animation merely because it is easier to produce.
- Use animation for explanations, relationships, and invisible system behavior. If an operation cannot yet be captured, keep a named evidence placeholder in the outline and material manifest instead of converting it into a concept card.
- Bind the screenshot or recording to the exact spoken operation anchor; do not let a broad chapter animation cover it.

## Screenshot-Led Evidence Mode

- Before recording or implementation, make the production plan include a screenshot manifest. For every required image state: `id`, narration anchor range, exact reproduction action, expected command/result, crop/focus area, and whether an annotation is needed.
- The user reproduces the experiment and captures as many stills as useful. Store raw images in `public/evidence/`; inspect each source before using it. Bake reviewed callouts into `public/evidence-annotated/` and declare the selected file in `timeline.json`.
- Build the lesson from these stills first. Use short, controllable image changes, crop pushes, and annotations to match each narration anchor; do not pad the timeline with a static terminal recording.
- Do not hand-write percentage coordinates for callouts. Declare the target text and its narration anchor, locate it against the original screenshot with OCR, and retain source-pixel geometry. An unresolved or ambiguous target is a build failure, not a reason to guess a rectangle.
- Treat OCR provenance as mandatory data, not a suggestion. Every callout record must declare `source: "ocr"` or an equivalent named OCR engine and store its source-pixel box. If OCR cannot resolve the target, use `source: "manual"`, retain the reviewed source-pixel box, set `manualReviewed: true`, and record the reason. A guessed box, an unreviewed manual box, or a missing provenance field blocks preview and render.
- **Use one coordinate authority.** Store OCR/manual-review results only in `callouts.targets.json`; after review, run `scripts/generate_callouts.py <project>`. It creates `src/generated-callouts.ts`, the only runtime source for callout boxes and evidence crops. TSX may import and transform this generated data, but must never contain a second handwritten `{x, y, width, height}` callout definition.
- **Fail closed on stale coordinates.** The generator embeds the SHA-256 of `callouts.targets.json`. `validate_timeline.py --source-root <project>/src` compares that digest with the generated file, requires the runtime source to import `generated-callouts`, and rejects handwritten coordinate literals outside the generated file. A changed OCR box therefore cannot silently leave an old highlighter on screen.
- **Make crops evidence-safe.** Each evidence image in `callouts.targets.json` declares its source size and source-pixel crop. The crop must contain every active callout plus its configured `safePadding` (default: 24 source pixels) on all four sides. Missing crop metadata, a clipped box, or a crop outside the source image blocks preview and render.
- Do not replace an unavailable OCR tool with approximate coordinates to keep production moving. Install or use an available local OCR runtime first; if that is impossible, stop at the material-preparation gate and report the blocker.
- Give every callout a horizontal and vertical padding margin around the detected text. Draw an outline and outer glow only; do not use an opaque fill that covers terminal output or code.
- For a screenshot containing multiple commands, declare one callout per command and bind each one to its own narration-anchor range. Show only the current callout. When adjacent ranges share the same screenshot, interpolate the frame between their source-pixel boxes instead of showing all callouts at once.
- When a near-square editor capture is used to explain code, keep the original in `public/evidence/` and create a separate, manually reviewed code-crop asset that contains the relevant editor region plus enough surrounding lines for context. Use the crop only during code narration; never stretch the full screenshot or crop away the command/result needed by the current narration anchor.
- Every screenshot must have at least one narration-bound callout. A screenshot may be exempt only when a production manifest gives a specific reason that no target should be emphasized; surface that exception for review. If OCR cannot locate a long command, retry with a shorter distinctive token, then use a manually reviewed source-pixel box. Never silently omit a callout because OCR was inconvenient.
- Video is optional and may be at most ten seconds per clip. Use it only when motion itself teaches something that sequential screenshots cannot. Before recording any short clip, explain its purpose, planned duration, and insertion anchor, then wait for the user's explicit approval.
- Do not begin automated screen recording merely because an outline contains a video slot. If the user has not approved that clip, leave a named screenshot placeholder in the plan instead.

Use this minimum evidence contract. `sourcePixelBox`, `sourceSize`, and `crop` are all measured against the original, uncropped screenshot. `source` may be a named OCR runtime such as `windows-ocr`; manual fallback requires both review fields.

```json
{
  "images": [
    {
      "image": "01-terminal.png",
      "sourceSize": {"width": 1920, "height": 1080},
      "crop": {"x": 120, "y": 80, "width": 1500, "height": 860}
    }
  ],
  "callouts": [
    {
      "id": "command-01",
      "image": "01-terminal.png",
      "anchor": "narration.010",
      "target": "wsl --status",
      "source": "windows-ocr",
      "sourcePixelBox": {"x": 300, "y": 420, "width": 260, "height": 36},
      "safePadding": 24
    }
  ],
  "exceptions": []
}
```

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

## Subtitle Lock Contract (non-negotiable)

- **Captions have one source only:** the `captions` array in `timeline.json`. Every caption must reference exactly one `kind: "narration"` anchor, whose `start` and `end` exactly match its raw ASR source segment. Never render subtitles from `visualAnchors`, shot ranges, beat ranges, scene ranges, or a summary sentence.
- **Keep visual timing separate:** `visualAnchors` may control screenshots, diagrams, cuts, and camera motion only. They are forbidden as a subtitle data source, including as a fallback when a caption is missing. If a caption is missing, render no subtitle and fail validation.
- **Separate caption activity from visual state:** resolve the visible caption only when the current time is inside that caption anchor. Resolve scene, screenshot, and callout state from the latest valid timeline anchor whose start has already been reached. During a spoken pause, render no caption but keep the previous visual state and highlighter stable. Never drive visual branching from `caption?.id`, because a caption gap would reset the scene state.
- **Do not leave implicit visual gaps between adjacent shots:** select the latest shot whose start anchor has been reached and keep that visual until the next shot starts. Do not expire a visual merely because its end narration anchor has ended; spoken pauses commonly exist before the next start anchor and would otherwise produce brief empty flashes. Render a blank stage only when a deliberate silent visual anchor explicitly requests it.
- **Keep the default scene empty:** scene dispatch must explicitly match every known scene key and return `null` for an unknown key or for time before the first valid visual anchor. Never fall back to the first scene, an arbitrary concept animation, or the last unrelated scene. A clean background is the only valid default.
- **Bind screenshots to spoken anchors:** every image shot must start and end on `kind: "narration"` anchors. Broad `visualAnchors` are for conceptual diagrams only; they must never keep a screenshot on screen across multiple spoken steps.
- **Lock captions before visuals:** transcript correction and caption timing are a dedicated phase. Do not create screenshot shots, animation scenes, or a final preview until the caption review gate below is approved.
- **Do not optimize away the mapping:** a semantic beat may group many spoken phrases for visual continuity, but the subtitle renderer must still iterate the original `captions` references. A shorter implementation is never a reason to merge subtitle ranges.

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
- Prefer `interpolate()` with explicit clamping and Bézier easing. Use `spring()` only for intentionally physical motion. Use individual `translate`, `scale`, and `rotate` style properties when practical.
- Import video and audio from `@remotion/media`, images through Remotion's `<Img>`, and public assets through `staticFile()`. Add compatible Remotion packages with `npx remotion add`.
- Give meaningful `Sequence`, `Series`, and editable Studio elements descriptive names. Premount expensive or stateful sequences when it prevents first-frame loading artifacts.
- Use `Interactive.*` only when Studio manipulation is genuinely useful and does not undermine the canonical semantic timeline.
- Use one state model for scientific/system diagrams. CPU, process, register, queue, arrows, and subtitle emphasis must read the same state.
- Make scenes stable stages and shots 1.5-5 seconds of continuous composition. Preserve continuity unless a cut is intentional.
- **Optional concept-animation review:** run this only when the user explicitly asks for an intermediate animation check. Inspect one representative scene at its start, middle, and end frames in Remotion Studio and record the result in `storyboard/animation-review.md`. Do not pause normal production for this review. Whether or not the optional review is requested, final concept scenes must contain meaningful domain objects, visible relationships, semantic state changes, and a settled state without overlap, clipping, or unreadable content; a scene made only from cards fading in, nodes lighting up, or one line being drawn is not acceptable.
- Reserve the bottom subtitle safe area. Return blank subtitles outside a matching interval; never repeat the last line.
- Generate one caption per spoken phrase from the source audio. Treat ASR only as timing evidence; manually correct the visible text, especially technical names, and never replace a spoken passage with a coarse summary caption.
- Caption source validation is build-blocking: `src/timings.ts` (or the project subtitle module) must use the caption export derived from `timeline.captions` and must not import or search `visualAnchors` for subtitle rendering. Run the timeline validator before every preview and render.
- **Caption review gate:** before visual implementation, generate exactly one representative audio-plus-subtitle sample targeting about 20 seconds. Prefer a passage containing both ordinary Chinese narration and technical terms; 15-25 seconds is acceptable when needed to end on a natural phrase boundary. Record its path, duration, and human approval in `caption-review.json`. The validator must fail if the sample count is not one, its duration is outside that range, the file is missing, or approval is absent. Do not use a full-video render as a substitute for this gate.

Use this minimum review record. `approved` stays `false` until the user has listened to the sample:

```json
{
  "approved": false,
  "samples": [
    {"anchor": "narration.001", "preview": "out/caption-qc/01-sample.mp4", "durationSeconds": 20.0, "approved": false}
  ]
}
```
- Before any preview, validate the canonical timeline, its raw transcript duration, caption coverage, and declared evidence assets. Treat a missing or stale image as a build failure, not a visual warning.
- Before any preview or export in screenshot-led mode, run the generated-callout gate: `python <skill>/scripts/generate_callouts.py <project>` followed by `python <skill>/scripts/validate_timeline.py <project> --source-root <project>/src`. Do not bypass a failed OCR, digest, import, or crop-safety check with a manual TSX edit.
- Use the motion tokens in [visual-system.md](references/visual-system.md); do not invent routine easing or decorative motion per shot.
- Place every screen recording inside a `Sequence` that begins at its shot frame. For a result reveal, freeze a frame from the same video source before applying a camera push; never fake an empty terminal with a blackout overlay or swap to an unrelated poster.
- Run automated QC and inspect the contact sheet and full render. Address errors; record explicit waivers for warnings.
- For any 3D source, the validator must reject raw R3F `Canvas`, `useFrame()`, effects used as clocks, timers, wall-clock time, unseeded randomness, Theatre.js runtime timing, and model assets missing reviewed license metadata.

## Reference routing

- Read [workflows.md](references/workflows.md) for the production sequence and project files.
- Read [official-remotion-practices.md](references/official-remotion-practices.md) before writing or upgrading Remotion markup, media, transitions, fonts, effects, or 3D scenes.
- Read [scene-shot-architecture.md](references/scene-shot-architecture.md) when designing beats, anchors, or diagram state.
- Read [motion-design-language.md](references/motion-design-language.md) for complex object choreography and the Motion Canvas-inspired semantic action vocabulary.
- Read [engineering-animation-patterns.md](references/engineering-animation-patterns.md) for engineering diagrams, mechanisms, measurement, test benches, and failure/recovery sequences.
- Read [three-dimensional-scenes.md](references/three-dimensional-scenes.md) for the supported R3F stack, single-clock contract, model provenance, and 3D QC.
- Read [code-walkthrough.md](references/code-walkthrough.md) for the code template.
- Read [visual-system.md](references/visual-system.md) for stage, motion, and layout rules.
- Read [recording-and-motion.md](references/recording-and-motion.md) before building subtitles, screen recordings, camera pushes, or HTML-derived animation.
- Read [quality-gates.md](references/quality-gates.md) before rendering or accepting an output.
