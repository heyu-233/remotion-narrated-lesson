# Quality gates

Run `validate_timeline.py` before render and with `--media` after render. It rejects malformed/overlapping transcript segments, missing or reversed anchors, low confidence, invalid beat/shot references, shot coverage gaps, unreadable subtitle length/speed, and missing assets. Check final MP4 metadata for 1920×1080, 30fps, H.264, and AAC.

Generate 8–10 evenly spaced frames with `generate_contact_sheet.py`. Inspect the full video for black frames longer than 0.25s, clipping, overlap, continuity, and meaningful visual change. Preserve a `qc-report.json`; warnings require an explicit acceptance note.

Before accepting a narrated lesson, additionally verify:

- Captions match the spoken phrase timing and manually reviewed technical vocabulary.
- Every recorded clip begins at its intended local frame inside a `Sequence`.
- A result-reveal push freezes a frame from the same recording; no blackout reveal, unrelated poster swap, or visible flash occurs.
- Camera crops preserve the intended result area and do not cut commands, terminal prefixes, or device output.
- Concept scenes contain a meaningful motion/state change every 1.5-5 seconds; sustained static card layouts require an explicit waiver.
