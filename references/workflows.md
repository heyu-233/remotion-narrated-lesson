# Production workflow

## Project contract

Keep generated project outputs outside this skill. A project contains `public/audio/voiceover.*`, `public/audio/transcript.json`, one authored `timeline.json`, `storyboard/`, `src/`, and `out/`.

`timeline.json` supplies narration anchors, captions, and shots. Anchor IDs are durable semantic names. A re-recording updates the transcript evidence and the reviewed anchor ranges in the same timeline.

## Sequence

1. Select the template; install and type-check it.
2. Obtain audio and transcript it with `scripts/transcribe.py`.
3. Write anchors from stable phrases, then run `align_anchors.py`.
4. Make a beat sheet: each beat declares narrative intent and visible change.
5. Make a shot list with scene, camera, continuity, and anchor bounds.
6. Render gray-box animatic with real audio/subtitles, shot ID, beat ID, and motion direction.
7. Approve pacing, cuts, and continuity once; then implement final visuals.
8. Render, validate, make a contact sheet, and inspect video.

## Windows render stability

Pin every `@remotion/*` package to the exact same version and commit the lockfile. On Windows, use `node_modules\\.bin\\remotion.cmd` if `npx` cannot resolve Remotion. If the managed browser stalls, pass an installed Chrome executable with `--browser-executable="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`. Start at `--concurrency=2`; raise it only after a successful full render.

## Animatic gate

Do not add material, shadows, or complex effects before the animatic passes. An animatic must preserve real timing and show stage blocks, shot/beat IDs, and intended motion only.
