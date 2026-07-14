# Recording And Motion Checklist

## Before implementation

- Keep the approved narration and source audio unchanged.
- Transcribe with segment and word timestamps.
- Create a human-reviewed subtitle-truth layer: retain timestamps, correct visible wording.
- Make an HTML/SVG prototype only when the visual mechanism is uncertain. Use it to approve a scene's objects, movement, and camera intent.

## Before recording

- Record one action per clip: clean state, input, result, hold.
- Clear scrollback and hide credentials, warnings, unrelated windows, build waits, and desktop content.
- Record a short test clip first. Check that terminal text is readable at 1920x1080 and that no crop will hide a command prefix.

## In Remotion

- Wrap every recorded clip with `Sequence from={shotStartFrame}`.
- Use `OffthreadVideo` for recordings and mute its native audio unless it is intentional.
- Never reveal a recording with a full-screen blackout overlay.
- For a proof shot, freeze the same source video frame once the required result exists, then push toward the result with a deliberate `transformOrigin`.
- Do not swap a moving recording for a poster during a camera move.

## Animation

- Use pure `frame/seconds` state in final scenes.
- Break concept explanations into 1.5-5 second micro-shots.
- Match movement to narration verbs: error -> warning/block; reset -> rebuild; request -> packet travel; success -> freeze/focus.
- Prefer meaningful SVG object icons over text-only cards.

## Review

- Drag through subtitle boundaries in Studio and listen to representative phrases.
- Play recording shots continuously to catch flashing, bad local offsets, and abrupt freeze transitions.
- Inspect a contact sheet and final MP4 metadata after rendering.
