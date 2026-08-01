#!/usr/bin/env python3
"""Fail closed when a narrated Remotion project has split timing authority."""
from __future__ import annotations

import argparse
import hashlib
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


def check_subtitle_source(root: Path, errors: list[str]) -> None:
    """Reject the common shortcut of rendering subtitles from visual beat anchors."""
    timings = root / "src" / "timings.ts"
    if not timings.exists():
        return
    text = timings.read_text(encoding="utf-8")
    if "visualAnchors" in text:
        errors.append("subtitle module must not use visualAnchors; subtitles must use timeline captions only")
    if "captions" not in text:
        errors.append("subtitle module must use the captions export derived from timeline.captions")


def check_caption_review(root: Path, anchor_map: dict[str, dict], errors: list[str]) -> None:
    """Require one reviewed, roughly 20-second subtitle sample before visual production."""
    review_path = root / "caption-review.json"
    if not review_path.exists():
        errors.append("missing caption-review.json; create one approved 15-25 second audio/subtitle sample before visual production")
        return
    review = read_json(review_path, errors)
    samples = review.get("samples")
    if not review.get("approved"):
        errors.append("caption review is not approved")
    if not isinstance(samples, list) or len(samples) != 1:
        errors.append("caption review must contain exactly one sample")
        return
    for index, sample in enumerate(samples, start=1):
        anchor_id = sample.get("anchor") if isinstance(sample, dict) else None
        preview = sample.get("preview") if isinstance(sample, dict) else None
        duration = sample.get("durationSeconds") if isinstance(sample, dict) else None
        if anchor_id not in anchor_map or anchor_map[anchor_id].get("kind") != "narration":
            errors.append(f"caption review sample {index} must reference a narration anchor")
        if not isinstance(preview, str) or not (root / preview).is_file():
            errors.append(f"caption review sample {index} has no rendered preview")
        if not isinstance(duration, (int, float)) or not 15 <= duration <= 25:
            errors.append(f"caption review sample {index} durationSeconds must be between 15 and 25")
        if not isinstance(sample, dict) or not sample.get("approved"):
            errors.append(f"caption review sample {index} is not approved")


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
        if start in anchor_map and end in anchor_map:
            if anchor_map[start].get("kind") != "narration" or anchor_map[end].get("kind") != "narration":
                errors.append(f"image shot must use narration anchors: {shot_id}")
        if not isinstance(annotated, bool):
            errors.append(f"image shot must declare boolean annotated: {shot_id}")
            continue
        folder = "evidence-annotated" if annotated else "evidence"
        asset_path = root / "public" / folder / image
        if not asset_path.is_file():
            errors.append(f"missing evidence asset for {shot_id}: {asset_path.relative_to(root)}")


def read_box(value: object) -> dict | None:
    if not isinstance(value, dict):
        return None
    keys = ("x", "y", "width", "height")
    if not all(isinstance(value.get(key), (int, float)) for key in keys):
        return None
    if value["width"] <= 0 or value["height"] <= 0:
        return None
    return value


def check_callout_coverage(root: Path, shots: list[dict], errors: list[str]) -> dict:
    """Every screenshot needs a declared, traceable callout or reviewed exception."""
    manifest_path = root / "callouts.targets.json"
    if not manifest_path.exists():
        errors.append("missing callouts.targets.json; screenshot callout coverage is required")
        return {}
    manifest = read_json(manifest_path, errors)
    callouts = manifest.get("callouts", [])
    exceptions = manifest.get("exceptions", [])
    for index, item in enumerate(callouts):
        if not isinstance(item, dict):
            errors.append(f"callout {index} must be an object")
            continue
        label = item.get("target") or item.get("image") or str(index)
        box = read_box(item.get("sourcePixelBox"))
        if not box or box["x"] < 0 or box["y"] < 0:
            errors.append(f"callout {label} needs a positive sourcePixelBox")
        source = item.get("source")
        if isinstance(source, str) and source.strip() and source != "manual":
            continue
        if source == "manual" and item.get("manualReviewed") is True:
            continue
        errors.append(
            f"callout {label} needs OCR provenance or source=manual with manualReviewed=true"
        )
    declared_images = {item.get("image") for item in callouts if isinstance(item, dict) and item.get("image")}
    exception_reasons = {
        item.get("image"): item.get("reason")
        for item in exceptions
        if isinstance(item, dict) and item.get("image")
    }
    for shot in shots:
        image = shot.get("image")
        if not image:
            continue
        if image in declared_images:
            continue
        reason = exception_reasons.get(image)
        if not isinstance(reason, str) or not reason.strip():
            errors.append(f"screenshot has no callout or exception: {shot.get('id', image)}")
    return manifest


