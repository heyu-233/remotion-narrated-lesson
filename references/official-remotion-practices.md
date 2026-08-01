# Official Remotion practices

Use this reference before implementing or upgrading Remotion markup. It summarizes the official `remotion-dev/skills` repository reviewed at commit `65de6a50152d7e558597fa4fe0cdd5e7e1a43d7e`.

The narrated lesson's semantic timeline and evidence contracts take precedence when generic Studio-editing guidance conflicts with them.

## Runtime and assets

- Use `useCurrentFrame()` as the animation clock.
- Use `interpolate()` with `extrapolateLeft: "clamp"` and `extrapolateRight: "clamp"` for bounded motion.
- Prefer explicit `Easing.bezier()` curves. Use a spring only when physics or overshoot communicates meaning.
- Do not use CSS transitions, CSS animations, Tailwind animation classes, timers, or autonomous browser animation.
- Put local assets in `public/` and resolve them with `staticFile()`.
- Render images with `<Img>`.
- Import `<Audio>` and `<Video>` from `@remotion/media`.
- Install Remotion ecosystem packages with `npx remotion add <package>` to keep versions compatible.

## Composition and sequencing

- Use `<Sequence>` to delay or bound a layer. Remember that `useCurrentFrame()` is local inside a sequence.
- Set `layout="none"` for inline elements and sequences inside `<ThreeCanvas>`.
- Add descriptive `name` props to major sequences and editable elements.
- Premount sequences that load media, fonts, measured layout, or expensive scenes before their first visible frame.
- Use `<Series>` for consecutive scenes and an explicit negative offset only for intentional overlap.
- Use `TransitionSeries` only when a transition should shorten the combined duration. An overlay does not change duration.
- Recalculate total duration after adding a transition because adjacent scenes overlap.
- Do not let a convenience sequencing component create a second timing authority. Resolve semantic anchors into frames first.

## Motion and Studio editing

- Prefer individual CSS `translate`, `scale`, and `rotate` properties over an opaque transform string when practical.
- Keep an `interpolate()` inline in a style prop when Studio keyframe editing is a real requirement.
- Otherwise compute one normalized progress value and derive several coordinated properties from it.
- Use `Interactive.*` only for elements the user is expected to manipulate in Studio. Give each one a descriptive name.
- Keep authored video clips explicit when Studio ripple editing is required. For semantic narrated lessons, generated shot markup is acceptable when it remains derived from `timeline.json`.

## Media

- Trim embedded video with source-frame trim props and place it inside the shot's local `<Sequence>`.
- Use `playbackRate` for speed matching; calculate the visible source interval and verify the ending frame.
- Use `muted` for supporting footage unless source sound is intentionally part of the mix.
- Do not reverse video; pre-render a reversed asset if explicitly required.
- Use media metadata rather than assumed dimensions or duration.

## Text and layout

- Load fonts before measuring text.
- Use `measureText()`, `fitText()`, or `fillTextBox()` from `@remotion/layout-utils` for dynamic or user-supplied text.
- Match measurement and render font properties exactly.
- Prefer `outline` over `border` when a diagnostic stroke must not affect layout.
- Fail validation on important text overflow; do not silently shrink technical labels below the visual-system minimum.

## Images, effects, and 3D

- Preserve image aspect ratio and source-pixel coordinates before applying crops or camera transforms.
- Prefer ordinary HTML/CSS/SVG, filters, masks, and blend modes before specialized effects.
- Use 3D only when depth, occlusion, or mechanical articulation materially improves understanding.
- Wrap 3D in `<ThreeCanvas width={width} height={height}>`, provide lighting, and drive all motion from `useCurrentFrame()`.
- Never use React Three Fiber's `useFrame()` in a Remotion composition.

## Source maintenance

When deliberately refreshing this reference:

1. Fetch the current `remotion-dev/skills` repository.
2. Review `remotion-best-practices/SKILL.md` and only the routed references relevant to this skill.
3. Update the reviewed commit above.
4. Reconcile changed APIs with templates and scripts.
5. Validate a representative project before accepting the refresh.

