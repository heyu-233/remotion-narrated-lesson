# Visual system

Use a four-layer stage: `background`, `main`, `flow`, `ui`; subtitles are highest within `ui`. Reserve 930–1050px for subtitles on a 1920×1080 canvas. Keep main structures in 120–760px and support rail in 760–900px.

Reuse the established motion tokens where appropriate: `enter.subtle`, `enter.normal`, `enter.dramatic`, `state.change`, `flow.move`, `camera.push`, `camera.reset`, and short `warning.flash`. Keep their duration/easing in the project token file; add a token only when a recurring semantic action needs one. Motion must explain state or flow, never decorate.

For a continuing series, derive colors, grid, typography, stage chrome, and motion-token behavior from its approved visual baseline before using these defaults. Declare the background as exact tokens—base color, optional grid color/alpha/spacing, and any gradient. Do not substitute a tinted or gradient background for an approved pure-black grid.

Start with this readable 30 fps timing profile unless the narration or shot length requires a change:

| Token | Recommended duration |
| --- | ---: |
| `enter.subtle` | 0.30 s |
| `enter.normal` | 0.45 s |
| `enter.dramatic` | 0.68 s |
| `state.change` | 0.92 s |
| `flow.move` | 1.70 s |
| `camera.push` | 2.00 s |
| `camera.reset` | 0.82 s |
| `warning.flash` | 0.24 s |

Treat `state.change`, `flow.move`, and `camera.push` as comprehension motion, not UI micro-interactions. Avoid shortening them below roughly 0.8 s, 1.5 s, and 1.8 s respectively unless the spoken phrase is too short. Complete the action, then hold the settled result; do not stretch movement across the entire narration phrase.

`camera.push` is opt-in, not a default way to animate static evidence. Prefer a tighter source crop, larger placement, or a deliberate cut. Every push or pan must name its target and reason in the shot list, preserve continuity from the previous transform, and settle before the next spoken step. Avoid centre-origin zooms and abrupt scale jumps.

Build concept scenes from semantic beats. Changes can include a relationship becoming clear, a pointer update, a state transition or a useful settled comparison, all in the same view. Do not interpret a 1.5–5 second pacing example as a requirement to cut, zoom or move something repeatedly. Use SVG symbols when they identify the subject; do not add generic glow or motion to fill a reading hold.

When adapting an HTML prototype, preserve its narrative mechanism but reimplement each animation from frame/time. Do not carry over `@keyframes`, CSS transitions, timers, or interaction-dependent motion into the final Remotion composition.

Point to objects with short labelled arrows. Do not draw lines through structural panels or subtitles. Minimum text sizes: title 28px, card label 22px, code 18px, supporting text 15px.

Make the main teaching target dominate the usable stage. Judge size at the final 1920x1080 output scale, not while zoomed into the browser. Remove nested wrappers, side rails, status strips, and badges that reduce the target without carrying active information. Persistent chrome must communicate navigation, state, hierarchy, or provenance.
