# Subtitle, Recording, And Motion Rules

## Screenshot-led evidence workflow

Use this workflow by default when the user mentions screenshots, screen captures, keyframes, or personally reproducing a QEMU/driver experiment.

1. Before implementation, publish a screenshot manifest with `id`, narration anchors, reproduction action, expected visible result, crop/focus target, and annotation requirement.
2. Let the user capture the raw evidence while reproducing the experiment. Keep raw files in `public/evidence/`; open and inspect each file before it is scheduled.
3. Bake precise callouts into `public/evidence-annotated/`; never animate a floating highlight against a separately scaled image.
4. Use stills as the default visual unit. A clip may be no longer than ten seconds and requires explicit user approval after its purpose, duration, and insertion anchor have been stated.
5. If approval is absent, keep a named still-image placeholder. Do not record automatically.

## Subtitle truth

1. Transcribe the original voiceover with segment and word timestamps.
2. Review every visible caption against the recording and the approved narration script.
3. Preserve ASR start/end times unless the audio proves they are wrong. Correct text separately in a human-authored caption-truth file.
4. Split captions at spoken phrase boundaries. Prefer 0.8-3.5 second phrases; join only when the resulting line remains readable.
5. Correct technical vocabulary manually: product names, commands, paths, protocols, acronyms, and code identifiers are not trustworthy ASR output.
6. Do not use chapter summaries as subtitles. Do not keep a subtitle on screen after speech stops.

## Screen-recording timeline

- Record one teaching action per clip: empty prompt, command entry, meaningful output, short hold. Do not use one command that completes an entire demo.
- Start each recorded clip at a clean visible state. Remove passwords, unrelated desktop regions, build waits, old scrollback, and host warnings before recording.
- Render a clip inside `Sequence from={shotStartFrame}`. A conditional JSX branch alone does not reset video playback to the shot's local time.
- Use source video frames for every state transition. Do not reveal a clip by fading away a full-screen black overlay.
- When a clip needs a longer hold, freeze an exact source frame. Do not jump from a moving video to a separately captured poster unless a hard cut is intentional.
- Apply crop, masks, and camera transforms to the same video container. Verify that the left, right, and subtitle-safe edges remain readable after every transform.

## Result-reveal camera pattern

Use this pattern for terminal, code, dashboard, or test-result proof shots:

1. Begin with the genuine clean state from the recording.
2. Let each input and output appear at normal speed.
3. Identify the first frame where the required result is complete.
4. Freeze that source frame.
5. Push the camera over 1.8-3.5 seconds toward the exact result area with `transformOrigin`; do not zoom around the canvas centre by default.
6. Hold long enough for reading, then cut deliberately to the next story beat.

Use `TimedCameraFreezeRecording` in `assets/snippets/screen-recording/ScreenRecordingComposition.tsx`.

## Motion design

- Optionally prototype concept animation in standalone HTML/SVG when the visual mechanism is uncertain. Keep the prototype local to the project, use it for internal design validation, and do not pause for user approval unless the user explicitly requests a prototype review.
- Translate the selected prototype behavior into pure frame-driven Remotion state. Do not rely on CSS wall-clock animations, timers, or browser interaction in the final composition.
- Design scenes around narration verbs. For example: error -> shake/block; reset -> rotate/rebuild; boot -> assemble/flow; request -> packet movement; success -> freeze/push.
- Break concept animation into 1.5-5 second micro-shots. Require a visible state change, camera change, or information-flow change in every shot.
- Use icons or simple SVG symbols when they identify a real object. Do not substitute text cards for a terminal, board, chip, folder, device node, or network endpoint.
- Keep a consistent stage and palette, but vary motion by meaning. Flowing arrows alone are decoration; pair them with state changes and objects that react.
