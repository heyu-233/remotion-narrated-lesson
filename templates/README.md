# Narrated Lesson (Remotion)

Project skeleton produced by the `remotion-narrated-lesson` skill.

## Pipeline

1. Drop your recorded voiceover under `public/audio/voiceover.m4a`.
2. Run `python scripts/transcribe.py public/audio/voiceover.m4a` to produce `public/audio/transcript.json`.
3. Edit `src/transcript.ts` → fill in the `CHAPTERS` array (segment id ranges).
4. Open the segment ids you care about in `src/Chapter1.tsx` and friends.
5. `npm install && npm run dev` to preview in Remotion Studio.
6. `npm run build` to render to `out/lesson.mp4`.

## Where time comes from

`transcript.json` is the only source of timing. Every chapter binds its anchors with `segmentRangeStart(id)` / `segmentRangeEnd(id)`, so re-recording + re-transcribing is the only step needed for a re-cut as long as segment ids stay stable.

## Files

- `src/Root.tsx` — Composition registration
- `src/Composition.tsx` — top-level routing + Audio + subtitles
- `src/transcript.ts` — JSON ingest + segment helpers + CHAPTERS table
- `src/timings.ts` — derived FPS / TOTAL_FRAMES / SUBTITLE_SEGMENTS
- `src/shared.tsx` — palette / fonts / easing / Heading / CodeBlock / SubtitleBar
- `src/Chapter1.tsx` — single-chapter template (copy → ChapterN.tsx)
- `scripts/transcribe.py` — faster-whisper force alignment

See `~/.claude/skills/remotion-narrated-lesson/SKILL.md` for the full method.
