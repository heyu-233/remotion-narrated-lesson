# Motion design language

Use this reference for concept-heavy scenes. It adapts useful ideas from Motion Canvas—scenes, signals, flows, tweening, and voiceover-oriented vector choreography—without adding Motion Canvas as a dependency.

Remotion remains the only clock and renderer.

## Design model

Describe every shot with:

```text
stage + actors + state + action + camera + evidence + handoff
```

- `stage`: stable spatial world shared by related shots.
- `actors`: persistent objects with stable IDs and visual identities.
- `state`: one serializable model from which every layer renders.
- `action`: semantic change occurring in the shot.
- `camera`: focus, crop, or viewpoint change.
- `evidence`: visible fact that proves the narration claim.
- `handoff`: final arrangement inherited by the next shot.

Do not start by listing decorative effects.

## Translate concepts into Remotion

| Design concept | Remotion implementation |
| --- | --- |
| scene graph | React component tree |
| signal | value derived from frame, props, and scene state |
| tween | clamped `interpolate()` over an explicit frame range |
| sequence | consecutive semantic action windows or `<Sequence>` |
| parallel flow | several properties derived from one normalized progress |
| chain | adjacent action windows with named boundaries |
| scene transition | continuity handoff or `TransitionSeries` |
| generator pause | explicit hold range tied to narration |
| camera node | deterministic camera transform component |

Do not emulate generators with mutable runtime state. Calculate the result for any frame directly.

## Semantic action vocabulary

Use these verbs in outlines, prototypes, and component APIs:

- `reveal(actor)`: introduce an actor and establish identity.
- `focus(actor)`: move visual priority without destroying stage continuity.
- `scan(document, target)`: search a source, settle on a verified target, and expose a callout.
- `dock(module, socket)`: align, approach, seat, and confirm a module connection.
- `undock(module)`: disengage while preserving where it came from.
- `route(signal, path)`: show causality along a known route.
- `trace(path)`: progressively disclose geometry or a signal path.
- `measure(a, b, value)`: establish endpoints, draw a dimension line, then show the value.
- `transfer(object, source, destination)`: preserve object identity through pickup, travel, and release.
- `actuate(device, command)`: connect command, physical response, and feedback.
- `compare(a, b)`: hold a stable baseline while changing one relevant variable.
- `injectFailure(type)`: visibly perturb the running system.
- `recover(strategy)`: show detection, fallback, retry, and restored state.
- `transitionState(from, to, event)`: animate both the state graph and physical consequence.
- `explode(assembly)`: separate parts along meaningful assembly axes.
- `recompose(logic)`: keep modules fixed while changing their connections or task order.

Every action must end in a readable state. Avoid perpetual motion.

## Shot grammar

Use this default grammar:

1. `setup`: establish actors and the initial condition.
2. `action`: perform one primary change.
3. `settle`: decelerate and allow the viewer to read the result.
4. `evidence`: emphasize the measurement, state, or causal link.
5. `handoff`: leave actors positioned for the next shot.

A 1.5–5 second shot usually supports one primary action. Split a shot when two actions require different evidence or camera focus.

## Continuity rules

- Give recurring objects stable IDs, colors, proportions, and attachment points.
- Keep the same object on screen across transfer and state-change shots when possible.
- Move the camera before rebuilding the stage.
- Preserve the final frame of shot A as the initial state of shot B unless a cut is intentional.
- Use an `objectStateAt(frame)` or equivalent pure selector for complex actors.
- Separate world coordinates from camera transforms and from subtitle/UI coordinates.

## Timing rules

- Define semantic action boundaries relative to narration anchors, then resolve them to local frames.
- Use ease-out for arrival, ease-in for departure, and balanced ease-in-out for camera moves.
- Reserve overshoot for physical mechanisms, elastic connectors, or deliberate attention cues.
- Let a meaningful result hold long enough to be read; do not fill the hold with decorative loops.
- Synchronize simultaneous actions through one normalized progress value when they express one cause.
- Offset actions when the viewer must perceive cause before effect.

## Optional prototype workflow

An internal prototype may help before full Remotion implementation when any of these is true:

- the audience may misunderstand spatial geometry;
- three or more objects must exchange identity or state;
- camera motion and object motion happen together;
- a failure path must return to a valid state;
- the shot depends on occlusion, mechanical clearance, or dimension accuracy.

The prototype should demonstrate the narrative mechanism, not visual polish. Evaluate its spatial logic and action order internally, then rebuild the selected behavior frame-first in Remotion. A prototype is not a user-review gate: do not stop production or request approval unless the user explicitly asks to review the prototype or confirm the animation direction.

## Dependency boundary

Do not install Motion Canvas for ordinary narrated lessons. Consider a separate Motion Canvas project only when the user explicitly requests it and the result will be rendered as a self-contained asset. Document its frame rate, alpha/audio behavior, duration, and insertion anchor before importing it into Remotion.
