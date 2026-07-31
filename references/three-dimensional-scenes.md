# Deterministic 3D scenes

Use 3D only when depth, occlusion, camera movement, or mechanical articulation improves the explanation. Keep real operations and their results in screenshot or approved recording evidence.

## Supported stack

Use this stack for React 19 projects:

```text
@remotion/three
@react-three/fiber 9.x
@react-three/drei
three
@react-three/postprocessing (optional)
```

Install `@remotion/three` at the exact project Remotion version:

```bash
npx remotion add @remotion/three
```

Then install compatible third-party packages with the project's package manager. Use `ThreeCanvas` from `@remotion/three`; never mount the raw R3F `Canvas` in a composition.

## Responsibility boundary

- `timeline.json` owns narration, subtitles, shot bounds, and every transition between teaching states.
- Remotion owns the frame, preview, and render.
- React Three Fiber expresses scene geometry only.
- Drei provides deterministic geometry, cameras, lights, and loaders.
- Postprocessing may improve legibility, but effects must remain restrained and frame-stable.
- Triplex may help author spatial values. Copy only reviewed positions, rotations, materials, and camera values into source control.
- Theatre.js, browser timers, CSS animation, and autonomous physics cannot control the final composition.

## Scene structure

Put reusable 3D code under:

```text
src/three/
  components/
  scenes/
  materials/
public/models/
public/textures/
public/hdri/
```

Keep labels, subtitles, code, and long Chinese text in the Remotion HTML layer unless depth is essential. This avoids font-loading uncertainty and keeps text outside camera clipping.

Implement each complex shot as:

`setup -> action -> settle -> evidence -> handoff`

The handoff should return to real evidence when the narration claims that a command, driver, or target system actually worked.

## One clock

Every animated value must be derived from `useCurrentFrame()` and reviewed semantic anchors:

```tsx
const frame = useCurrentFrame();
const start = anchorStartFrame("driver.path.start");
const end = anchorEndFrame("driver.path.transfer");
const progress = interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

A standalone prototype Composition may use local frame ranges while its pacing is being reviewed. Before insertion into a narrated lesson, replace those ranges with named timeline anchors.

Never use these in project 3D source:

- `useFrame()`
- raw R3F `<Canvas>`
- `useEffect()` or `useLayoutEffect()` to animate scene state
- `setTimeout()` or `setInterval()`
- `Date.now()` or `performance.now()`
- unseeded `Math.random()`
- Theatre.js as a runtime timeline

## Models and provenance

Procedural geometry needs no asset manifest. Any `.glb` or `.gltf` reference requires `<project>/three-assets.json`:

```json
{
  "assets": [
    {
      "path": "public/models/arm-board.glb",
      "source": "https://example.com/model",
      "license": "CC-BY-4.0",
      "upAxis": "Y",
      "unit": "meter",
      "reviewed": true
    }
  ]
}
```

Normalize model scale, origin, and axis before choreography. Do not rely on a remote CDN during preview or render.

## Required QC

1. Run ESLint and TypeScript.
2. Run `validate_timeline.py` with `--source-root`; it rejects autonomous clocks, raw Canvas, unreviewed models, and missing provenance.
3. Render stills for setup, every action transition, settle, and handoff.
4. Inspect framing, occlusion, material clipping, text alignment, subtitle safe area, and black first frames.
5. Render a short prototype before inserting the scene into a full lesson.
6. Generate the normal contact sheet after full integration.

Use one canvas for a continuous scene. Avoid multiple simultaneous WebGL canvases unless a reviewed shot design requires them.
