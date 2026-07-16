#!/usr/bin/env python3
"""Copy a V2 template into a new narrated-lesson project."""
from __future__ import annotations
import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("destination", type=Path)
    p.add_argument("--template", choices=("narrated", "code-walkthrough"), default="narrated")
    args = p.parse_args()
    source = ROOT / "assets" / "templates" / args.template
    if args.destination.exists() and any(args.destination.iterdir()):
        p.error(f"destination is not empty: {args.destination}")
    shutil.copytree(source, args.destination, dirs_exist_ok=True)
    print(f"Created {args.template} project: {args.destination}")

if __name__ == "__main__":
    main()
