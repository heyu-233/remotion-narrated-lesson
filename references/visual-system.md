# Visual system

Use a four-layer stage: `background`, `main`, `flow`, `ui`; subtitles are highest within `ui`. Reserve 930–1050px for subtitles on a 1920×1080 canvas. Keep main structures in 120–760px and support rail in 760–900px.

Use only these motion tokens: `enter.subtle`, `enter.normal`, `enter.dramatic`, `state.change`, `flow.move`, `camera.push`, `camera.reset`, and short `warning.flash`. Fix each token's duration/easing in the project token file. Motion must explain state or flow, never decorate.

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

Treat a concept scene as a sequence of 1.5-5 second micro-shots, not a title plus static cards. Every micro-shot must show a real change: an object appears, fails, resets, assembles, receives a packet, changes state, or becomes the camera focus. Use a small SVG icon when it identifies the object; combine it with the state change rather than adding generic glow.

When adapting an HTML prototype, preserve its narrative mechanism but reimplement each animation from frame/time. Do not carry over `@keyframes`, CSS transitions, timers, or interaction-dependent motion into the final Remotion composition.

Point to objects with short labelled arrows. Do not draw lines through structural panels or subtitles. Minimum text sizes: title 28px, card label 22px, code 18px, supporting text 15px.
