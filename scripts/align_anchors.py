#!/usr/bin/env python3
"""Resolve durable narration anchors to contiguous Whisper transcript segments."""
from __future__ import annotations
import argparse, json, re, unicodedata
from pathlib import Path
from difflib import SequenceMatcher

def normalise(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    return re.sub(r"[^0-9a-z\u4e00-\u9fff]+", "", value)

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--lesson", type=Path, required=True)
    p.add_argument("--transcript", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--overrides", type=Path)
    args = p.parse_args()
    lesson = json.loads(args.lesson.read_text(encoding="utf-8-sig"))
    transcript = json.loads(args.transcript.read_text(encoding="utf-8-sig"))
    overrides = json.loads(args.overrides.read_text(encoding="utf-8-sig")) if args.overrides and args.overrides.exists() else {}
    segments = transcript["segments"]
    resolved, cursor = [], 0
    for anchor in lesson.get("narrationAnchors", []):
        override = overrides.get(anchor["id"])
        if override:
            ids = override["segmentIds"]
            hits = [s for s in segments if s["id"] in ids]
            confidence = 1.0
        else:
            target = normalise(anchor["text"])
            best = None
            for start in range(cursor, len(segments)):
                joined = ""
                for end in range(start, min(start + 6, len(segments))):
                    joined += normalise(segments[end]["text"])
                    score = SequenceMatcher(None, target, joined).ratio()
                    candidate = (score, start, end)
                    if best is None or candidate > best: best = candidate
            assert best is not None
            confidence, start, end = best
            hits = segments[start:end + 1]
            ids = [s["id"] for s in hits]
        if not hits: raise SystemExit(f"anchor {anchor['id']} matched no segments")
        resolved.append({"id": anchor["id"], "start": hits[0]["start"], "end": hits[-1]["end"], "segmentIds": ids, "confidence": round(confidence, 3)})
        cursor = segments.index(hits[-1]) + 1
    args.output.write_text(json.dumps({"anchors": resolved}, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__": main()
