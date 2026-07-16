from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Transcribe episode voiceover with faster-whisper.")
    parser.add_argument(
        "--input",
        default="public/audio/voiceover.m4a",
        help="Path to the voiceover file relative to the project root.",
    )
    parser.add_argument(
        "--output",
        default="public/audio/transcript.json",
        help="Path to the transcript JSON relative to the project root.",
    )
    parser.add_argument(
        "--model",
        default="medium",
        help="Whisper model name. Default is medium for a better Chinese technical transcript.",
    )
    parser.add_argument(
        "--device",
        default="cpu",
        choices=["cpu", "cuda"],
        help="Inference device. Default uses cpu for wider Windows compatibility.",
    )
    parser.add_argument(
        "--compute-type",
        default="int8",
        help="CTranslate2 compute type. Defaults to int8 for CPU.",
    )
    parser.add_argument(
        "--language",
        default="zh",
        help="Language hint passed to Whisper. Defaults to zh.",
    )
    parser.add_argument(
        "--min-silence-ms",
        type=int,
        default=500,
        help="VAD minimum silence duration in milliseconds.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = Path(__file__).resolve().parent.parent
    input_path = (project_root / args.input).resolve()
    output_path = (project_root / args.output).resolve()

    if not input_path.exists():
        print(f"[error] audio file not found: {input_path}", file=sys.stderr)
        return 1

    try:
        from faster_whisper import WhisperModel
    except ModuleNotFoundError:
        print(
            "[error] faster-whisper is not installed.\n"
            "Install it first with: pip install faster-whisper",
            file=sys.stderr,
        )
        return 2

    print(f"[info] loading model={args.model} device={args.device} compute_type={args.compute_type}")
    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(
        str(input_path),
        language=args.language,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": args.min_silence_ms},
    )

    data = {
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": [],
    }

    for index, segment in enumerate(segments, start=1):
        data["segments"].append(
            {
                "id": index,
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": [],
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    generated_ts_path = project_root / "src" / "data" / "transcript.generated.ts"
    ts_lines = [
        "export type TranscriptSegment = {",
        "  id: number;",
        "  start: number;",
        "  end: number;",
        "  text: string;",
        "};",
        "",
        f"export const TRANSCRIPT_LANGUAGE = {json.dumps(data['language'], ensure_ascii=False)};",
        f"export const TRANSCRIPT_DURATION = {data['duration']};",
        "export const TRANSCRIPT_SEGMENTS: TranscriptSegment[] = [",
    ]
    for segment in data["segments"]:
        ts_lines.append(
            f"  {{id: {segment['id']}, start: {segment['start']}, end: {segment['end']}, text: {json.dumps(segment['text'], ensure_ascii=False)}}},"
        )
    ts_lines.append("];")
    generated_ts_path.write_text("\n".join(ts_lines), encoding="utf-8")

    print(f"[ok] transcript written to: {output_path}")
    print(f"[ok] transcript TS written to: {generated_ts_path}")
    print(f"[ok] segments: {len(data['segments'])}, duration: {data['duration']:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
