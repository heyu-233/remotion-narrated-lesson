#!/usr/bin/env python3
"""Transcribe narration into the V2 transcript contract using faster-whisper."""
from __future__ import annotations
import argparse, json
from pathlib import Path

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("audio", type=Path)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--model", default="medium")
    p.add_argument("--device", default="cpu")
    p.add_argument("--compute-type", default="int8")
    p.add_argument("--language", default="zh")
    args = p.parse_args()
    from faster_whisper import WhisperModel
    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(str(args.audio), language=args.language, vad_filter=True)
    rows = [{"id": i, "start": s.start, "end": s.end, "text": s.text.strip()} for i, s in enumerate(segments)]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"language": info.language, "language_probability": info.language_probability, "duration": rows[-1]["end"] if rows else 0, "segments": rows}, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
