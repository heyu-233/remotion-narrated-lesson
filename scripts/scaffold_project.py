#!/usr/bin/env python3
"""Deprecated V2 standalone scaffolder retained only for recovery.

V4 production uses the configured long-lived series engine and its
`npm run episode:new` command. This script intentionally refuses to create
new projects so stale templates cannot reintroduce the old timing model.
"""
from __future__ import annotations
import argparse
from pathlib import Path

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("destination", type=Path)
    p.add_argument("--template", choices=("narrated", "code-walkthrough"), default="narrated")
    p.parse_args()
    p.error(
        "This V2 scaffolder is disabled. Use the configured series engine and "
        '`npm run episode:new -- <id> --title "..." --mode hybrid`.'
    )

if __name__ == "__main__":
    main()
