# Mechanism explanation and relationship choreography

Use this reference for invisible operations, data structures, control loops, task switching, or other stateful engineering explanations. Apply the relevant patterns; do not impose the RTOS layout, palette, duration, or executor strip on every topic.

## Establish meaning before movement

Identify the teaching conclusion and the roles that matter:

- domain objects: structures, devices, tasks, signals, stacks;
- executor or causal agent, if relevant: which code or process changes them;
- relationships: pointer, ownership, membership, signal path, or physical coupling;
- state transitions: what changes, in which order, and what visible evidence proves it.

Keep these meanings distinct. A CPU executing kernel code and a linked list modified by that code are different kinds of thing. Drawing both as peer boxes exchanging animated packets can imply an architecture that does not exist. Use an execution strip, cursor, code location, or another appropriate cue when it clarifies agency. In a physical motor/control loop, persistent plant, controller and feedback paths may be the right representation instead.

## Reveal relationships, retain context

Build the next idea from what the viewer already understands. For example: introduce a TCB, retain it while its stack pointer connects to a task stack, then reveal the embedded list item's membership and its owner pointer. Several objects can remain visible because their relationship is the lesson.

Avoid both extremes: an unexplained complete architecture at frame zero, and isolated component close-ups that erase the relationship between them. Let earlier context become quieter while the current operation gains emphasis. Add a new stage only when the content benefits from it.

Separate `introduced`, `visible`, and `active`. A single-core CPU can already be running A in the model while the opening still introduces TCBs; the active-A display should wait until the explanation introduces A's execution. Anchor that disclosure in the timeline. Do not corrupt the domain state to delay a label.

## A stable causal stage

Default to stable positions during a related operation. Local highlights, pointer rewiring, changing values and holds can explain a whole causal sequence without changing the view. A new semantic beat is not a new camera shot. Do not enforce a camera count, a maximum object count, or a universal shot duration.

Move the camera when it reveals evidence that cannot otherwise be read, establishes a needed spatial relationship, or deliberately hands off to a different teaching stage. Name that reason, preserve continuity, and settle before the next important change. Do not follow every transient register, pointer, or packet merely because it moves. Do not add motion to fill a useful reading hold.

## Connector semantics

Give each visible connection a readable source, destination and meaning:

- pointer/ownership: a labelled connection to the object or field it references;
- list next/previous: topology edges, with direction clear at settled states;
- actual signal/data flow: animate along a real causal path when needed;
- execution/progress: a distinct status or code cue, not an invented data bus.

Use local connector lanes and attachment points. Put semantic-owner links outside next/previous return loops. Avoid paths through unrelated objects, duplicate arrows that communicate the same fact, and long perimeter wires. A transient pointer update may be one-sided before the operation completes; judge the stable state against the real algorithm. Do not silently replace a circular list with a linear list to simplify the drawing.

## State and evidence

Use a pure `stateAt(time)` for domain facts. Presentation selectors can derive visibility, focus and pulse envelopes from semantic anchors; they must not redefine domain facts independently.

For RTOS-style examples, selected task, executing code, software-register ownership and task stack pointer can differ during a switch. The accepted single-core Cortex-M/FreeRTOS example exposes the critical boundary: `pxCurrentTCB=B` while CPU still executes PendSV; exception return completes the handoff. Handler mode uses MSP; PSP identifies the task stack. Verify the actual kernel, port and floating-point scope before transferring that sequence to another target. Symbolic PC labels are not measured register addresses.

For control loops, derive the actuator, feedback value, error, controller response and trace from one model. State which values are normalized or illustrative rather than measured.

Inspect before, during and after the state changes most likely to be misunderstood. Check technical facts and whether the viewer can infer the intended cause. Automated invariant checks and a readable preview provide different evidence; neither replaces the other.
