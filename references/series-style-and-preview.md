# Series style and preview contract

Use this reference when a lesson belongs to an existing series, the user supplies a visual reference, or the user wants to inspect the Remotion project before rendering.

## Extract the baseline before designing

Inspect the strongest available evidence in this order:

1. the previous approved final video or representative frames;
2. its contact sheet and storyboard review;
3. the previous project's visual-system and scene components;
4. user-supplied screenshots, covers, or explicit corrections.

Maintain the recurring baseline in `series/visual-baseline.md`. Record episode-specific departures in `episodes/<id>/storyboard.md` with three sections:

- `must match`: exact background treatment, grid, palette, typography, subtitle treatment, evidence framing, and recurring identity;
- `may adapt`: scene-specific layout, diagram topology, accent color, and transition choice;
- `must remove`: rejected zooms, unexplained bars, decorative rails, generic cards, gradients, excessive framing, or other explicit negative feedback.

Record concrete tokens where possible: background color, grid spacing and alpha, safe areas, main-content bounds, font families and minimum sizes, border radius, stroke width, shadow intensity, and allowed camera behavior. A verbal label such as “科技感” is not a usable baseline by itself.

## Composition and density

- Start from the teaching target, then add only the context needed to understand it.
- The main target must be readable in a 1920x1080 frame viewed at normal scale. If it is not, crop the evidence, split the shot, or simplify the diagram.
- Avoid nesting the target inside a stage panel, then a card, then another bordered container. Each frame consumes area and must justify itself.
- Use persistent chrome only when it carries navigation, state, hierarchy, or provenance. A decorative strip, chapter rail, command bar, or badge with no active role should not ship.
- Match the approved background exactly. “Black grid” means an explicit black base plus declared grid color, alpha, and spacing; do not silently replace it with a navy gradient or tinted panel field.

## Camera policy

Evidence is static by default. First try a reviewed source crop, larger placement, or a cut to a detail shot.

Use a camera push or pan only when all of these are true:

- the target is named in the shot list;
- the movement reveals or disambiguates information that is not already readable;
- start and end transforms preserve spatial continuity;
- the move settles before the narration advances;
- the target and subtitle safe area remain fully visible.

Do not use a centre-origin zoom merely to make a static shot feel animated. Do not hard-cut between unrelated scales. Large scale changes require a documented pedagogical reason and internal visual inspection.

## Flowchart-style concept animation

When flowchart examples are requested or available as the series reference, inspect the relevant examples before implementation. Extract:

- which domain objects stay on screen;
- the causal order in which objects appear;
- how connections are drawn;
- what state changes when a packet or signal arrives;
- what the settled explanatory frame looks like.

Rebuild the selected mechanism with `useCurrentFrame()`, `interpolate()`, and semantic timeline anchors. Continuous particles, breathing glow, hover interactions, and CSS keyframes from an HTML example are not automatically appropriate for a narrated Remotion video.

## Implementation fidelity preview

The selected preproduction route and accepted series baseline define visual direction. Review a representative styled slice; include the parts relevant to this episode:

- one concept diagram at start, action, and settled states;
- one evidence screenshot at its actual crop and scale;
- subtitles and the real background/chrome treatment.

Use representative rendered stills or the live Studio preview to compare implementation with the selected baseline and critical technical states. Record paths and findings in `episodes/<id>/visual-review.md`. If the user requested keyframe review, honor it; otherwise this internal check can precede the authorized preview without another gate. See keyframe-preproduction.md for route selection.

Propagate the internally verified tokens and components. If user feedback later rejects a motif, remove it from shared components first so it cannot survive in other scenes.

Provide the requested Studio or playable preview using existing authorization. Export the requested preview/final file, and keep publication or release approval distinct. Do not ask again for an export already requested.
