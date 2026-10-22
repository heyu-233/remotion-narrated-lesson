# Event-anchored sound effects

Use lightweight foley to mark meaningful changes when requested. Sound placement should be automatic once semantic events are authored; the user should not need to drag individual clips into a separate editor.

## Declare audio intent

Record whether the episode is narrated, foley-only, or silent in its production notes. These are independent of `concept/code/screenshot/hybrid` visual modes. The current installed engine may not have a typed `audioMode` field; inspect it before relying on one.

Use a small, consistent palette for events such as an arrival, disconnection, confirmed state, request, or recovery. Leave room between cues. Do not attach a whoosh to every reveal, arrow, cut or camera move. Do not make a tutorial cue sound like measured device audio or an actual hardware recording.

A cue must agree with what the audience can see and what the explanation has introduced. Hidden setup states do not automatically need audible confirmation. Distinguish operation onset from completion: a cue called “saved” normally belongs to the completed save, not an arbitrary offset after it begins.

## One authored timing source

Declare events in `episodes/<id>/timeline.json`:

```json
{
  "soundEvents": [
    {
      "id": "context-saved",
      "anchor": "save-a-software",
      "phase": "end",
      "offset": 0,
      "kind": "ready",
      "gain": 0.4,
      "pan": 0
    }
  ]
}
```

`phase` selects the anchor start or end; `offset` is in seconds relative to that boundary. Prefer `phase: end` over an offset copied from the operation's duration. The existing examples' omitted phase remains start-compatible. Resolve events into audio samples using the same timeline the visual model reads.

## Shared synthesis tool

The package-free Node adapter `scripts/foley.mjs` builds original short tutorial cues (`ready`, `target`, `drive`, `settle`, `load`, `close`), stereo 48kHz PCM16 stems, a master `foley.wav`, and a manifest. It requires explicit `soundEvents`, including an empty array when silence is intentional.

```powershell
node <skill>/scripts/foley.mjs build --timeline <episode>/timeline.json --output-dir <public-episode>/audio --manifest <episode>/sound-manifest.json
node <skill>/scripts/foley.mjs verify --timeline <episode>/timeline.json --output-dir <public-episode>/audio --manifest <episode>/sound-manifest.json
node <skill>/scripts/test_foley.mjs
```

Use absolute paths when invoking from another working directory. Output files are derived assets; preserve any user-authored files before replacing them. Synthesis is deterministic. Verification checks the freshly resolved event schedule and content hashes so a same-length retime cannot silently reuse stale audio.

The test suite uses temporary self-contained fixtures. When the accepted local pilots exist, add `--engine-root <absolute-engine-root>` to also check their timelines without modifying their assets.

The default `--peak-dbfs -10.5` is a ceiling inherited from these pilots, not a loudness standard or a guarantee of good mixing. Ceiling-only attenuation preserves deliberate gain reductions. The adapter does not generate speech, mix narration, perform ducking, or assess subjective listening quality.

For recorded, generated or licensed external effects, use an explicit asset inventory and a mixer suited to those files; do not relabel them as this tool's synthesized cues. Do not install or call a paid sound service without the task's authorization.

## Render and mix

The current engine's single `timeline.audio.src` can play a prepared master. A foley-only preview can point it at `audio/foley.wav`. Narrated production needs a derived mix of narration and foley, plus retained stems for later adjustment. Keep authored events in the timeline; the mixed file and manifest are outputs, not another clock.

When narration is available, check voice intelligibility and reduce foley where it masks speech. Do not transfer a successful no-voice peak setting to voiced episodes without listening. The pilots establish event placement and automation, not a finished narration-mixing policy.

## QC

- Validate unique events, known anchors, finite values, valid phase/gain/pan and cue bounds.
- Rebuild after relevant timing, cue selection or gain changes. Verify schedule freshness, WAV/stem integrity, duration, channel format and clipping.
- Inspect event alignment in the encoded delivery, not only the source WAV. Full decode and waveform/correlation checks can catch mux offsets; they do not prove the semantic cue choice is appropriate.
- Listen to a representative mix when possible, especially with voice. State when only objective checks and sampled frames were performed.

`soundEvents` and its phase/end semantics are supplied by this adapter. An old per-episode `audio-design.py` may ignore phase, and the installed engine may neither type nor validate these events. Do not claim native integration until the engine is upgraded and tested.
