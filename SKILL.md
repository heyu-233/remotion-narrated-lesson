---
name: remotion-narrated-lesson
description: Produce and maintain technical-video series in a reusable Remotion engine, including narrated lessons, mechanism animations, diagram or evidence-led episodes, and previews with event-anchored sound effects. Use for semantic timing, revisions, rendering, and series-engine maintenance, not ordinary non-video React work.
---

# Remotion Series Production V5

Use a maintained series engine instead of creating a new Remotion application for every video. The engine owns runtime dependencies, visual tokens, animation primitives, timeline resolution, subtitles, validation, registration, and rendering. Each episode owns only its content, assets, semantic timeline, and custom scenes.

## Locate the engine

1. Honor an engine path explicitly supplied by the user.
2. Otherwise read `engine.config.json` in this skill and use `defaultEngineRoot`.
3. Confirm the directory and run `npm run doctor` before changing an episode or the engine.
4. If the engine does not exist, stop and ask where it should be created. Do not silently scaffold a second project.

Read [engine-contract.md](references/engine-contract.md) whenever creating, migrating, or registering an episode.

## Route the task

- **Produce or revise an episode:** read [workflows.md](references/workflows.md), [keyframe-preproduction.md](references/keyframe-preproduction.md), and [phase-validation.md](references/phase-validation.md).
- **Change shared components, schemas, dependencies, or tooling:** also read [engine-maintenance.md](references/engine-maintenance.md).
- **Screenshot, terminal, or UI evidence:** read the screenshot-led section of [recording-and-motion.md](references/recording-and-motion.md).
- **Code-led explanation:** read [code-walkthrough.md](references/code-walkthrough.md).
- **Complex diagrams or choreography:** read [motion-design-language.md](references/motion-design-language.md); add [engineering-animation-patterns.md](references/engineering-animation-patterns.md) when mechanisms or system state are central.
- **Mechanism explanation or relationship diagrams:** also read [mechanism-storytelling.md](references/mechanism-storytelling.md). Establish roles and relationships before choosing reveals or camera movement.
- **Automatic sound effects:** read [sound-design.md](references/sound-design.md); use the shared `scripts/foley.mjs` tool instead of copying episode-specific synthesis scripts.
- **Batch episodes or reuse of an accepted animation:** read [batch-production.md](references/batch-production.md). Reuse the explanatory pattern and tested tools while adapting the subject model.
- **3D:** read [three-dimensional-scenes.md](references/three-dimensional-scenes.md).
- **New or changed visual direction:** read [series-style-and-preview.md](references/series-style-and-preview.md) and inspect a representative styled slice before propagating it.
- **Remotion API or dependency changes:** read [official-remotion-practices.md](references/official-remotion-practices.md).
- **Final delivery:** read [quality-gates.md](references/quality-gates.md).

Read only the references needed for the current route.

## Production invariants

- Keep Remotion as the frame clock, preview environment, and renderer. External tools may supply separately rendered assets only when the user requests that workflow.
- A finished episode has one authored timing authority: `episodes/<id>/timeline.json`.
- Captions reference narration anchors; shots reference semantic start and end anchors. Raw ASR is evidence and must not become a second runtime timeline.
- Components are pure functions of frame, episode state, and declared assets. Do not use CSS animation, timers, wall-clock time, `useEffect()` as a clock, or unseeded randomness.
- Put recurring style and behavior in the engine. Put episode-specific meaning and exceptional hero animation in the episode.
- Use standard engine scenes for repeated grammar, but keep a custom-scene escape hatch. Do not force every idea into generic cards.
- Operation language defaults to real evidence; animation explains relationships, causality, invisible state, and mechanisms.
- Camera motion is opt-in and needs a named teaching target.
- A semantic beat does not require a camera change. Keep related objects spatially stable while a causal chain unfolds; several related objects may share one explanatory focus.
- Separate domain facts from their presentation. Model state owns facts such as selected/executing task; semantic anchors own when a fact is introduced or emphasized. A fact may exist before it should be revealed.
- Sound effects reference semantic event boundaries in the same timeline. Rebuild and verify derived audio when those events change.
- Preserve the subtitle safe area and readable 1920x1080 composition.
- Select an appropriate visual-preproduction route using [keyframe-preproduction.md](references/keyframe-preproduction.md): image references, rendered programmatic keyframes, or an authorized direct preview. Respect explicit user review gates and existing waivers; never invent approval or turn every internal artifact into another permission request.

## Working rhythm

Narration-first, visual-first, and evidence-first starts are all valid. Use available final audio when it exists; otherwise visual planning or a temporary timing track may proceed without pretending it is final.

For a new episode:

1. Run `npm run episode:new -- <id> --title "<title>" --mode <mode>`.
2. Replace the generated draft contract with the real script, anchors, shots, assets, and visual thesis; run draft validation.
3. Define the teaching relationship, domain state, disclosure order, and relevant audio mode. Choose the preproduction route; inspect representative technical states internally before propagating the design.
4. Record the selected route, sample-frame mapping, animation plan, and any actual user approval or waiver. Wait only for a review the user requested or a material unresolved choice.
5. Implement the episode using its state model and semantic anchors. Validate according to the installed engine's actual capabilities; [phase-validation.md](references/phase-validation.md) explains legacy-validator mismatches.
6. Generate event-anchored foley when requested, inspect a playable preview and critical state boundaries, and preserve a concise review record.
7. Render the requested preview or final export within existing authorization, then check the encoded media. A requested preview does not imply publication approval.

Do not add fixed approval counts. Ask only when a meaningful creative choice, external action, or final export is not already resolved or authorized by the user's request.
