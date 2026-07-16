#!/usr/bin/env python3
"""Fail closed when a narrated Remotion project has split timing authority."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


EPSILON = 0.06


def read_json(path: Path, errors: list[str]) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:  # noqa: BLE001 - report malformed project input
        errors.append(f"cannot read {path.name}: {exc}")
        return {}


def check_source_literals(source_root: Path, anchor_ids: set[str], errors: list[str]) -> None:
    if not source_root.exists():
        errors.append(f"source root does not exist: {source_root}")
        return
    literal_patterns = (
        r"\b(?:from|until|appearAt|startSeconds|endSeconds)\s*[:=]\s*\d",
        r"visible\(\s*seconds\s*,\s*\d",
        r"seconds\s*(?:<|>|<=|>=|===)\s*\d",
    )
    anchor_pattern = re.compile(r"anchor(?:Start|End)\(\s*[\"']([^\"']+)[\"']\s*\)")
    for path in source_root.rglob("*.*"):
        if path.suffix not in {".ts", ".tsx", ".js", ".jsx"}:
            continue
        text = path.read_text(encoding="utf-8")
        for line_no, line in enumerate(text.splitlines(), start=1):
            if any(re.search(pattern, line) for pattern in literal_patterns):
                errors.append(f"raw scene seconds in {path.relative_to(source_root)}:{line_no}")
        for anchor_id in anchor_pattern.findall(text):
            if anchor_id not in anchor_ids:
                errors.append(f"unknown anchor {anchor_id!r} in {path.relative_to(source_root)}")


def check_legacy_timing_exports(root: Path, errors: list[str]) -> None:
    """Reject hand-authored caption timing files that compete with timeline.json."""
    audio_root = root / "public" / "audio"
    if not audio_root.exists():
        return
    for path in audio_root.rglob("*"):
        if not path.is_file() or path.name == "transcript.json":
            continue
        lowered = path.name.lower()
        if "caption" in lowered and path.suffix.lower() in {".json", ".srt", ".vtt"}:
            errors.append(f"duplicate caption timing file: {path.relative_to(root)}")


def check_captions(
    captions: list[dict], anchor_map: dict[str, dict], errors: list[str]
) -> None:
    narration_ids = {
        anchor_id for anchor_id, anchor in anchor_map.items() if anchor.get("kind") == "narration"
    }
    referenced: list[str] = []
    for caption in captions:
        if set(caption) != {"anchor"} or caption["anchor"] not in anchor_map:
            errors.append("captions must contain exactly one known anchor reference")
            continue
        anchor_id = caption["anchor"]
        if anchor_map[anchor_id].get("kind") != "narration":
            errors.append(f"caption does not reference narration: {anchor_id}")
            continue
        referenced.append(anchor_id)
    duplicates = {anchor_id for anchor_id in referenced if referenced.count(anchor_id) > 1}
    for anchor_id in sorted(duplicates):
        errors.append(f"narration anchor has duplicate captions: {anchor_id}")
    missing = narration_ids - set(referenced)
    for anchor_id in sorted(missing):
        errors.append(f"narration anchor has no caption: {anchor_id}")


def check_shots(root: Path, shots: list[dict], anchor_map: dict[str, dict], errors: list[str]) -> None:
    shot_ids: set[str] = set()
    for shot in shots:
        shot_id = shot.get("id")
        if not isinstance(shot_id, str) or not shot_id.strip():
            errors.append("shot has no non-empty id")
        elif shot_id in shot_ids:
            errors.append(f"duplicate shot id: {shot_id}")
        else:
            shot_ids.add(shot_id)

        start = shot.get("startAnchor")
        end = shot.get("endAnchor")
        if start not in anchor_map or end not in anchor_map:
            errors.append(f"shot has unknown anchors: {shot_id or '<unnamed>'}")
        elif anchor_map[end]["end"] <= anchor_map[start]["start"]:
            errors.append(f"shot has reversed anchors: {shot_id}")

        if "image" not in shot:
            continue
        image = shot.get("image")
        annotated = shot.get("annotated")
        if not isinstance(image, str) or not image.strip():
            errors.append(f"image shot has invalid image name: {shot_id}")
            continue
        if not isinstance(annotated, bool):
            errors.append(f"image shot must declare boolean annotated: {shot_id}")
            continue
        folder = "evidence-annotated" if annotated else "evidence"
        asset_path = root / "public" / folder / image
        if not asset_path.is_file():
            errors.append(f"missing evidence asset for {shot_id}: {asset_path.relative_to(root)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path)
    parser.add_argument("--source-root", type=Path)
    args = parser.parse_args()

    root = args.project.resolve()
    errors: list[str] = []
    timeline_path = root / "timeline.json"
    duplicates = [path for path in root.rglob("timeline*.json") if path.name != "timeline.json" and "node_modules" not in path.parts and "out" not in path.parts]
    if duplicates:
        errors.extend(f"duplicate timeline file: {path.relative_to(root)}" for path in duplicates)
    check_legacy_timing_exports(root, errors)
    if not timeline_path.exists():
        errors.append("missing required timeline.json")
        print("\n".join(errors))
        raise SystemExit(1)

    timeline = read_json(timeline_path, errors)
    transcript_path = root / "public/audio/transcript.json"
    transcript = read_json(transcript_path, errors) if transcript_path.exists() else {}
    audio_duration = timeline.get("audio", {}).get("duration")
    transcript_duration = transcript.get("duration")
    if not isinstance(audio_duration, (int, float)) or not isinstance(transcript_duration, (int, float)):
        errors.append("timeline audio.duration and transcript duration must be numeric")
    elif abs(audio_duration - transcript_duration) > EPSILON:
        errors.append("timeline audio.duration does not match transcript duration")
    anchors = timeline.get("anchors", [])
    anchor_map = {item.get("id"): item for item in anchors if item.get("id")}
    if len(anchor_map) != len(anchors):
        errors.append("anchors must have unique non-empty ids")

    narration_segments: dict[int, str] = {}
    for anchor_id, anchor in anchor_map.items():
        start, end = anchor.get("start"), anchor.get("end")
        if not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or end <= start:
            errors.append(f"invalid anchor range: {anchor_id}")
        if anchor.get("kind") == "narration":
            if not str(anchor.get("text", "")).strip():
                errors.append(f"narration anchor has no reviewed text: {anchor_id}")
            for segment_id in anchor.get("sourceSegmentIds", []):
                if segment_id in narration_segments:
                    errors.append(f"raw segment {segment_id} is covered twice")
                narration_segments[segment_id] = anchor_id
        elif anchor.get("kind") == "visual":
            refs = anchor.get("narrationAnchorIds", [])
            if not refs or any(ref not in anchor_map for ref in refs):
                errors.append(f"visual anchor must cite narration anchors: {anchor_id}")

    for segment in transcript.get("segments", []):
        segment_id = segment.get("id")
        anchor_id = narration_segments.get(segment_id)
        if not anchor_id:
            errors.append(f"uncovered spoken segment: {segment_id}")
            continue
        anchor = anchor_map[anchor_id]
        if abs(anchor["start"] - segment["start"]) > EPSILON or abs(anchor["end"] - segment["end"]) > EPSILON:
            errors.append(f"narration anchor does not match raw timing: {anchor_id}")

    check_captions(timeline.get("captions", []), anchor_map, errors)
    check_shots(root, timeline.get("shots", []), anchor_map, errors)

    if args.source_root:
        check_source_literals(args.source_root.resolve(), set(anchor_map), errors)

    report = {"errors": errors, "timeline": str(timeline_path)}
    out = root / "out"
    out.mkdir(exist_ok=True)
    (out / "timeline-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
