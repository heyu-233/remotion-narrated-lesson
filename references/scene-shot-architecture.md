# Semantic timing and scene architecture

Use anchors for authored boundaries, beats for changes in meaning, and shots for actual compositions. A stable scene can contain many beats over a longer duration. A 1.5–5 second action is a useful example of pacing, not a required camera-cut interval.

A useful beat description includes intent, state change, introduced information, visible evidence and persistent context. An actual shot change additionally describes camera/crop and continuity: which objects remain, enter or leave. Avoid adding schema fields merely to describe behavior the installed engine already handles simply.

For mechanisms, use a pure domain model such as `stateAt(time)` for facts: list membership, selected task, executing code, saved context and register ownership. Compute visual labels and charts from those facts. Presentation selectors may separately derive disclosure, focus and easing from the same timeline. This allows A to be the model's initial running task while its execution label waits until A is introduced.

Animation progress predicates are legitimate for visual interpolation. They must not separately redefine domain facts or maintain an independent clock. Prefer semantic events or anchor start/end over copied numeric durations. Sound effects resolve against those same boundaries.

For batches, reuse an accepted explanatory pattern and tested adapters; keep the new domain model and teaching order episode-specific. See mechanism-storytelling.md, sound-design.md and batch-production.md.
