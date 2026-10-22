# Reusing accepted mechanisms across episodes

Use accepted examples as evidence for an explanatory pattern, not a fixed arrangement of boxes. Batch reliability requires a shared contract and tested tools as well as prompt guidance.

## Select a relevant pattern

| Pattern | Reusable part | Episode-specific part |
| --- | --- | --- |
| Stable mechanism stage | Persistent object identity, local state changes, settled evidence | Physical/data model and layout |
| Progressive relationships | Retain known objects while introducing connections and new objects | Relationship order and disclosure anchors |
| Execution/progress strip | Separate executor status from the data it changes | Whether a strip is appropriate; code/task phases |
| Control/feedback loop | One model drives actuation, error, feedback and trace | Plant, controller, scenario, illustrative units |
| Event-anchored foley | Cue resolution, stems, manifest, verification | Which events merit cues and their relative gains |

The 2026-10-22 local pilots are useful references if present: `motor-feedback-study` (24s control-loop model) and `rtos-scheduling-study` v5 (65s relationship introduction, stable data stage and progressively disclosed CPU execution strip). Their duration, 8/14 cues, dark palette and RTOS symbols are not universal defaults. Locate the configured engine; do not hard-code the original user's absolute paths into a new episode.

## A practical production pass

1. Read the relevant accepted output and the user's corrections. Define what must match and what can adapt.
2. Specify the new conclusion, domain roles, relationship graph, critical states and disclosures. Choose a relevant pattern.
3. Author semantic beats and sound events in one timeline. A beat can keep the same view.
4. Verify a representative mechanism slice with its real model, labels, connector routing and sound palette. An existing authorization to make the preview remains valid; do not add an approval gate automatically.
5. Propagate the tested behavior, then inspect the complete episode and critical before/after states. Preserve a concise current-status review and revision outputs when useful.

Do not batch-propagate an untested visual rule merely because it looked good in one still. First check the pattern on a different mechanism or new input. A pipeline is not production-proven for arbitrary topics because two pilots succeeded.

## Share behavior at the right boundary

Prefer shared utilities for event resolution, audio synthesis/verification, rendering/mux fallback and QC. Keep episode facts and custom hero motion inside the episode. Promote a component when it demonstrably serves multiple episodes or series identity; avoid a generic mega-diagram schema that forces unrelated topics into identical cards.

Rendering uses Remotion's frame clock. If the installed renderer fails during audio preprocessing, inspect the actual error before retrying. The pilots used Remotion frame rendering plus installed FFmpeg for encoding/mux after a Windows temp-audio failure. Treat this as a documented fallback, not a reason to mutate dependencies or rebuild every project. Validate the resulting frame count, audio offset and codecs.

## Integration status and migration

The V5 skill supplies reusable foley tooling and revised production guidance. It does not itself patch the configured engine. Inspect `types.ts`, composition audio handling, episode generator and phase validator before claiming support for:

- typed sound events and multiple audio tracks;
- narrated / foley-only / silent validation;
- programmatic-keyframe or explicit direct-preview records;
- batch rendering, mux fallback and automated freshness/QC reports.

When engine changes are in scope, migrate those together, preserve existing episode IDs/assets, and test old narrated episodes plus a new foley-only episode. Add behavior checks for end-anchored cue retiming and stale audio rejection. Do not silence legacy validator errors globally to make one preview pass.
