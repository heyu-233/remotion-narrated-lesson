# Engineering animation patterns

Use these patterns for embedded systems, electronics, mechanisms, robotics, and control lessons.

## Stable engineering stage

Build related shots on one persistent stage:

- `background`: grid, environment, track, bench, or document.
- `mechanical`: bodies, fixtures, payloads, dimensions.
- `electrical`: supply, driver, actuator, sensors, current paths.
- `control`: commands, state, feedback, retries.
- `annotation`: labels, warnings, measurements, confidence.
- `camera`: crop and focus only.
- `subtitle`: fixed safe-area layer, unaffected by camera.

Do not collapse electrical isolation, logical separation, and visual separation into the same symbol.

## Module assembly

For modular engineering:

1. Show each module completing a small independent test.
2. Preserve each module's color and connector identity.
3. Dock modules into a shared chassis or signal graph.
4. Run an integrated task.
5. Change only routing, state order, or parameters to demonstrate recomposition.

Avoid generic floating cards. Modules must behave like parts of a working system.

## Geometry and dimensions

- Use source-of-truth numeric dimensions.
- Draw centerlines and section boundaries before dimension labels.
- Derive secondary values in data, not by eye.
- Animate `measure()` as endpoints -> extension lines -> dimension line -> numeric value.
- Show tolerance or clearance as a distinct band, not merely a text note.
- Preserve scale within one explanatory diagram unless an explicit not-to-scale marker appears.

## Mechanism and payload transfer

Model transfer as explicit phases:

```text
approach -> align -> acquire -> verify -> carry -> position -> release -> verify
```

Keep the payload as one persistent actor. Attach it to the carrier only after acquisition succeeds; detach it only when release occurs.

If narration discusses reliability, include at least one failed phase and the corresponding recovery.

## Electrical actuation

Use three synchronized views when useful:

- physical view: actuator and load;
- circuit view: supply, switch/driver, protection, current direction;
- control view: command, sensor feedback, and active state.

Show causality in order:

```text
command -> driver state -> current/field/torque -> mechanical result -> feedback
```

Represent inductive switching, heating, residual magnetism, or reverse drive only when supported by the narration. Do not imply complete galvanic isolation when the design only separates power and logic paths.

## State machine with physical twin

Place the physical system and state graph in one stable composition.

- Highlight exactly one active state.
- Animate the triggering event on the connecting edge.
- Update physical action and state highlight from the same model.
- Keep completed states readable but visually subordinate.
- Inject failures into the physical view first, then show detection and graph transition.

For recovery:

```text
fault appears -> detector changes -> timeout/retry/fallback edge activates
-> physical corrective action -> success/failure confirmation
```

## Test bench

Treat preparation advice as an experiment, not a checklist card.

For each test:

- show the controlled variable;
- show the measured output;
- vary one parameter at a time;
- preserve the baseline for comparison;
- label pass/fail criteria;
- end with the reusable capability that was validated.

Examples include attraction distance, off-axis tolerance, vibration, thermal drift, payload load, ramp angle, communication loss, and final-position error.

## Confidence and inference

Visually distinguish:

- source fact;
- derived engineering consequence;
- author inference;
- low-confidence speculation.

Use separate labels or color treatments. Never animate an inferred quantity as if it appeared in the source document.

## Recommended reusable components

Prefer small deterministic components with semantic props:

```text
EngineeringStage
CameraTransform
DocumentScanner
EvidenceCallout
DimensionLine
ModuleDock
SignalRoute
ActuatorView
PPRCrossSection
BallTransport
VehicleRig
StateMachineGraph
FailureInjection
TestBenchGauge
ConfidenceBadge
```

Components must accept frame-derived progress or serializable state. They must not own autonomous timers.