def check_crop_safety(manifest: dict, shots: list[dict], errors: list[str]) -> None:
    """Reject any source crop that clips a callout or its safety margin."""
    images = manifest.get("images")
    if not isinstance(images, list):
        errors.append("callouts.targets.json needs an images array with sourceSize and crop metadata")
        return
    image_specs = {item.get("image"): item for item in images if isinstance(item, dict) and item.get("image")}
    required_images = {shot.get("image") for shot in shots if shot.get("image")}
    callouts = manifest.get("callouts", [])
    for image in required_images:
        spec = image_specs.get(image)
        if not spec:
            errors.append(f"missing crop metadata for screenshot: {image}")
            continue
        source_size = spec.get("sourceSize")
        crop = read_box(spec.get("crop"))
        if not isinstance(source_size, dict) or not all(isinstance(source_size.get(k), (int, float)) and source_size[k] > 0 for k in ("width", "height")):
            errors.append(f"image {image} needs positive sourceSize.width and sourceSize.height")
            continue
        if not crop or crop["x"] < 0 or crop["y"] < 0:
            errors.append(f"image {image} needs a positive source-pixel crop")
            continue
        if crop["x"] + crop["width"] > source_size["width"] or crop["y"] + crop["height"] > source_size["height"]:
            errors.append(f"crop exceeds source image bounds: {image}")
            continue
        for item in callouts:
            if not isinstance(item, dict) or item.get("image") != image:
                continue
            box = read_box(item.get("sourcePixelBox"))
            if not box:
                continue
            padding = item.get("safePadding", 24)
            if not isinstance(padding, (int, float)) or padding < 0:
                errors.append(f"callout {item.get('id', item.get('target', image))} has invalid safePadding")
                continue
            if (
                box["x"] - padding < crop["x"]
                or box["y"] - padding < crop["y"]
                or box["x"] + box["width"] + padding > crop["x"] + crop["width"]
                or box["y"] + box["height"] + padding > crop["y"] + crop["height"]
            ):
                errors.append(f"crop clips callout safety margin: {item.get('id', item.get('target', image))}")


def check_generated_callout_contract(root: Path, source_root: Path, manifest: dict, errors: list[str]) -> None:
    """Keep runtime geometry generated from one reviewed OCR/manual manifest."""
    manifest_path = root / "callouts.targets.json"
    generated_path = source_root / "generated-callouts.ts"
    if not generated_path.is_file():
        errors.append("missing src/generated-callouts.ts; run generate_callouts.py before preview or render")
        return
    digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    generated = generated_path.read_text(encoding="utf-8")
    if digest not in generated:
        errors.append("generated-callouts.ts is stale; regenerate it from callouts.targets.json")
    imported = False
    geometry_literal = re.compile(r"\{\s*x\s*:\s*\d+(?:\.\d+)?\s*,\s*y\s*:\s*\d+(?:\.\d+)?\s*,\s*width\s*:\s*\d+(?:\.\d+)?\s*,\s*height\s*:\s*\d+(?:\.\d+)?\s*\}")
    for path in source_root.rglob("*.*"):
        if path.suffix not in {".ts", ".tsx", ".js", ".jsx"} or path.resolve() == generated_path.resolve():
            continue
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(source_root)
        if "generated-callouts" in text:
            imported = True
        for line_no, line in enumerate(text.splitlines(), start=1):
            if geometry_literal.search(line):
                errors.append(f"handwritten runtime callout coordinates in {relative}:{line_no}; import generated-callouts")
    if manifest.get("callouts") and not imported:
        errors.append("runtime source does not import generated-callouts; callout geometry has a second authority")


