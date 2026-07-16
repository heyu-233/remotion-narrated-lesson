#!/usr/bin/env python3
"""Create an evenly sampled contact sheet from a rendered lesson."""
from __future__ import annotations
import argparse, subprocess
from pathlib import Path

def main() -> None:
    p = argparse.ArgumentParser(); p.add_argument("video", type=Path); p.add_argument("output", type=Path); p.add_argument("--frames", type=int, default=9); args = p.parse_args()
    duration = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(args.video)], text=True).strip()
    if float(duration) <= 0: raise SystemExit("video duration must be positive")
    vf = f"fps={args.frames}/{duration},scale=480:-1,tile=3x3"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-i", str(args.video), "-vf", vf, "-frames:v", "1", "-update", "1", str(args.output)], check=True)

if __name__ == "__main__": main()
