# Subtitle, Recording, And Motion Rules

## Screenshot-led evidence workflow

Use this workflow by default when the user mentions screenshots, screen captures, keyframes, or personally reproducing a QEMU/driver experiment.

1. Before implementation, publish a screenshot manifest with `id`, narration anchors, reproduction action, expected visible result, crop/focus target, and annotation requirement.
2. Let the user capture the raw evidence while reproducing the experiment. Keep raw files in `public/episodes/<id>/evidence/`; open and inspect each file before it is scheduled.
3. Keep derived annotated evidence beside the episode assets or declare source-pixel callouts in the episode manifest; never animate a floating highlight against a separately scaled image. Keep the evidence spatially fixed unless a documented camera move is required for readability.
4. Use stills as the default visual unit. A clip may be no longer than ten seconds; record its purpose, duration, and insertion anchor in the shot list and continue without adding another approval stop.
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

## Optional result-reveal camera pattern

Use this pattern only when the result cannot remain readable through a reviewed crop or larger static placement. Static evidence is the default for terminal, code, dashboard, and test-result proof shots:

1. Begin with the genuine clean state from the recording.
2. Let each input and output appear at normal speed.
3. Identify the first frame where the required result is complete.
4. Freeze that source frame.
5. If the shot list names a pedagogical reason for motion, push the camera over 1.8-3.5 seconds toward the exact result area with `transformOrigin`; never zoom around the canvas centre by default.
6. Hold long enough for reading, then cut deliberately to the next story beat.

Use `TimedCameraFreezeRecording` in `assets/snippets/screen-recording/ScreenRecordingComposition.tsx`.

## Motion design

- Optionally prototype concept animation in standalone HTML/SVG when the visual mechanism is uncertain. Keep the prototype local to the project, use it for internal design validation, and do not pause for user approval unless the user explicitly requests a prototype review.
- For flowchart-style animation, inspect relevant accepted examples and use a suitable flowchart skill if one is available. Transfer causal staging, domain-object identity, sequential reveal, and meaningful path drawing into frame-driven Remotion; do not automatically transfer looping particles, hover behavior, generic cards, or CSS keyframes.
- Translate the selected prototype behavior into pure frame-driven Remotion state. Do not rely on CSS wall-clock animations, timers, or browser interaction in the final composition.
- Design motion around what actually changes in the mechanism. A request may move a packet when a packet really exists; a completed operation may settle into a readable result. Words such as error, reset, or success do not automatically require shaking, rotation, or a camera push.
- Use semantic beats to pace concept animation. A short action may take 1.5-5 seconds, while an explanation or reading hold may need longer. Several beats can share one stable view; do not add cuts, camera motion, or invented activity merely to fill an interval.
- Use icons or simple SVG symbols when they identify a real object. Do not substitute text cards for a terminal, board, chip, folder, device node, or network endpoint.
- Keep a consistent stage and palette, but vary motion by meaning. Flowing arrows alone are decoration; pair them with state changes and objects that react.