def check_three_scene_contract(root: Path, source_root: Path, errors: list[str]) -> None:
    """Reject autonomous 3D clocks and undocumented model assets."""
    source_files = [
        path
        for path in source_root.rglob("*.*")
        if path.suffix in {".ts", ".tsx", ".js", ".jsx"}
    ]
    three_files: list[tuple[Path, str]] = []
    for path in source_files:
        text = path.read_text(encoding="utf-8")
        relative_parts = {part.lower() for part in path.relative_to(source_root).parts}
        if (
            "three" in relative_parts
            or "@remotion/three" in text
            or "<ThreeCanvas" in text
        ):
            three_files.append((path, text))
    if not three_files:
        return

    forbidden = (
        (r"\buseFrame\s*\(", "useFrame() creates an autonomous R3F clock; use useCurrentFrame()"),
        (r"\b(?:useEffect|useLayoutEffect)\s*\(", "3D scene state must be a pure function of the Remotion frame"),
        (r"\b(?:setTimeout|setInterval)\s*\(", "timers are forbidden in deterministic 3D scenes"),
        (r"\bDate\.now\s*\(", "Date.now() is forbidden in deterministic 3D scenes"),
        (r"\bperformance\.now\s*\(", "performance.now() is forbidden in deterministic 3D scenes"),
        (r"\bMath\.random\s*\(", "unseeded randomness is forbidden in deterministic 3D scenes"),
        (r"from\s+[\"']@theatre/(?:core|studio)[\"']", "Theatre.js cannot be a second runtime timeline"),
        (
            r"import\s*\{[^}]*\bCanvas\b[^}]*\}\s*from\s*[\"']@react-three/fiber[\"']",
            "use @remotion/three ThreeCanvas instead of the raw R3F Canvas",
        ),
    )
    uses_remotion_frame = False
    model_references: set[str] = set()
    model_pattern = re.compile(r"[\"']([^\"']+\.(?:glb|gltf))[\"']", re.IGNORECASE)
    for path, text in three_files:
        relative = path.relative_to(source_root)
        uses_remotion_frame = uses_remotion_frame or "useCurrentFrame" in text
        model_references.update(model_pattern.findall(text))
        for line_no, line in enumerate(text.splitlines(), start=1):
            for pattern, message in forbidden:
                if re.search(pattern, line):
                    errors.append(f"{message}: {relative}:{line_no}")
    if not uses_remotion_frame:
        errors.append("3D source must derive animation from Remotion useCurrentFrame()")

    if not model_references:
        return
    manifest_path = root / "three-assets.json"
    if not manifest_path.is_file():
        errors.append("3D model references require three-assets.json with source and license provenance")
        return
    manifest = read_json(manifest_path, errors)
    assets = manifest.get("assets")
    if not isinstance(assets, list):
        errors.append("three-assets.json must contain an assets array")
        return
    by_path = {
        item.get("path"): item
        for item in assets
        if isinstance(item, dict) and isinstance(item.get("path"), str)
    }
    for reference in sorted(model_references):
        normalized = reference.removeprefix("/")
        item = by_path.get(normalized)
        if not item:
            errors.append(f"3D model is missing from three-assets.json: {reference}")
            continue
        if not (root / normalized).is_file():
            errors.append(f"3D model file does not exist: {reference}")
        for field in ("source", "license", "upAxis", "unit"):
            if not str(item.get(field, "")).strip():
                errors.append(f"3D model {reference} has no {field} metadata")
        if item.get("reviewed") is not True:
            errors.append(f"3D model {reference} has not passed visual/license review")


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
    check_subtitle_source(root, errors)
    check_caption_review(root, anchor_map, errors)
    check_shots(root, timeline.get("shots", []), anchor_map, errors)
    manifest = check_callout_coverage(root, timeline.get("shots", []), errors)
    check_crop_safety(manifest, timeline.get("shots", []), errors)

    if args.source_root:
        source_root = args.source_root.resolve()
        check_source_literals(source_root, set(anchor_map), errors)
        check_generated_callout_contract(root, source_root, manifest, errors)
        check_three_scene_contract(root, source_root, errors)

    report = {"errors": errors, "timeline": str(timeline_path)}
    out = root / "out"
    out.mkdir(exist_ok=True)
    (out / "timeline-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
