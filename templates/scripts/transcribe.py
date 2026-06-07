"""
Force-align voiceover to script via faster-whisper.

Usage:
    python scripts/transcribe.py public/audio/voiceover.m4a

Output:
    public/audio/transcript.json   (consumed by src/transcript.ts)

Tweak `model_size`, `device`, and `compute_type` for your machine.
"""

import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel  # pip install faster-whisper


def transcribe(audio_path: str, out_path: str = None) -> None:
    audio = Path(audio_path)
    if not audio.exists():
        raise SystemExit(f"audio not found: {audio}")

    out = Path(out_path) if out_path else audio.with_name("transcript.json")

    # Pick the fastest config your hardware supports:
    #   GPU:  device='cuda', compute_type='float16'
    #   CPU:  device='cpu',  compute_type='int8'
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")

    segments, info = model.transcribe(
        str(audio),
        language="zh",
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )

    data = {
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": [
            {
                "id": i + 1,
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
                "words": [],
            }
            for i, seg in enumerate(segments)
        ],
    }

    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out}  ({len(data['segments'])} segments, {data['duration']:.1f}s)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: python scripts/transcribe.py <audio> [out.json]")
    transcribe(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
